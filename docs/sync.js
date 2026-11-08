"use strict";
/* 여러 기기 동기화: 같은 코드를 입력한 기기끼리 기록을 합친다.
   서버 주소와 공개 키가 비어 있으면 동기화 화면을 숨긴다. */
const SYNC_URL = "https://fwiegxxwehrbpjihowdk.supabase.co";
const SYNC_KEY = "sb_publishable_UUZiG-9vwSVPDdWa5JYBSw_XTeGuCYT";   // 공개용 키. Secret key는 절대 넣지 않는다.

const SYNC_CODE_KEY = "det_sync_code", SYNC_DEVICE_KEY = "det_device";
const syncEnabled = () => !!(SYNC_URL && SYNC_KEY);
function syncStore(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
  } catch (e) { /* 저장소를 쓸 수 없으면 동기화하지 않는다 */ }
  return null;
}
function deviceId() {
  let id = syncStore(SYNC_DEVICE_KEY);
  if (!id) { id = makeSyncCode().slice(0, 8); syncStore(SYNC_DEVICE_KEY, id); }
  return id;
}
function makeSyncCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...crypto.getRandomValues(new Uint8Array(20))].map(n => abc[n % abc.length]).join("");
}
const cleanSyncCode = v => String(v).toUpperCase().replace(/[^A-Z0-9]/g, "");
const showSyncCode = c => c.match(/.{1,5}/g).join("-");

/* ---------- 기록 합치기: 어느 쪽에서 먼저 합쳐도 결과가 같아야 한다 ---------- */
function mergeWord(a, b) {
  if (!a || !b) return a || b;
  const later = (b.last || "") > (a.last || "") ? b : a;
  const skill = { ...b.skill };
  for (const k in a.skill) if (!skill[k] || a.skill[k] < skill[k]) skill[k] = a.skill[k];
  return {
    ...later,
    right: Math.max(a.right || 0, b.right || 0),
    wrong: Math.max(a.wrong || 0, b.wrong || 0),
    intro: (a.intro || "") < (b.intro || "") ? (a.intro || b.intro) : (b.intro || a.intro),
    skill,
    earn: { ...b.earn, ...a.earn },
  };
}
function lostByOf(s) {
  const by = { ...s.lostBy }, sum = Object.values(by).reduce((n, v) => n + v, 0);
  if ((s.lost || 0) > sum) by.before = (by.before || 0) + s.lost - sum;   // 기기별 기록 전의 감점
  return by;
}
function mergeState(a, b) {
  if (!b) return a;
  const out = { ...a };
  out.words = {};
  for (const id of new Set([...Object.keys(a.words || {}), ...Object.keys(b.words || {})])) out.words[id] = mergeWord((a.words || {})[id], (b.words || {})[id]);
  out.boss = { ...b.boss, ...a.boss };
  out.storySeen = !!(a.storySeen || b.storySeen);
  const aBy = lostByOf(a), bBy = lostByOf(b);
  out.lostBy = {};
  for (const k of new Set([...Object.keys(aBy), ...Object.keys(bBy)])) out.lostBy[k] = Math.max(aBy[k] || 0, bBy[k] || 0);
  out.lost = Object.values(out.lostBy).reduce((n, v) => n + v, 0);
  out.lostDay = { ...a.lostDay };
  for (const id in b.lostDay) if (!out.lostDay[id] || b.lostDay[id] > out.lostDay[id]) out.lostDay[id] = b.lostDay[id];
  out.log = { ...b.log };
  for (const d in a.log) {
    const x = a.log[d], y = out.log[d] || {};
    out.log[d] = { answered: Math.max(x.answered || 0, y.answered || 0), correct: Math.max(x.correct || 0, y.correct || 0) };
  }
  const exams = new Map();
  for (const e of [...(a.exams || []), ...(b.exams || [])]) exams.set(e.at || JSON.stringify(e), e);
  out.exams = [...exams.values()].sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-50);
  out.flash = { ...b.flash };
  for (const d in a.flash) if (!out.flash[d] || (a.flash[d].t || 0) >= (out.flash[d].t || 0)) out.flash[d] = a.flash[d];
  const aDay = a.lastDay || "", bDay = b.lastDay || "";
  out.lastDay = aDay > bDay ? aDay : bDay;
  out.streak = aDay === bDay ? Math.max(a.streak || 0, b.streak || 0) : aDay > bDay ? a.streak : b.streak;
  out.typeStats = { ...b.typeStats };
  for (const k in a.typeStats) {
    const x = a.typeStats[k], y = out.typeStats[k] || {};
    out.typeStats[k] = { a: Math.max(x.a || 0, y.a || 0), c: Math.max(x.c || 0, y.c || 0) };
  }
  out.settings = { ...a.settings, examDate: (a.settings || {}).examDate || (b.settings || {}).examDate || "" };
  return out;
}

