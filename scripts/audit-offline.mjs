const baseUrl = process.env.SITE_URL || "http://127.0.0.1:8000";
const cdpListUrl = process.env.CDP_LIST_URL || "http://127.0.0.1:9229/json/list";

let commandId = 0;
const pending = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pageTargetUrl() {
  const response = await fetch(cdpListUrl);
  if (!response.ok) {
    throw new Error(`Could not read CDP targets from ${cdpListUrl}: ${response.status}`);
  }

  const targets = await response.json();
  const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!page) throw new Error(`No page target found at ${cdpListUrl}`);
  return page.webSocketDebuggerUrl;
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const message = { id: ++commandId, method, params };
    const timeout = setTimeout(() => {
      if (!pending.has(message.id)) return;
      pending.delete(message.id);
      reject(new Error(`Timeout: ${method}`));
    }, 25000);
    pending.set(message.id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });
    ws.send(JSON.stringify(message));
  });
}

async function evaluate(ws, expression, awaitPromise = false) {
  const result = await send(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        "Runtime exception",
    );
  }

  return result.result.value;
}

function siteUrl(path) {
  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).href;
}

async function setOffline(ws, offline) {
  await send(ws, "Network.emulateNetworkConditions", {
    offline,
    latency: 0,
    downloadThroughput: offline ? 0 : -1,
    uploadThroughput: offline ? 0 : -1,
  });
}

async function resetServiceWorkerState(ws) {
  await evaluate(
    ws,
    `(() => {
      localStorage.removeItem("sketch-is-more:last-visit");
      localStorage.removeItem("sketch-is-more:last-reader-page");
      return navigator.serviceWorker?.getRegistrations
        ? navigator.serviceWorker.getRegistrations()
            .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
            .then(() => caches?.keys ? caches.keys() : [])
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .then(() => true)
        : true;
    })()`,
    true,
  );
}

async function primeServiceWorker(ws) {
  await send(ws, "Page.navigate", { url: siteUrl("index.html?offline-prime") });
  await sleep(5000);
  const firstPass = await evaluate(
    ws,
    `navigator.serviceWorker?.ready
      ? navigator.serviceWorker.ready
          .then(() => caches.keys())
          .then((keys) => ({
            controlled: Boolean(navigator.serviceWorker.controller),
            cacheKeys: keys,
          }))
      : { controlled: false, cacheKeys: [] }`,
    true,
  );

  if (!firstPass.cacheKeys.some((key) => key.includes("sketch-is-more-v"))) {
    await sleep(3000);
  }

  await send(ws, "Page.reload", { ignoreCache: true });
  await sleep(2500);
  return evaluate(
    ws,
    `navigator.serviceWorker?.ready
      ? navigator.serviceWorker.ready
          .then(() => caches.keys())
          .then((keys) => ({
            controlled: Boolean(navigator.serviceWorker.controller),
            cacheKeys: keys,
          }))
      : { controlled: false, cacheKeys: [] }`,
    true,
  );
}

async function setSavedReaderPage(ws, page) {
  await evaluate(
    ws,
    `(() => {
      localStorage.setItem("sketch-is-more:last-reader-page", "${page}");
      localStorage.removeItem("sketch-is-more:last-visit");
      return true;
    })()`,
  );
}

