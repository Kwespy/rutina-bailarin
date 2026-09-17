
const CACHE="rutina-bailarin-shell-v2";
const SHELL=["./","./index.html","./style.css","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET") return;

  // routine.json is network-first so GitHub changes appear immediately after deployment.
  if(url.pathname.endsWith("/routine.json") || url.pathname.endsWith("routine.json")){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(cache=>cache.put("./routine.json",copy));
        return resp;
      }).catch(()=>caches.match("./routine.json"))
    );
    return;
  }

  // App shell: cache-first.
  event.respondWith(
    caches.match(event.request).then(hit=>hit || fetch(event.request).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return resp;
    }))
  );
});
