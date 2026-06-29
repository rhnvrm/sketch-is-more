const baseUrl = process.env.SITE_URL || "http://127.0.0.1:8000";
const cdpListUrl = process.env.CDP_LIST_URL || "http://127.0.0.1:9229/json/list";

const routes = [
  { path: "index.html", label: "home-fresh", expectedShareTarget: "./index.html" },
  { path: "index.html", label: "home-returning", savedReaderPage: 66, expectedShareTarget: "./index.html" },
  { path: "index.html#wide-sheet", label: "home-wide-sheet", expectedShareTarget: "./index.html#wide-sheet" },
  { path: "index.html#author-record", label: "home-author-record", expectedShareTarget: "./index.html#author-record" },
  {
    path: "reader.html#page-8",
    label: "reader-wide-sheet",
    expectedReaderPages: [8, 9],
    expectedReaderKind: "feature-spread",
    expectedShareTarget: "./reader.html#page-8",
  },
  {
    path: "reader.html#page-9",
    label: "reader-wide-sheet-canonical",
    expectedReaderPages: [8, 9],
    expectedReaderKind: "feature-spread",
    expectedShareTarget: "./reader.html#page-8",
    expectedHash: "#page-8",
  },
  {
    path: "reader.html#page-66",
    label: "reader-lion-safari",
    expectedReaderPages: [66, 67],
    expectedReaderKind: "feature-spread",
    expectedShareTarget: "./reader.html#page-66",
  },
  {
    path: "reader.html#page-104",
    label: "reader-campus-system",
    expectedReaderIncludes: [104],
    expectedShareTarget: "./reader.html#page-104",
  },
  {
    path: "reader.html#page-124",
    label: "reader-colour-room",
    expectedReaderIncludes: [124],
    expectedShareTarget: "./reader.html#page-124",
  },
  {
    path: "reader.html#page-8",
    label: "reader-page-jump",
    pageJump: 124,
    expectedReaderIncludes: [124],
    expectedShareTarget: "./reader.html#page-124",
  },
  {
    path: "reader.html#page-136",
    label: "reader-author-record",
    expectedReaderPages: [136],
    expectedReaderKind: "single",
    expectedShareTarget: "./reader.html#page-136",
  },
];

const viewports = [
  { label: "desktop", width: 1366, height: 900, scale: 1 },
  { label: "tablet", width: 820, height: 1180, scale: 2 },
  { label: "mobile", width: 390, height: 844, scale: 2 },
];

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
    }, 20000);
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

function routeUrl(route, viewport) {
  const routePath = typeof route === "string" ? route : route.path;
  const [pathAndQuery, hash = ""] = routePath.split("#");
  const [path] = pathAndQuery.split("?");
  const cacheBust = `audit-${viewport.label}-${(typeof route === "string" ? path : route.label).replaceAll(/\W+/g, "-")}`;
  const url = new URL(pathAndQuery, `${baseUrl.replace(/\/$/, "")}/`);
  url.searchParams.set("audit", cacheBust);
  if (hash) url.hash = hash;
  return url.href;
}

async function prepareVisitState(ws, route) {
  const landingUrl = new URL("index.html", `${baseUrl.replace(/\/$/, "")}/`);
  landingUrl.searchParams.set("audit-storage", route.label ?? "route");
  await send(ws, "Page.navigate", { url: landingUrl.href });
  await sleep(350);

  await evaluate(
    ws,
    `(() => {
      localStorage.removeItem("sketch-is-more:last-visit");
      localStorage.removeItem("sketch-is-more:last-reader-page");
      ${
        route.savedReaderPage
          ? `localStorage.setItem("sketch-is-more:last-reader-page", "${route.savedReaderPage}");`
          : ""
      }
      return true;
    })()`,
  );
}

