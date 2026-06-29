const cacheVersion = "sketch-is-more-v20260627-quiet";
const shellCache = `${cacheVersion}-shell`;
const runtimeCache = `${cacheVersion}-runtime`;

const shellAssets = [
  "./",
  "./index.html",
  "./reader.html",
  "./robots.txt",
  "./sitemap.xml",
  "./styles.css",
  "./site.js",
  "./book-data.js",
  "./app.js",
  "./visit-state.js",
  "./site.webmanifest",
  "./public/book/thumb/1.webp",
  "./public/book/thumb/7.webp",
  "./public/book/thumb/8.webp",
  "./public/book/thumb/66.webp",
  "./public/book/thumb/127.webp",
  "./public/book/large/1.webp",
  "./public/book/large/7.webp",
  "./public/book/large/8.webp",
  "./public/book/large/9.webp",
  "./public/book/large/66.webp",
  "./public/book/large/67.webp",
  "./public/book/large/124.webp",
  "./public/book/large/127.webp",
  "./public/book/large/132.webp",
  "./public/book/large/136.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(shellCache)
      .then((cache) => cache.addAll(shellAssets))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("sketch-is-more-") && !key.startsWith(cacheVersion))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isBookAsset(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && url.pathname.includes("/public/book/");
}

function isShellRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && request.mode === "navigate";
}

function isCodeAsset(request) {
  const url = new URL(request.url);
  return (
    url.origin === self.location.origin &&
    (url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".webmanifest"))
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(runtimeCache);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(shellCache);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request, { ignoreSearch: true }) || caches.match("./index.html");
  }
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(shellCache);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request, { ignoreSearch: true });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (isShellRequest(request)) {
    event.respondWith(networkFirstPage(request));
  } else if (isBookAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isCodeAsset(request)) {
    event.respondWith(networkFirstAsset(request));
  }
});