async function auditCurrentPage(ws, label, expected = {}) {
  await sleep(2500);
  return evaluate(
    ws,
    `(() => {
      const readerPages = [...document.querySelectorAll(".reader-frame img")]
        .map((img) => Number((img.getAttribute("src") || "").match(/\\/(\\d+)\\.webp(?:$|[?#])/)?.[1]))
        .filter(Number.isFinite);
      const readerKind = document.querySelector(".reader-spread")
        ? "feature-spread"
        : document.querySelector(".reader-book")
          ? "book-pair"
          : document.querySelector(".reader-page")
            ? "single"
            : null;
      const visibleIncompleteImages = [...document.images]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.top < innerHeight && rect.bottom > 0;
        })
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute("src"));

      const continueLink = document.querySelector("[data-continue-reading]");
      const continueReading = continueLink
        ? {
            visible: !!(continueLink.offsetWidth || continueLink.offsetHeight || continueLink.getClientRects().length) &&
              getComputedStyle(continueLink).visibility !== "hidden" &&
              getComputedStyle(continueLink).display !== "none",
            text: continueLink.textContent.trim().replace(/\\s+/g, " "),
            href: continueLink.getAttribute("href"),
            expectedVisible: ${Boolean(expected.continueVisible)},
            expectedHref: ${JSON.stringify(expected.continueHref ?? null)},
          }
        : null;

      return {
        label: "${label}",
        path: location.pathname.split("/").pop() || "index.html",
        hash: location.hash,
        title: document.title,
        controlled: Boolean(navigator.serviceWorker?.controller),
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        visibleIncompleteImages,
        readerKind,
        readerPages,
        expectedReaderPages: ${JSON.stringify(expected.readerPages ?? null)},
        continueReading,
      };
    })()`,
  );
}

async function main() {
  const wsUrl = await pageTargetUrl();
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (!data.id || !pending.has(data.id)) return;

    const handlers = pending.get(data.id);
    pending.delete(data.id);
    data.error ? handlers.reject(new Error(JSON.stringify(data.error))) : handlers.resolve(data.result);
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  try {
    await send(ws, "Page.enable");
    await send(ws, "Runtime.enable");
    await send(ws, "Network.enable");
    await send(ws, "Network.setBypassServiceWorker", { bypass: false });
    await send(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await setOffline(ws, false);

    await send(ws, "Page.navigate", { url: siteUrl("index.html?offline-reset") });
    await sleep(1200);
    await resetServiceWorkerState(ws);
    const prime = await primeServiceWorker(ws);

    await setOffline(ws, true);
    await evaluate(
      ws,
      `(() => {
        localStorage.removeItem("sketch-is-more:last-visit");
        localStorage.removeItem("sketch-is-more:last-reader-page");
        return true;
      })()`,
    );
    await send(ws, "Page.navigate", { url: siteUrl("index.html?offline-home") });
    const home = await auditCurrentPage(ws, "offline-home");

    await setSavedReaderPage(ws, 66);
    await send(ws, "Page.navigate", { url: siteUrl("index.html?offline-returning") });
    const returningHome = await auditCurrentPage(ws, "offline-returning-home", {
      continueVisible: true,
      continueHref: "./reader.html#page-66",
    });

    await send(ws, "Page.navigate", { url: siteUrl("reader.html?offline-reader#page-8") });
    const reader = await auditCurrentPage(ws, "offline-reader-wide-sheet", {
      readerPages: [8, 9],
    });

    await send(ws, "Page.navigate", { url: siteUrl("reader.html?offline-lion-safari#page-66") });
    const lionSafari = await auditCurrentPage(ws, "offline-reader-lion-safari", {
      readerPages: [66, 67],
    });

    await send(ws, "Page.navigate", { url: siteUrl("reader.html?offline-colour-room#page-124") });
    const colourRoom = await auditCurrentPage(ws, "offline-reader-colour-room", {
      readerPages: [124],
    });

    const results = { baseUrl, cdpListUrl, prime, pages: [home, returningHome, reader, lionSafari, colourRoom] };
    const failures = results.pages.filter(
      (page) =>
        !page.controlled ||
        page.docOverflow ||
        page.visibleIncompleteImages.length > 0 ||
        (page.expectedReaderPages &&
          page.expectedReaderPages.join(",") !== page.readerPages.join(",")) ||
        (page.continueReading &&
          page.continueReading.expectedVisible !== page.continueReading.visible) ||
        (page.continueReading?.expectedHref &&
          page.continueReading.expectedHref !== page.continueReading.href),
    );

    console.log(JSON.stringify({ ...results, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await setOffline(ws, false).catch(() => {});
    ws.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