async function auditRoute(ws, route, viewport) {
  const routeCase = typeof route === "string" ? { path: route, label: route } : route;
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.scale,
    mobile: viewport.width < 700,
  });
  await send(ws, "Network.setBypassServiceWorker", { bypass: true });
  await send(ws, "Network.clearBrowserCache");
  await prepareVisitState(ws, routeCase);
  await send(ws, "Page.navigate", { url: routeUrl(routeCase, viewport) });
  await sleep(3200);

  if (routeCase.pageJump) {
    await evaluate(
      ws,
      `(() => {
        const input = document.querySelector("[data-reader-page-number]");
        const form = document.querySelector("[data-reader-page-form]");
        if (!input || !form) return false;
        input.value = "${routeCase.pageJump}";
        form.requestSubmit();
        return true;
      })()`,
    );
    await sleep(900);
  }

  return evaluate(
    ws,
    `(() => {
      const isVisible = (el) =>
        !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) &&
        getComputedStyle(el).visibility !== "hidden" &&
        getComputedStyle(el).display !== "none";

      const smallTargets = [...document.querySelectorAll("a, button, input, select, textarea, [role='button']")]
        .filter(isVisible)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("title") || "")
              .trim()
              .replace(/\\s+/g, " ")
              .slice(0, 80),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((target) => target.width < 44 || target.height < 44);

      const aboveFoldIncompleteImages = [...document.images]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.top < innerHeight && rect.bottom > 0;
        })
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute("src"));

      const continueLink = document.querySelector("[data-continue-reading]");
      const continueReading = continueLink
        ? {
            visible: isVisible(continueLink),
            hidden: continueLink.hidden,
            text: continueLink.textContent.trim().replace(/\\s+/g, " "),
            href: continueLink.getAttribute("href"),
            expectedVisible: ${Boolean(routeCase.savedReaderPage)},
          }
        : null;

      const readerImages = [...document.querySelectorAll(".reader-frame img")]
        .map((img) => Number((img.getAttribute("src") || "").match(/\\/(\\d+)\\.webp(?:$|[?#])/)?.[1]))
        .filter(Number.isFinite);
      const readerKind = document.querySelector(".reader-spread")
        ? "feature-spread"
        : document.querySelector(".reader-book")
          ? "book-pair"
          : document.querySelector(".reader-page")
            ? "single"
            : null;
      const expectedReaderPages = ${JSON.stringify(routeCase.expectedReaderPages ?? null)};
      const expectedReaderIncludes = ${JSON.stringify(routeCase.expectedReaderIncludes ?? [])};
      const expectedReaderKind = ${JSON.stringify(routeCase.expectedReaderKind ?? null)};
      const readerState = readerKind || expectedReaderPages || expectedReaderIncludes.length
        ? {
            kind: readerKind,
            expectedKind: expectedReaderKind,
            pages: readerImages,
            expectedPages: expectedReaderPages,
            expectedIncludes: expectedReaderIncludes,
            count: document.querySelector(".reader-count")?.value || "",
        }
        : null;

      const shareButton = document.querySelector("[data-share-book]");
      const shareState = shareButton
        ? {
            target: shareButton.dataset.shareTarget || "",
            expectedTarget: ${JSON.stringify(routeCase.expectedShareTarget ?? null)},
            title: shareButton.dataset.shareTitle || "",
            text: shareButton.dataset.shareText || "",
          }
        : null;

      return {
        label: "${routeCase.label}",
        route: location.pathname.split("/").pop() || "index.html",
        hash: location.hash,
        expectedHash: ${JSON.stringify(routeCase.expectedHash ?? null)},
        viewport: "${viewport.label}",
        savedReaderPage: ${routeCase.savedReaderPage ?? "null"},
        title: document.title,
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        smallTargetCount: smallTargets.length,
        smallTargets: smallTargets.slice(0, 8),
        aboveFoldIncompleteImages,
        continueReading,
        readerState,
        shareState,
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
    await evaluate(
      ws,
      `navigator.serviceWorker?.getRegistrations
        ? navigator.serviceWorker.getRegistrations()
            .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
            .then(() => true)
        : true`,
      true,
    ).catch(() => false);

    const results = [];
    for (const viewport of viewports) {
      for (const route of routes) {
        results.push(await auditRoute(ws, route, viewport));
      }
    }

    const failures = results.filter(
      (result) =>
        result.docOverflow ||
        result.smallTargetCount > 0 ||
        result.aboveFoldIncompleteImages.length > 0 ||
        (result.continueReading &&
          result.continueReading.expectedVisible !== result.continueReading.visible) ||
        (result.readerState &&
          result.readerState.expectedKind &&
          result.readerState.kind !== result.readerState.expectedKind) ||
        (result.readerState?.expectedPages &&
          result.readerState.expectedPages.join(",") !== result.readerState.pages.join(",")) ||
        (result.readerState?.expectedIncludes?.length &&
          !result.readerState.expectedIncludes.every((page) => result.readerState.pages.includes(page))) ||
        (result.expectedHash && result.hash !== result.expectedHash) ||
        (result.shareState?.expectedTarget &&
          result.shareState.target !== result.shareState.expectedTarget),
    );

    console.log(JSON.stringify({ baseUrl, cdpListUrl, results, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    ws.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
