"use strict";
/* 오프라인 실행: 화면 파일은 최신판을 우선 받고, 이미지와 음성은 저장본을 우선 쓴다. */
const CORE = "voca-core-v2", MEDIA = "voca-media-v1";   // 원본 탐험대 앱의 저장본과 섞이지 않게 이름을 바꿨다
const CORE_FILES = ["./", "index.html", "style.css", "app.js", "data.js", "sync.js", "pwa.js", "credits.html", "images/credits.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    // 같은 주소의 다른 앱(원본 탐험대)의 저장본은 건드리지 않고, 이 앱의 옛 저장본만 지운다
    .then(keys => Promise.all(keys.filter(k => k.startsWith("voca-") && k !== CORE && k !== MEDIA).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 음성은 브라우저가 일부 구간만 요청할 수 있다(특히 iPhone)
async function fitRange(response, range) {
  if (!range) return response;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return response;
  const blob = await response.blob();
  const start = m[1] ? Number(m[1]) : Math.max(blob.size - Number(m[2]), 0);
  const end = m[1] && m[2] ? Math.min(Number(m[2]), blob.size - 1) : blob.size - 1;
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${blob.size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}
async function media(request) {
  const url = request.url, range = request.headers.get("range");
  const cache = await caches.open(MEDIA);
  let hit = await cache.match(url);
  if (!hit) {
    const fresh = await fetch(url);
    if (!fresh.ok) return fresh;
    await cache.put(url, fresh.clone());
    hit = fresh;
  }
  return fitRange(hit, range);
}
async function core(request) {
  const cache = await caches.open(CORE);
  // GitHub Pages는 10분 동안 저장본을 쓰라고 알려 준다. 화면 파일은 매번 서버에 새 판인지 물어본다.
  const fresh = new Request(request.url, { cache: "no-cache", credentials: "same-origin" });
  const network = fetch(fresh).then(r => { if (r.ok) cache.put(request, r.clone()); return r; });
  const saved = () => cache.match(request, { ignoreSearch: true }).then(r => r || (request.mode === "navigate" ? cache.match("index.html") : undefined));
  // 인터넷이 느리면 저장본을 먼저 보여 주고, 최신판은 뒤에서 받아 둔다
  const timeout = new Promise(resolve => setTimeout(resolve, 2500));
  const first = await Promise.race([network.catch(() => null), timeout]);
  if (first) return first;
  const s = await saved();
  if (s) return s;
  return network;
}
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(/\/(images\/[^/]+\.jpg|audio\/[ws]\/[^/]+\.mp3)$/.test(url.pathname) ? media(e.request) : core(e.request));
});
