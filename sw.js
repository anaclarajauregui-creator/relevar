/* Relevar — service worker (offline app shell) */
const CACHE = "relevar-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./xlsx.full.min.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method!=="GET"){ return; } // never cache POST (sync goes to network)
  const url = new URL(req.url);
  // Do not intercept cross-origin (e.g. Apps Script sync, tiles): let network handle it.
  if(url.origin !== self.location.origin){ return; }
  // Cache-first for app shell, fall back to network, update cache in background.
  e.respondWith(
    caches.match(req).then(cached=>{
      const net = fetch(req).then(res=>{
        if(res && res.status===200){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
        return res;
      }).catch(()=> cached || caches.match("./index.html"));
      return cached || net;
    })
  );
});
