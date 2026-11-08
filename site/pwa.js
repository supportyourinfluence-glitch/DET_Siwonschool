"use strict";
/* 앱 설치와 오프라인 다운로드. PC 설치 프로그램(file://)에는 모든 파일이 이미 들어 있어 쓰지 않는다. */
const MEDIA_CACHE = "voca-media-v1", OFFLINE_KEY = "det_vocab_offline_done";   // sw.js의 MEDIA와 같아야 한다
const pwaSupported = () => location.protocol.startsWith("http") && "serviceWorker" in navigator && "caches" in window;
const isInstalledApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let installEvent = null, offlineBusy = false, offlineText = "";

if (pwaSupported()) navigator.serviceWorker.register("sw.js").catch(() => { /* 등록 실패 시 온라인으로만 동작한다 */ });
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  installEvent = e;
  const b = document.getElementById("appInstall");
  if (b) b.hidden = false;
});
window.addEventListener("appinstalled", () => {
  installEvent = null;
  const b = document.getElementById("appInstall");
  if (b) b.hidden = true;
});

function offlineDone() { try { return localStorage.getItem(OFFLINE_KEY) === "1"; } catch (e) { return false; } }
function mediaFiles() {
  return WORDS.flatMap(w => ["images/" + w.id + ".jpg", "audio/w/" + w.id + ".mp3", "audio/s/" + w.id + ".mp3"]);
}
function showOffline(text) {
  offlineText = text;
  const el = document.getElementById("offlineStatus");
  if (el) el.textContent = text;
}
async function downloadOffline() {
  if (offlineBusy) return;
  offlineBusy = true;
  const button = document.getElementById("offlineGo");
  if (button) button.disabled = true;
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const cache = await caches.open(MEDIA_CACHE);
    const have = new Set((await cache.keys()).map(r => new URL(r.url).pathname));
    const base = new URL(".", location.href);
    const files = mediaFiles(), todo = files.map(f => new URL(f, base)).filter(u => !have.has(u.pathname));
    let done = files.length - todo.length, failed = 0, next = 0;
    showOffline(`내려받는 중 ${done}/${files.length}`);
    const worker = async () => {
      while (next < todo.length) {
        const u = todo[next++];
        try {
          const r = await fetch(u.href);
          if (!r.ok) throw new Error(String(r.status));
          await cache.put(u.href, r);
          done++;
        } catch (e) { failed++; }
        showOffline(`내려받는 중 ${done}/${files.length}`);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (failed) {
      showOffline(`${failed}개를 받지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.`);
    } else {
      try { localStorage.setItem(OFFLINE_KEY, "1"); } catch (e) { /* 표시만 하지 못한다 */ }
      showOffline("준비 완료! 이제 인터넷 없이 쓸 수 있어요.");
    }
  } catch (e) {
    showOffline("저장 공간이 부족하거나 내려받을 수 없어요. 공간을 비우고 다시 시도해 주세요.");
  }
  offlineBusy = false;
  if (button) button.disabled = false;
}

/* 첫 화면 맨 아래의 작은 내려받기 아이콘 */
// 원본 탐험대 앱의 설치 파일이라 시원스쿨 샘플에서는 비워 둔다. 이 앱의 설치 파일을 만들면 주소를 넣는다.
const PC_SETUP_URL = "";
function downloadLinksHtml() {
  if (!pwaSupported()) return "";   // PC 설치판에서는 필요 없다
  return `<nav class="corner-links" aria-label="앱 내려받기">
    ${isInstalledApp() ? "" : `<button class="corner-link" id="getApp" title="앱 다운로드" aria-label="앱 다운로드">${icon("phone")}</button>`}
    ${PC_SETUP_URL ? `<a class="corner-link" href="${PC_SETUP_URL}" title="PC 설치 파일 다운로드" aria-label="PC 설치 파일 다운로드">${icon("monitor")}</a>` : ""}
  </nav>`;
}
function downloadLinksWire() {
  const b = document.getElementById("getApp");
  if (!b) return;
  b.onclick = async () => {
    if (installEvent) {
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
      return;
    }
    message("앱 다운로드", isIos()
      ? "Safari에서 아래쪽 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택해 주세요."
      : "브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택해 주세요. 이미 설치했다면 설치된 앱을 열어 주세요.");
  };
}

function appPanelHtml() {
  if (!pwaSupported()) return "";
  const ready = offlineDone();
  return `<section class="panel stack">
    <div><h2>앱으로 쓰기</h2><p class="mute small">${ready ? "인터넷 없이 쓸 준비가 끝났어요." : "이미지와 음성을 내려받으면 인터넷 없이 공부할 수 있어요. 약 40MB이니 Wi-Fi에서 받아 주세요."}</p></div>
    ${isInstalledApp() ? "" : isIos()
      ? `<p class="notice">iPhone/iPad: Safari의 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 눌러 주세요.</p>`
      : `<button class="btn" id="appInstall" ${installEvent ? "" : "hidden"}>앱 설치</button>`}
    ${ready ? "" : `<button class="btn primary" id="offlineGo">인터넷 없이 쓰기 준비</button>`}
    <p class="small" id="offlineStatus" role="status">${offlineText}</p>
  </section>`;
}
function appPanelWire() {
  const go = document.getElementById("offlineGo"), inst = document.getElementById("appInstall");
  if (go) { go.disabled = offlineBusy; go.onclick = downloadOffline; }
  if (inst) inst.onclick = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    inst.hidden = true;
  };
}
