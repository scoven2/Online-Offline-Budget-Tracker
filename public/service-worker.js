const FILES_TO_CACHE = [
    "/",
    "/db.js",
    "/index.html",
    "/index.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
],

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener("install", event => {
    event.waitUntil(
        caches
        .open(CACHE_NAME)
        .then(cache => {
            console.log("Offline information successfully pre-cached");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
        .keys()
        .then(keyList => {
            return Promise
            .all(keyList.map(key => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log("Clearing cache", key);
                    return caches.delete(key);
                }
            }));
        })
    )
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
                return fetch(event.request)
                .then(response => {
                    if (response.statuus === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                })
            .catch(err => {
                return cache.match(event.request);
            });
            }).catch(err => console.log(err))
        )
        return;
    }
    event.respondWith(
        fetch(event.request)
        .catch(function () {
            return caches
            .match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                } else if (event.request.headers
                    .get("accept")
                    .includes("text/html")) {
                        return caches
                        .match("/");
                    }
            });
        })
    );
});


