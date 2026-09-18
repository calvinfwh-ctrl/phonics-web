/* PhonicsTeacher service worker — cache the app shell for remote/offline reuse.
   Do not intercept /audio or Range requests: the Cache API rejects HTTP 206. */
const CACHE = "phonics-web-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/audio/")) return;
  if (req.headers.get("range")) return;

  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.status === 200 && (res.type === "basic" || res.type === "default")) {
      try {
        await cache.put(req, res.clone());
      } catch {
        /* quota / unsupported response */
      }
    }
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
}