/* ---------- 서버와 주고받기 ---------- */
let syncTimer = 0, syncBusy = false, syncAgain = false;
let syncStatus = "";   // 보호자 화면에 표시한다
async function syncCall(fn, body) {
  const r = await fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SYNC_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(String(r.status));
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
const syncableState = s => { const { mission, ...rest } = s; return rest; };   // 하루 미션 진행은 기기별로 둔다
async function syncNow() {
  const code = syncStore(SYNC_CODE_KEY);
  if (!syncEnabled() || !code) return false;
  if (syncBusy) { syncAgain = true; return false; }
  syncBusy = true;
  try {
    const remote = await syncCall("sync_pull", { p_code: code });
    const before = JSON.stringify(syncableState(S));
    const merged = mergeState(S, remote);
    if (JSON.stringify(syncableState(merged)) !== before) {
      Object.assign(S, merged);
      saveLocal();
      if (document.querySelector(".hero")) home();
    }
    await syncCall("sync_push", { p_code: code, p_data: syncableState(S) });
    syncStatus = "마지막 동기화: " + new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return true;
  } catch (e) {
    syncStatus = "동기화하지 못했어요. 인터넷이 연결되면 다시 시도해요.";
    return false;
  } finally {
    syncBusy = false;
    const el = document.getElementById("syncStatus");
    if (el) el.textContent = syncStatus;
    if (syncAgain) { syncAgain = false; syncSoon(); }
  }
}
function syncSoon() {
  if (!syncEnabled() || !syncStore(SYNC_CODE_KEY)) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, 3000);
}
function syncStart() {
  if (!syncEnabled()) return;
  syncNow();
  window.addEventListener("online", syncNow);   // 인터넷이 돌아오면 밀린 기록을 합친다
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" || syncTimer) syncNow(); });
}
function syncDisconnect() { syncStore(SYNC_CODE_KEY, null); syncStatus = ""; }

/* ---------- 보호자 화면 ---------- */
function syncPanelHtml() {
  if (!syncEnabled()) return "";
  const code = syncStore(SYNC_CODE_KEY);
  return `<div class="panel stack">
    <h3>여러 기기에서 이어 하기</h3>
    ${code ? `<p class="small">이 기기는 연결되어 있어요. 다른 기기의 같은 화면에 아래 코드를 입력하세요.</p>
      <p class="sync-code en">${showSyncCode(code)}</p>
      <p class="small mute">코드를 아는 사람은 기록을 볼 수 있어요. 가족 외에는 알려 주지 마세요.</p>
      <p class="small mute" id="syncStatus" role="status">${syncStatus}</p>
      <div class="row"><button class="btn" id="syncRun">지금 동기화</button><button class="btn" id="syncOff">이 기기 연결 끊기</button></div>`
    : `<p class="small mute">이메일이나 이름은 받지 않아요. 코드 하나로 기기끼리 기록을 합칩니다.</p>
      <button class="btn primary" id="syncNew">첫 기기: 코드 만들기</button>
      <label class="field small">다른 기기: 받은 코드 입력
        <span class="answer-row" style="margin:0"><input class="answer en" id="syncInput" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn" id="syncJoin">연결</button></span></label>
      <p class="small" id="syncStatus" role="status">${syncStatus}</p>`}
  </div>`;
}
function syncPanelWire(refresh) {
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on("syncNew", async () => { syncStore(SYNC_CODE_KEY, makeSyncCode()); await syncNow(); refresh(); });
  on("syncJoin", async () => {
    const code = cleanSyncCode(document.getElementById("syncInput").value);
    if (code.length !== 20) { document.getElementById("syncStatus").textContent = "코드는 20자예요. 다시 확인해 주세요."; return; }
    syncStore(SYNC_CODE_KEY, code);
    await syncNow();
    refresh();
  });
  on("syncRun", async () => { await syncNow(); refresh(); });
  on("syncOff", () => { if (confirm("이 기기의 연결을 끊을까요? 기록은 이 기기에 남아요.")) { syncDisconnect(); refresh(); } });
}
