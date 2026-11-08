"use strict";
/* DET 실전 VOCA 500: 화면, 게임, 간격 반복 로직
   수험생 모드(exam)와 초등 탐험대 모드(kids)가 같은 단어와 문제 엔진을 쓴다. */

const KEY = "det_vocab_v1";   // 원본 탐험대 앱과 같은 주소에서 열어도 기록이 섞이지 않게 이름을 바꿨다
const INTERVALS = [0, 1, 3, 7, 14];      // 단계별 다음 복습까지의 일수 (단계 0 = 당일)
const MAINTAIN_DAYS = 30;                // 마지막 단계를 넘긴 단어의 유지 복습 간격
const REVIEW_CAP = 60;                   // 하루 복습 상한
const SKILLS = ["meaning", "recog", "type"];
const PLANET_COLORS = ["#ff7a85", "#ffa94d", "#ffd166", "#8bdc6a", "#4fe0b0", "#4fd1e0", "#6cc6ff", "#8c9eff", "#a78bfa", "#f58bd6"];
const PLANET_NAMES = ["루비", "앰버", "솔라", "리프", "민트", "아쿠아", "스카이", "노바", "바이올렛", "핑크"];
// 책 뜻이 사전의 대표 뜻과 달라 보호자에게 알리는 항목
const BOOK_NOTES = {
  precedent: "책 표기는 '이전의'입니다. 영어사전의 대표 뜻은 명사 '선례'입니다.",
  crude: "책 표기는 'a. 대중의, 미가공의'입니다. 영어사전의 대표 뜻은 형용사 '가공하지 않은, 조잡한'입니다.",
  examine: "책 표기는 '관찰하다'입니다. 영어사전의 대표 뜻은 '조사하다, 검사하다'입니다.",
};

const STORY = [
  { title: "집을 잃은 마을", intro: "첫 번째 행성의 주민(resident)들이 집에서 쫓겨났어요. 낡은 집을 고치려면(repair) 단어부터 되찾아야 해요.", clear: "주민들이 집으로 돌아갔어요. 마을 협회(association)가 다음 행성 지도를 건네주었어요." },
  { title: "식량이 끊긴 항구", intro: "폭풍(storm)이 항구를 덮쳐 식량이 떨어졌어요(food shortage). 긴 항해(voyage)에 나설 배가 단어를 기다려요.", clear: "배가 무사히 떠났어요! 펭귄(penguin) 선원들이 손을 흔들어요." },
  { title: "화산재 속의 비행", intro: "화산이 터져(volcanic eruption) 재 구름(ash cloud)이 하늘을 막았어요. 항공기(aircraft)를 띄우려면 단어가 필요해요.", clear: "재 구름이 걷혔어요. 비행대(fleet)가 우주선을 다음 행성까지 호위해 줘요." },
  { title: "아픈 사람들의 병원", intro: "병원의 환자(patient)들이 병 이름을 알 수 없어요. 의사가 진단하려면(diagnose) 빼앗긴 단어가 필요해요.", clear: "치료 계획(treatment plan)이 완성됐어요. 병원에 웃음이 돌아왔어요." },
  { title: "끊어진 다리", intro: "두 마을을 잇던(link) 현수교(suspension bridge)가 끊겼어요. 다리를 다시 놓아 축제를 열어야 해요.", clear: "다리가 이어졌어요! 깃발(flag)을 들고 행진하며(march) 함께 기념해요(celebrate)." },
  { title: "별을 잃은 천문대", intro: "천문학자(astronomer)의 망원경에서 혜성(comet)이 사라졌어요. 관측소(observatory)가 단어를 찾고 있어요.", clear: "밤하늘에 혜성이 또렷이(clearly) 보여요. 다음 항로가 환하게 열렸어요." },
  { title: "불 꺼진 작업장", intro: "회로(circuit)가 끊겨 작업장(workshop)이 멈췄어요. 전기 기사(electrician)와 함께 고쳐요(fix).", clear: "불이 켜졌어요! 기계가 우주선 연료를 가득 채워 주었어요." },
  { title: "시들어 가는 도시", intro: "도시(urban)의 녹지 공간(green space)이 말라 가고 있어요. 해충(insect pest)을 막고 식물원을 살려요.", clear: "연못(pond)에 물이 차고 꽃이 피었어요. 토종(native) 새들이 돌아왔어요." },
  { title: "쓰레기 바다", intro: "플라스틱 폐기물(plastic waste)이 행성을 뒤덮었어요. 환경(environment)을 지키려면 단어의 힘이 필요해요.", clear: "함께 나무를 심었어요(plant trees). 마지막 행성의 위치가 드러났어요!" },
  { title: "단어 도둑의 행방", intro: "드디어 단어 도둑의 행방(whereabouts)을 찾았어요. 도둑은 자만하며(conceited) 마지막 단어를 움켜쥐고 있어요.", clear: "도둑이 후회하며(remorse) 단어를 모두 돌려주었어요. 10개 행성이 다시 빛나요!" },
];
const WON_STEP = 18, WON_BOSS = 300, WON_GOAL = 30000;   // 18원 x 단어 500개 x 3단계 + 300원 x 보스 10개 = 30,000원
const APP_NAME = "DET 실전 VOCA 500";
const BOOK_NAME = "시원스쿨 듀오링고 실전모의고사";
// DET 문항 유형과 앱 문제 유형의 대응
const DET_TYPES = [
  { type: "real", name: "Read and Select", desc: "5초 안에 진짜 단어 판별" },
  { type: "blank", name: "Fill in the Blanks", desc: "20초 안에 빈칸 완성" },
  { type: "listen", name: "Listen and Type", desc: "듣고 철자 입력" },
];
const TARGETS = [85, 105, 120, 135];

const $app = document.getElementById("app");
const byId = Object.fromEntries(WORDS.map(w => [w.id, w]));
// data.js에 들어 있는 DAY만 연다. DAY 1만 넣은 체험판에서는 나머지 DAY를 잠금으로 보여 준다.
const OPEN_DAYS = [...new Set(WORDS.map(w => w.day))];
const isOpen = d => OPEN_DAYS.includes(d);
const TRIAL = OPEN_DAYS.length < STORY.length;
const FULL_WORDS = STORY.length * 50;
const dayLabel = d => "DAY " + String(d).padStart(2, "0");
const dayOptions = () => OPEN_DAYS.map(d => `<option value="${d}">${dayLabel(d)}</option>`).join("");
const trialNote = () => TRIAL ? `<p class="notice trial-note">체험판: ${OPEN_DAYS.map(dayLabel).join(", ")} (${WORDS.length}단어). 정식판은 DAY 01–${String(STORY.length).padStart(2, "0")}, ${FULL_WORDS}단어입니다.</p>` : "";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);

/* ---------- 이 프로젝트에서 직접 그린 아이콘 ---------- */
const ICON_PATHS = {
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  star: '<path fill="currentColor" d="M12 3l2.7 5.7 6.3.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.3-.9z"/>',
  flame: '<path fill="currentColor" d="M12 3c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.5 1.2-3.8 2.2-5 .3 1.6 1 2.4 1.8 2.8C10 8.5 10.5 5.5 12 3z"/>',
  rocket: '<path d="M12 3c3 2 4.5 5.5 4.5 9v4h-9v-4C7.5 8.5 9 5 12 3z"/><circle cx="12" cy="10" r="1.6"/><path d="M7.5 13L5 16.5V19l2.5-2M16.5 13l2.5 3.5V19l-2.5-2M10 19l2 2.5 2-2.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  puzzle: '<path d="M4 9h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v3H4v-4a2 2 0 1 0 0-4z"/>',
  timer: '<circle cx="12" cy="14" r="7"/><path d="M12 14v-4M9.5 3h5M12 3v4"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
  headphones: '<path d="M4 15v-2a8 8 0 0 1 16 0v2"/><path d="M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z"/>',
  flag: '<path d="M6 21V4M6 4h12l-3 4 3 4H6"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  bellOff: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4M4 4l16 16"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 20h8"/>',
  planet: '<circle cx="12" cy="12" r="6"/><path d="M7 15.5C4 17.5 2.5 19 3 20c.8 1.4 6-.7 11-4s8.300-7.300 7-8.700c-.6-.7-2.300-.2-4.300 1"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.500h2"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;

/* ---------- 날짜 ---------- */
function dayOffset() { try { return Number(localStorage.getItem("det_day_offset")) || 0; } catch (e) { return 0; } }
function dateStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function addDays(s, n) { const [y, m, d] = s.split("-").map(Number); return dateStr(new Date(y, m - 1, d + n)); }
function today() { return addDays(dateStr(new Date()), dayOffset()); }
function diffDays(a, b) { const p = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 86400000); }

/* ---------- 저장 ---------- */
const blank = () => ({ settings: { examDate: "", dailyNew: 25, sound: true, mode: "", target: 120 }, words: {}, streak: 0, lastDay: "", log: {}, mission: null, boss: {}, flash: {}, lost: 0, lostBy: {}, lostDay: {}, storySeen: false, exams: [], typeStats: {} });
let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const b = blank(), d = JSON.parse(raw), s = { ...b, ...d, settings: { ...b.settings, ...d.settings } };
      if (!s.settings.mode && s.storySeen) s.settings.mode = "kids";   // 모드가 생기기 전의 기록은 탐험대 모드였다
      return s;
    }
  } catch (e) { /* 저장소를 읽지 못하면 새로 시작 */ }
  return blank();
}
const isExam = () => S.settings.mode === "exam";
const homeLabel = () => isExam() ? "홈으로" : "탐험 지도로";
let saveFailed = false;
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; } }
function save() { saveLocal(); syncSoon(); }

/* ---------- 간격 반복 ---------- */
const st = id => S.words[id];
function intro(id) {
  if (!S.words[id]) { S.words[id] = { box: 0, due: today(), wrong: 0, right: 0, last: "", failed: false, skill: {}, intro: today() }; }
  return S.words[id];
}
const isMastered = w => { const s = st(w.id); return !!s && SKILLS.every(k => s.skill[k]); };
const introduced = () => WORDS.filter(w => st(w.id));
const dueWords = () => WORDS.filter(w => st(w.id) && st(w.id).due <= today());

function markSkill(s, skill) {
  if (s.skill[skill]) return;
  // 서로 다른 날에 통과해야 하므로 오늘 이미 다른 기술을 통과했으면 내일로 미룬다
  if (Object.values(s.skill).includes(today())) return;
  s.skill[skill] = today();
}
function record(id, ok, skill) {
  const s = st(id);
  const t = today();
  const lg = S.log[t] = S.log[t] || { answered: 0, correct: 0 };
  lg.answered++; if (ok) lg.correct++;
  if (!s) { save(); return; }                  // 아직 배우지 않은 단어는 일정에 넣지 않음
  ok ? s.right++ : s.wrong++;
  if (ok && skill) markSkill(s, skill);
  if (s.last === t) {                          // 같은 날 다시 푼 문제는 단계를 올리지 않음
    if (ok && s.failed) { s.failed = false; s.due = addDays(t, 1); }
    else if (!ok) { s.failed = true; s.due = t; }
  } else {
    s.last = t;
    if (ok) {
      s.box = Math.min(s.box + 1, INTERVALS.length);
      s.due = addDays(t, s.box >= INTERVALS.length ? MAINTAIN_DAYS : INTERVALS[s.box]);
      s.failed = false;
    } else {
      s.box = Math.max(s.box - 1, 0);
      s.due = t;
      s.failed = true;
    }
  }
  save();
}
function dailyNewCount() {
  const left = WORDS.length - introduced().length;
  if (!left) return 0;
  let n = S.settings.dailyNew;
  if (S.settings.examDate) {
    const days = diffDays(today(), S.settings.examDate) - 5;   // 마지막 5일은 복습에 쓴다
    n = days > 0 ? Math.ceil(left / days) : left;
    n = Math.max(5, Math.min(50, n));
  }
  // 밀린 복습이 많으면 새 단어를 줄여 복습이 끝없이 쌓이지 않게 한다
  const due = dueWords().length;
  if (due > REVIEW_CAP * 2) n = 5;
  else if (due > REVIEW_CAP) n = Math.min(n, 10);
  return Math.min(left, Math.ceil(n / 5) * 5);                 // 책의 5개 묶음 단위
}
// 아직 외우지 못한 단어를 먼저, 그다음 자주 틀린 단어를 먼저 복습한다
function reviewOrder() {
  return dueWords().sort((a, b) => isMastered(a) - isMastered(b) || st(b.id).wrong - st(a.id).wrong).slice(0, REVIEW_CAP);
}

/* ---------- 문제 유틸 ---------- */
const isSingle = w => !!w.f;
const canListen = w => !/\bA\b|-ing|one's/.test(w.w);
const spoken = w => w.w.replace(/\(=.*?\)/, "").replace(/\[.*?\]/, "").replace(" -ing", " ing");
const span = w => w.s.match(/\{(.+?)\}/)[1];
const norm = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
function listenAnswers(w) {
  const a = [spoken(w)];
  if (w.w.startsWith("blonde")) a.push("blond");
  if (w.w.startsWith("care about")) a.push("care for");
  return a.map(norm);
}
const meanTokens = w => w.m.replace(/\b(n|v|adj|a)\./g, "").replace(/\(.*?\)|~/g, "").split(/[,/]/).map(x => x.trim()).filter(Boolean);
const engTokens = w => spoken(w).toLowerCase().split(" ").filter(t => t.length > 3);
function overlaps(a, b) {
  const m = meanTokens(b);
  if (meanTokens(a).some(t => m.includes(t))) return true;
  const e = engTokens(b);
  return engTokens(a).some(t => e.includes(t));
}
function distractors(w, n) {
  const same = shuffle(WORDS.filter(x => x.day === w.day && x.id !== w.id));
  const rest = shuffle(WORDS.filter(x => x.day !== w.day));
  const out = [];
  for (const x of same.concat(rest)) {
    if (out.length === n) break;
    if (!overlaps(w, x) && !out.some(o => overlaps(o, x))) out.push(x);
  }
  return out;
}
function nextTypeFor(w) {
  const s = st(w.id) || { skill: {} }, earn = s.earn || {};
  const need = k => !s.skill[k] || !earn[k];
  if (need("meaning")) return "meaning";
  if (need("recog")) return isSingle(w) ? "real" : "blank";
  if (need("type")) return canListen(w) ? "listen" : "blank";
  return pick(canListen(w) ? ["blank", "listen", "meaning"] : ["blank", "meaning"], 1)[0];
}
function makeRealItems(words, n) {
  const pool = shuffle(words.filter(isSingle)).slice(0, n);
  const half = Math.floor(pool.length / 2);
  return shuffle(pool.map((w, i) => ({ type: "real", id: w.id, fake: i < half })));
}
function skillOf(q, w) {
  if (q.type === "meaning") return "meaning";
  if (q.type === "real") return "recog";
  if (q.type === "listen") return "type";
  if (isSingle(w)) return "type";
  const s = st(w.id);
  return s && !s.skill.recog ? "recog" : "type";   // 표현 항목은 빈칸이 철자 판별을 대신한다
}

/* ---------- 적립금 ----------
   퀴즈를 처음 맞힌 단계마다 적립하고, 틀리면 감점한다. 같은 단어의 감점은 하루 한 번이다.
   플래시카드는 스스로 평가하는 연습이라 돈이 움직이지 않는다. */
function earnKey(q, w) {
  if (q.type === "meaning") return "meaning";
  if (q.type === "real") return "recog";
  if (q.type === "listen" || isSingle(w)) return "type";
  const s = st(w.id);
  return s && s.earn && s.earn.recog ? "type" : "recog";
}
function moneyStats(day) {
  const list = day ? WORDS.filter(w => w.day === day) : WORDS;
  const steps = list.reduce((n, w) => { const s = st(w.id); return n + (s && s.earn ? Object.keys(s.earn).length : 0); }, 0);
  const bosses = day ? (S.boss[day] ? 1 : 0) : Object.values(S.boss).filter(Boolean).length;
  const earned = steps * WON_STEP + bosses * WON_BOSS;
  return { earned, balance: Math.max(0, earned - (day ? 0 : S.lost)), max: list.length * 3 * WON_STEP + (day ? 1 : 10) * WON_BOSS };
}
const fmtWon = n => n.toLocaleString("ko-KR") + "원";
function reward(id, key) {
  const s = st(id);
  if (!s) return 0;
  s.earn = s.earn || {};
  if (s.earn[key]) return 0;
  s.earn[key] = 1;
  moneyToast(WON_STEP);
  return WON_STEP;
}
function penalize(id) {
  if (!st(id) || S.lostDay[id] === today()) return 0;
  S.lostDay[id] = today();
  const amount = Math.min(WON_STEP, moneyStats().balance);
  if (!amount) return 0;
  S.lost += amount;
  const device = deviceId();
  S.lostBy = lostByOf({ ...S, lost: S.lost - amount });
  S.lostBy[device] = (S.lostBy[device] || 0) + amount;
  moneyToast(-amount);
  return -amount;
}
function moneyToast(n) {
  if (isExam()) return;   // 수험생 모드는 적립금을 보여 주지 않는다
  const t = document.createElement("div");
  t.className = "money-toast " + (n > 0 ? "plus" : "minus");
  t.setAttribute("aria-hidden", "true");
  t.textContent = (n > 0 ? "+" : "-") + fmtWon(Math.abs(n));
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

/* ---------- 소리 ---------- */
let audioCtx = null;
function beep(ok) {
  if (!S.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = "triangle";
    o.frequency.value = ok ? 740 : 200;
    g.gain.setValueAtTime(.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .22);
    o.start(); o.stop(audioCtx.currentTime + .23);
  } catch (e) { /* 효과음 실패는 학습에 지장 없음 */ }
}
// 서버에 올린 음성 파일로 발음한다. 파일을 재생하지 못할 때만 기기의 음성 기능을 쓴다.
let audioFiles = null, player = null;
function audioFor(text) {
  if (!audioFiles) {
    audioFiles = new Map();
    WORDS.forEach(w => {
      audioFiles.set(spoken(w), "audio/w/" + w.id + ".mp3");
      audioFiles.set(w.s.replace(/[{}]/g, ""), "audio/s/" + w.id + ".mp3");
    });
  }
  return audioFiles.get(text);
}
function speak(text) {
  const src = audioFor(text);
  if (!src) return speakDevice(text);
  if ("speechSynthesis" in window && speechSynthesis.speaking) speechSynthesis.cancel();
  player = player || new Audio();
  player.pause();
  player.onerror = () => speakDevice(text);
  player.src = src;
  const p = player.play();
  // 페이지를 열자마자 나는 자동 재생 거부(NotAllowedError)와 다음 발음으로 넘어갈 때의 중단(AbortError)은 오류가 아니다
  if (p) p.catch(e => { if (e.name !== "NotAllowedError" && e.name !== "AbortError") speakDevice(text); });
}
function speakDevice(text) {
  if (!("speechSynthesis" in window)) return speechFailed();
  try {
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.resume();   // 일시 정지 상태로 멈춘 브라우저를 깨운다
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = .9;
    const v = speechSynthesis.getVoices().find(x => /^en-US/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^en/i.test(x.lang));
    if (v) u.voice = v;
    // 페이지를 열자마자 나는 자동 재생 거부(not-allowed)와 다음 발음으로 넘어갈 때의 중단은 오류가 아니다
    u.onerror = e => { if (!["canceled", "interrupted", "not-allowed"].includes(e.error)) speechFailed(); };
    speakDevice.current = u;    // 재생 중 메모리에서 지워져 소리가 끊기는 것을 막는다
    speechSynthesis.speak(u);
  } catch (e) { speechFailed(); }
}
function speechFailed() {
  if (document.getElementById("speechNotice")) return;
  const n = document.createElement("div");
  n.id = "speechNotice";
  n.className = "speech-notice";
  n.setAttribute("role", "alert");
  n.textContent = "발음을 재생하지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 6000);
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();

/* ---------- 화면 공통 ---------- */
let cleanup = null;
function render(html) {
  if (cleanup) { cleanup(); cleanup = null; }
  $app.innerHTML = html;
  window.scrollTo(0, 0);
}
function onKey(fn) {
  const h = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    fn(e);
  };
  document.addEventListener("keydown", h);
  return () => document.removeEventListener("keydown", h);
}
function addCleanup(fn) { const prev = cleanup; cleanup = () => { if (prev) prev(); fn(); }; }
const $ = sel => $app.querySelector(sel);
const $$ = sel => [...$app.querySelectorAll(sel)];
function startTimer(sec, onEnd) {
  const bar = $(".timer > i"), wrap = $(".timer");
  const t0 = performance.now();
  let raf = 0, dead = false;
  const tick = now => {
    if (dead) return;
    const left = 1 - (now - t0) / (sec * 1000);
    if (bar) { bar.style.transform = "scaleX(" + Math.max(left, 0) + ")"; }
    if (wrap && left < .3) wrap.classList.add("low");
    if (left <= 0) { dead = true; onEnd(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // 탭이 숨겨져 애니메이션이 멈춰도 시간이 끝나도록 한다
  const backup = setTimeout(() => { if (!dead) { dead = true; onEnd(); } }, sec * 1000 + 300);
  const stop = () => { dead = true; cancelAnimationFrame(raf); clearTimeout(backup); };
  addCleanup(stop);
  return stop;
}

/* ---------- 문제 진행기 ----------
   questions: {type:"meaning"|"real"|"blank"|"listen", id, ...}
   opts: title, exam(힌트와 해석 없음), hearts, requeue(틀리면 다시), noRecord, onDone(결과) */
function runRound(questions, opts) {
  const q = questions.slice();
  const res = { total: 0, right: 0, wrong: [], won: 0 };
  let hearts = opts.hearts || 0, i = 0;
  const initial = q.length;

  function finish(lost) {
    save();
    opts.onDone({ ...res, lost: !!lost });
  }
  function next() {
    if (i >= q.length) return finish(false);
    show(q[i]);
  }
  function header() {
    const pct = Math.round(Math.min(i, q.length) / q.length * 100);
    return `<div class="play-top">
      <button class="btn ghost" id="quit" aria-label="그만하기">${icon("close")}</button>
      <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      ${opts.hearts ? `<span class="hearts" aria-label="남은 하트 ${hearts}개">${"♥".repeat(hearts)}</span>` : ""}
      <span class="chip">${Math.min(i + 1, q.length)}/${q.length}</span>
    </div>`;
  }
  function wireQuit() {
    $("#quit").onclick = () => { if (confirm("그만할까요? 지금까지 푼 결과는 저장돼요.")) { save(); (opts.onQuit || home)(); } };
  }
  function answered(qq, ok, ms) {
    const w = byId[qq.id];
    res.total++;
    const ts = S.typeStats[qq.type] = S.typeStats[qq.type] || { a: 0, c: 0 };
    ts.a++; if (ok) ts.c++;
    if (ok) {
      res.right++;
    } else {
      if (!res.wrong.includes(qq.id)) res.wrong.push(qq.id);
      if (opts.requeue) q.push({ ...qq });
      if (opts.hearts) hearts--;
    }
    if (!opts.noRecord) {
      if (ok) intro(qq.id);   // 배우기 전 단어도 맞히면 배운 단어가 되어 적립한다. 틀리면 기록과 감점이 없다.
      const key = ok ? earnKey(qq, w) : null;
      record(qq.id, ok, ok ? skillOf(qq, w) : null);
      res.won += ok ? reward(qq.id, key) : penalize(qq.id);
      save();
    }
    beep(ok);
  }
  function afterFeedback(ok, delay) {
    let moved = false;
    const go = () => {
      if (moved) return; moved = true; i++;
      if (opts.hearts && hearts <= 0) return finish(true);
      next();
    };
    if (delay) { const t = setTimeout(go, delay); addCleanup(() => clearTimeout(t)); }
    const nb = $("#next");
    if (nb) { nb.hidden = false; nb.onclick = go; nb.focus(); }
    addCleanup(onKey(e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }));
  }
  const fbText = (ok, w, extra) => `<strong>${ok ? "정답!" : "아쉬워요"}</strong> ${extra || ""}
    <span class="en"><b>${esc(w.w)}</b></span> = ${esc(w.m)}`;

  function show(qq) {
    ({ meaning: showMeaning, real: showReal, blank: showBlank, listen: showListen })[qq.type](qq, byId[qq.id]);
  }

  /* 뜻 맞히기 */
  function showMeaning(qq, w) {
    const toMean = qq.dir ? qq.dir === "m" : Math.random() < .6;
    const opts4 = shuffle([w, ...distractors(w, 3)]);
    render(`${header()}<div class="panel">
      <p class="q-label">${toMean ? "이 단어의 뜻은?" : "이 뜻을 가진 단어는?"}</p>
      ${toMean ? `<p class="q-word en">${esc(w.w)}</p>` : `<p class="q-mean">${esc(w.m)}</p>`}
      <div class="choices">${opts4.map((o, n) => `<button class="choice ${toMean ? "" : "en"}" data-id="${o.id}"><span class="key">${n + 1}</span><span>${esc(toMean ? o.m : o.w)}</span></button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
      <button class="btn primary big" id="next" hidden>다음 (Enter)</button>
    </div>`);
    wireQuit();
    if (toMean) speak(spoken(w));
    const t0 = performance.now();
    let done = false;
    const choose = id => {
      if (done) return; done = true;
      const ok = id === w.id;
      $$(".choice").forEach(b => { b.disabled = true; if (b.dataset.id === w.id) b.classList.add("right"); else if (b.dataset.id === id) b.classList.add("wrong"); });
      answered(qq, ok, performance.now() - t0);
      const fb = $("#fb"); fb.className = "feedback " + (ok ? "ok" : "no"); fb.innerHTML = fbText(ok, w);
      if (!toMean) speak(spoken(w));
      stopKeys();
      afterFeedback(ok, ok ? 1100 : 0);
    };
    $$(".choice").forEach(b => { b.onclick = () => choose(b.dataset.id); });
    const stopKeys = onKey(e => { const n = Number(e.key); if (n >= 1 && n <= 4 && opts4[n - 1]) choose(opts4[n - 1].id); });
    addCleanup(stopKeys);
  }

  /* 진짜 단어 찾기: 5초 YES/NO */
  function showReal(qq, w) {
    const shown = qq.fake ? w.f : spoken(w);
    render(`${header()}<div class="panel">
      <p class="q-label">진짜 영어 단어일까요?</p>
      <div class="timer"><i></i></div>
      <p class="q-word en">${esc(shown)}</p>
      <div class="yesno">
        <button class="btn good big" id="yes">YES (Y)</button>
        <button class="btn bad big" id="no">NO (N)</button>
      </div>
      <div class="feedback" id="fb"></div>
      <button class="btn primary big" id="next" hidden>다음 (Enter)</button>
    </div>`);
    wireQuit();
    const t0 = performance.now();
    let done = false, stopTimer = null;
    const choose = v => {
      if (done) return; done = true;
      if (stopTimer) stopTimer();
      stopKeys();
      const ok = v !== null && v === !qq.fake;
      $("#yes").disabled = $("#no").disabled = true;
      answered(qq, ok, performance.now() - t0);
      const fb = $("#fb"); fb.className = "feedback " + (ok ? "ok" : "no");
      const why = v === null ? "시간이 끝났어요." : qq.fake ? `<span class="en">${esc(shown)}</span>은(는) 가짜 철자예요. 올바른 철자:` : "진짜 단어예요.";
      fb.innerHTML = fbText(ok, w, why);
      speak(spoken(w));
      afterFeedback(ok, ok ? 1300 : 0);
    };
    $("#yes").onclick = () => choose(true);
    $("#no").onclick = () => choose(false);
    const stopKeys = onKey(e => { const k = e.key.toLowerCase(); if (k === "y") choose(true); if (k === "n") choose(false); });
    addCleanup(stopKeys);
    stopTimer = startTimer(5, () => choose(null));
  }

  /* 입력 판정 공통 */
  function wireAnswer(input, check, seconds, onResult) {
    let done = false, stopTimer = null;
    const submit = value => {
      if (done) return; done = true;
      if (stopTimer) stopTimer();
      input.disabled = true;
      onResult(value !== null && check(value));
    };
    input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); e.stopPropagation(); if (input.value.trim()) submit(input.value); } });
    $("#submit").onclick = () => { if (input.value.trim()) submit(input.value); };
    if (seconds) stopTimer = startTimer(seconds, () => submit(null));
    input.focus();
  }

  /* 문장 빈칸 채우기: 20초 */
  function showBlank(qq, w) {
    const ans = span(w);
    const showN = Math.max(1, Math.min(Math.floor(ans.length * .4), ans.indexOf(" ") > 0 ? ans.indexOf(" ") : 99));
    const prefix = ans.slice(0, showN), rest = ans.slice(showN);
    const before = w.s.slice(0, w.s.indexOf("{")), after = w.s.slice(w.s.indexOf("}") + 1);
    render(`${header()}<div class="panel">
      <p class="q-label">빈칸의 나머지 글자를 입력하세요</p>
      <div class="timer"><i></i></div>
      <p class="sentence en">${esc(before)}<span class="blank-wrap">${esc(prefix)}<input class="answer inline en" id="ans" style="width:${Math.max(rest.length + 3, 7)}ch" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="빈칸 입력"></span>${esc(after)}</p>
      ${opts.exam ? "" : `<p class="mute" style="text-align:center">${esc(w.k)}</p>`}
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="submit">확인 (Enter)</button></div>
      <div class="feedback" id="fb"></div>
      <button class="btn primary big" id="next" hidden>다음 (Enter)</button>
    </div>`);
    wireQuit();
    const t0 = performance.now(), input = $("#ans");
    wireAnswer(input, v => norm(v) === norm(rest) || norm(v) === norm(ans), 20, ok => {
      input.classList.add(ok ? "good" : "bad");
      $("#submit").hidden = true;
      answered(qq, ok, performance.now() - t0);
      const fb = $("#fb"); fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = fbText(ok, w, ok ? "" : `빈칸 정답: <b class="en">${esc(ans)}</b> ·`);
      speak(spoken(w));
      afterFeedback(ok, ok ? 1400 : 0);
    });
  }

  /* 듣고 쓰기 */
  function showListen(qq, w) {
    render(`${header()}<div class="panel">
      <p class="q-label">들리는 단어를 입력하세요 (↑ 키: 다시 듣기)</p>
      ${opts.exam ? `<div class="timer"><i></i></div>` : ""}
      <button class="sound" id="play" aria-label="다시 듣기">${icon("speaker")}</button>
      <div class="answer-row">
        <input class="answer en" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="들은 단어 입력">
        <button class="btn primary" id="submit">확인</button>
      </div>
      <div class="feedback" id="fb"></div>
      <button class="btn primary big" id="next" hidden>다음 (Enter)</button>
    </div>`);
    wireQuit();
    const say = () => speak(spoken(w));
    $("#play").onclick = () => { say(); $("#ans").focus(); };
    say();
    const t0 = performance.now(), input = $("#ans");
    input.addEventListener("keydown", e => { if (e.key === "ArrowUp") { e.preventDefault(); say(); } });
    const answers = listenAnswers(w);
    wireAnswer(input, v => answers.includes(norm(v)), opts.exam ? 30 : 0, ok => {
      input.classList.add(ok ? "good" : "bad");
      $("#submit").hidden = true;
      answered(qq, ok, performance.now() - t0);
      const fb = $("#fb"); fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = fbText(ok, w);
      afterFeedback(ok, ok ? 1200 : 0);
    });
  }

  next();
}

/* ---------- 새 단어 카드 ---------- */
function showCards(ids, label, onDone, onQuit) {
  let i = 0;
  function draw() {
    const w = byId[ids[i]];
    intro(w.id); save();
    render(`<div class="play-top">
        <button class="btn ghost" id="quit" aria-label="나가기">${icon("close")}</button>
        <h3 class="grow">${esc(label)}</h3>
        <span class="chip">DAY ${w.day} · ${String(w.no).padStart(3, "0")}</span>
      </div>
      <div class="panel card">
        <div class="dots">${ids.map((_, n) => `<i class="${n <= i ? "on" : ""}"></i>`).join("")}</div>
        <p class="q-word en">${esc(w.w)}</p>
        <p class="mean">${esc(w.m)}</p>
        <div class="ex">
          <p class="en" style="font-size:18px">${esc(w.s).replace(/\{(.+?)\}/, "<mark>$1</mark>")}</p>
          <p class="mute">${esc(w.k)}</p>
        </div>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn" id="say">${icon("speaker")} 듣기 (R)</button>
          ${i > 0 ? `<button class="btn" id="prev">이전</button>` : ""}
          <button class="btn primary" id="go">${i === ids.length - 1 ? "외웠어요! 문제 풀기" : "다음 (Enter)"}</button>
        </div>
      </div>`);
    $("#quit").onclick = onQuit;
    const say = () => speak(spoken(w));
    $("#say").onclick = say;
    if ($("#prev")) $("#prev").onclick = () => { i--; draw(); };
    const go = () => { if (i === ids.length - 1) onDone(); else { i++; draw(); } };
    $("#go").onclick = go;
    $("#go").focus();
    say();
    addCleanup(onKey(e => { if (e.key.toLowerCase() === "r") say(); }));
  }
  draw();
}

/* ---------- 짝 맞추기 ---------- */
function showMatch(ids, onDone, onQuit, record_ = true) {
  const words = ids.map(id => byId[id]);
  const left = shuffle(words), right = shuffle(words);
  const missed = new Set();
  render(`<div class="play-top">
      <button class="btn ghost" id="quit" aria-label="나가기">${icon("close")}</button>
      <h3 class="grow">단어와 뜻의 짝을 찾아요</h3>
    </div>
    <div class="match">
      <div class="col">${left.map(w => `<button class="tile en" data-id="${w.id}" data-side="w">${esc(w.w)}</button>`).join("")}</div>
      <div class="col">${right.map(w => `<button class="tile" data-id="${w.id}" data-side="m">${esc(w.m)}</button>`).join("")}</div>
    </div>`);
  $("#quit").onclick = onQuit;
  let sel = null, left_n = words.length;
  $$(".tile").forEach(b => {
    b.onclick = () => {
      if (b.classList.contains("done")) return;
      if (!sel) { sel = b; b.classList.add("sel"); if (b.dataset.side === "w") speak(spoken(byId[b.dataset.id])); return; }
      if (sel === b) { b.classList.remove("sel"); sel = null; return; }
      if (sel.dataset.side === b.dataset.side) { sel.classList.remove("sel"); sel = b; b.classList.add("sel"); return; }
      const a = sel; sel = null; a.classList.remove("sel");
      if (a.dataset.id === b.dataset.id) {
        [a, b].forEach(x => { x.classList.add("done"); x.disabled = true; });
        beep(true); left_n--;
        if (record_ && !missed.has(a.dataset.id)) { intro(a.dataset.id); record(a.dataset.id, true, "meaning"); reward(a.dataset.id, "meaning"); save(); }
        if (!left_n) { save(); const t = setTimeout(onDone, 500); addCleanup(() => clearTimeout(t)); }
      } else {
        [a, b].forEach(x => { x.classList.add("shake"); setTimeout(() => x.classList.remove("shake"), 320); });
        beep(false);
        const wid = a.dataset.side === "w" ? a.dataset.id : b.dataset.id;
        missed.add(wid);
        if (record_) { record(wid, false, null); penalize(wid); save(); }
      }
    };
  });
}

/* ---------- 하루 미션 ---------- */
function buildMission() {
  const reviewPool = reviewOrder();
  const fresh = WORDS.filter(w => !st(w.id)).slice(0, dailyNewCount());
  const stages = [];
  if (reviewPool.length) stages.push({ k: "review", ids: reviewPool.map(w => w.id) });
  for (let i = 0; i < fresh.length; i += 5) stages.push({ k: "learn", ids: fresh.slice(i, i + 5).map(w => w.id) });
  if (fresh.length) {
    stages.push({ k: "real", ids: fresh.map(w => w.id) });
    stages.push({ k: "blank", ids: pick(fresh, 10).map(w => w.id) });
  }
  stages.push({ k: "retry" });
  S.mission = { date: today(), stages, at: 0, wrong: [], startWon: moneyStats().balance };
  save();
}
function missionDone() { return S.mission && S.mission.date === today() && S.mission.at >= S.mission.stages.length; }
function missionActive() { return S.mission && S.mission.date === today() && S.mission.at < S.mission.stages.length; }
function runMission() {
  if (!missionActive()) buildMission();
  const m = S.mission;
  const stage = m.stages[m.at];
  const advance = r => {
    if (r && r.wrong) r.wrong.forEach(id => { if (!m.wrong.includes(id)) m.wrong.push(id); });
    m.at++; save();
    if (m.at >= m.stages.length) return completeMission();
    runMission();
  };
  const stageLabel = `오늘의 미션 ${m.at + 1}/${m.stages.length}`;
  if (stage.k === "review") {
    runRound(stage.ids.map(id => ({ type: nextTypeFor(byId[id]), id })).map(q => q.type === "real" ? { ...q, fake: Math.random() < .5 } : q), { onDone: advance });
  } else if (stage.k === "learn") {
    const quiz = () => runRound(shuffle(stage.ids).map(id => ({ type: "meaning", id })), { onDone: advance });
    showCards(stage.ids, stageLabel + " · 새 단어", () => showMatch(stage.ids, quiz, home), home);
  } else if (stage.k === "real") {
    const items = makeRealItems(stage.ids.map(id => byId[id]), 18);
    if (!items.length) return advance();
    intermission("진짜 단어 찾기", "시험처럼 5초 안에 진짜 단어인지 판단해요. Y 또는 N 키를 눌러요.", () => runRound(items, { onDone: advance }));
  } else if (stage.k === "blank") {
    intermission("문장 빈칸 채우기", "20초 안에 문장 속 단어를 완성해요.", () => runRound(stage.ids.map(id => ({ type: "blank", id })), { onDone: advance }));
  } else {
    if (!m.wrong.length) return advance();
    intermission("틀린 단어 다시 풀기", `오늘 틀린 ${m.wrong.length}개를 맞힐 때까지 다시 풀어요. 벌칙은 없어요!`, () =>
      runRound(shuffle(m.wrong).map(id => ({ type: "meaning", id })), { requeue: true, onDone: advance }));
  }
}
function intermission(title, desc, go) {
  render(`<div class="panel result stack">
      <h2>${esc(title)}</h2><p class="mute">${esc(desc)}</p>
      <button class="btn primary big" id="go">시작 (Enter)</button>
      <button class="btn ghost" id="back">나중에 이어서 하기</button>
    </div>`);
  $("#go").onclick = go; $("#back").onclick = home; $("#go").focus();
}
function completeMission() {
  const t = today();
  if (S.lastDay !== t) {
    S.streak = S.lastDay === addDays(t, -1) ? S.streak + 1 : 1;
    S.lastDay = t;
  }
  save();
  const m = S.mission;
  if (isExam()) {
    render(`<div class="panel result stack">
        <div class="big-star">${icon("trophy")}</div>
        <h1>오늘의 학습 완료!</h1>
        <p>연속 학습 <b>${S.streak}일</b> · 완성한 단어 <b>${WORDS.filter(isMastered).length}</b> / ${WORDS.length}</p>
        <p class="mute">내일은 오늘 틀린 단어부터 복습해요.</p>
        <button class="btn primary big" id="home">홈으로</button>
      </div>`);
    $("#home").onclick = home; $("#home").focus();
    return;
  }
  render(`<div class="panel result stack">
      <div class="big-star">${icon("rocket")}</div>
      <h1>오늘의 탐험 완료!</h1>
      <p>연속 학습 <b>${S.streak}일</b> · 오늘의 탐험 <b>${moneyStats().balance >= (m.startWon || 0) ? "+" : ""}${fmtWon(moneyStats().balance - (m.startWon || 0))}</b></p>
      <p class="mute">외운 단어 ${WORDS.filter(isMastered).length} / ${WORDS.length}</p>
      <button class="btn primary big" id="home">탐험 지도로</button>
    </div>`);
  $("#home").onclick = home; $("#home").focus();
}

/* ---------- 홈 ---------- */
function planetStats(day) {
  const list = WORDS.filter(w => w.day === day);
  const mastered = list.filter(isMastered).length, seen = list.filter(w => st(w.id)).length;
  return { total: list.length, mastered, seen, ratio: (mastered + (seen - mastered) * .35) / list.length };
}
function prologue() {
  render(`<div class="panel story stack">
      <div class="big-star">${icon("rocket")}</div>
      <h1>단어 도둑을 찾아서</h1>
      <p>나는 초등학교 6학년. 어느 날 밤, 책상 위 단어장이 빛나더니 작은 우주선이 창밖에 내려앉았어요.</p>
      <p>"단어 도둑이 10개 행성에서 영어 단어 500개를 훔쳐 갔어. 네가 되찾아 줘!"</p>
      <div class="rules">
        <h3>탐험 규칙</h3>
        <p>퀴즈를 처음 맞힌 단계마다 <b>+${WON_STEP}원</b>, 보스를 격파하면 <b>+${WON_BOSS}원</b></p>
        <p>틀리면 <b>-${WON_STEP}원</b> (같은 단어는 하루 한 번만 깎여요)</p>
        <p>플래시카드는 돈이 움직이지 않는 연습이에요. 모르면 솔직하게 <b>몰랐어요</b>를 눌러요.</p>
        <p>하나도 틀리지 않고 모두 되찾으면 <b>${fmtWon(WON_GOAL)}</b>!</p>
      </div>
      <button class="btn primary big" id="go">탐험 떠나기 (Enter)</button>
    </div>`);
  $("#go").onclick = () => { S.storySeen = true; save(); home(); };
  $("#go").focus();
}
function modeSelect() {
  render(`<div class="stack">
      <header class="exam-hero">
        <p class="small mute">「${esc(BOOK_NAME)}」 기출 어휘 ${TRIAL ? "· 체험판" : FULL_WORDS}</p>
        <h1>${esc(APP_NAME)}</h1>
        <p class="mute">학습 방식을 고르세요. 나중에 학습 관리 화면에서 바꿀 수 있어요.</p>
      </header>
      <div class="mode-pick">
        <button class="mode-card" data-mode="exam">
          <span class="icon" aria-hidden="true">${icon("target")}</span>
          <strong>수험생 모드</strong>
          <span class="mute">목표 점수와 시험일에 맞춘 하루 분량, DET 유형별 정답률, 실전 모의</span>
          <span class="chip">고등학생 · 대학생 · 성인</span>
        </button>
        <button class="mode-card" data-mode="kids">
          <span class="icon" aria-hidden="true">${icon("rocket")}</span>
          <strong>초등 탐험대 모드</strong>
          <span class="mute">10개 행성을 되찾는 이야기, 보스전, 적립 보상, 보호자 화면</span>
          <span class="chip">국제학교 · 조기유학 준비 초등생</span>
        </button>
      </div>
    </div>`);
  $$(".mode-card").forEach(b => { b.onclick = () => { S.settings.mode = b.dataset.mode; save(); home(); }; });
  $(".mode-card").focus();
}
function home() {
  if (!S.settings.mode) return modeSelect();
  document.title = TRIAL ? (isExam() ? "DET 실전 VOCA" : "단어 행성 탐험대") + " 체험판" : isExam() ? APP_NAME : "단어 행성 탐험대";
  if (isExam()) return examHome();
  if (!S.storySeen) return prologue();
  const dueN = dueWords().length, newN = dailyNewCount(), mastered = WORDS.filter(isMastered).length;
  const active = missionActive(), done = missionDone();
  const dDay = S.settings.examDate ? diffDays(today(), S.settings.examDate) : null;
  const money = moneyStats(), cur = STORY.findIndex((_, i) => isOpen(i + 1) && !S.boss[i + 1]);
  const allClear = cur === -1;
  render(`<header class="hero">
      <div class="row between">
        <h1><span class="brand">${icon("planet")}</span> 단어 행성 탐험대</h1>
        <div class="chips">
          <span class="chip">${icon("flame")} ${S.streak}일</span>
          ${dDay !== null ? `<span class="chip">${dDay > 0 ? "D-" + dDay : dDay === 0 ? "D-Day" : "시험 종료"}</span>` : ""}
        </div>
      </div>
      <p class="hero-story">${allClear ? (TRIAL ? "체험판 행성을 되찾았어요! 정식판에서 다른 행성들이 열려요." : "10개 행성을 모두 되찾았어요. 시험장에서 이 단어들이 나를 도와줄 거예요!") : `지금 탐험 중: <b>DAY ${cur + 1} ${esc(STORY[cur].title)}</b>`}</p>
      <div class="wallet" role="img" aria-label="적립금 ${fmtWon(money.balance)}, 목표 ${fmtWon(WON_GOAL)}">
        <div class="row between"><b class="wallet-now">${fmtWon(money.balance)}</b><span class="mute small">목표 ${fmtWon(WON_GOAL)}</span></div>
        <div class="bar wallet-bar"><i style="width:${money.balance / WON_GOAL * 100}%"></i></div>
        <p class="mute small">퀴즈 단계 +${WON_STEP}원 · 보스 격파 +${WON_BOSS}원 · 틀리면 -${WON_STEP}원${S.lost ? ` · 지금까지 감점 ${fmtWon(S.lost)}` : ""}</p>
      </div>
    </header>
    <div class="stack">
      ${trialNote()}
      ${saveFailed ? `<p class="notice">이 브라우저에서 기록을 저장하지 못하고 있어요. 다른 브라우저로 열거나 보호자 화면에서 백업하세요.</p>` : ""}
      <section class="panel mission">
        <h2>${done ? "오늘의 탐험을 끝냈어요!" : active ? "탐험을 이어서 해요" : "오늘의 탐험"}</h2>
        <div class="counts">
          <span>복습 <b>${Math.min(dueN, REVIEW_CAP)}</b>개</span>
          <span>새 단어 <b>${done ? 0 : newN}</b>개</span>
          <span>외운 단어 <b>${mastered}</b> / ${WORDS.length}</span>
        </div>
        ${done
          ? (dueN ? `<button class="btn primary big" id="extra">남은 복습 ${dueN}개 풀기</button>` : `<p class="mute">내일 다시 만나요. 아래 게임은 언제든 할 수 있어요.</p>`)
          : `<button class="btn primary big" id="mission">${active ? "이어서 하기" : "탐험 시작"} (Enter)</button>`}
      </section>
      <section class="stack" aria-label="탐험 지도">
        <h2>탐험 지도</h2>
        <ol class="route">${STORY.map((ch, i) => {
          const d = i + 1;
          if (!isOpen(d)) return `<li class="stop locked"><div class="stop-main" aria-label="DAY ${d} 잠김">
              <div class="orb" style="--c:${PLANET_COLORS[i]};--p:0"></div>
              <span class="grow stop-text"><span class="small mute">DAY ${d} · ${PLANET_NAMES[i]} 행성</span><strong>${esc(ch.title)}</strong><span class="small mute">정식판에서 열려요</span></span>
            </div></li>`;
          const p = planetStats(d), m = moneyStats(d), f = S.flash[d];
          const state = S.boss[d] ? "clear" : i === cur ? "now" : "";
          return `<li class="stop ${state}">
            <button class="stop-main" data-day="${d}" aria-label="DAY ${d} ${esc(ch.title)} 열기">
              <div class="orb ${S.boss[d] ? "done" : ""}" style="--c:${PLANET_COLORS[i]};--p:${p.ratio.toFixed(2)}"></div>
              <span class="grow stop-text">
                <span class="small mute">DAY ${d} · ${PLANET_NAMES[i]} 행성${state === "now" ? ' · <b class="stop-now">지금 여기</b>' : ""}${state === "clear" ? " · 되찾음" : ""}</span>
                <strong>${esc(ch.title)}</strong>
                <span class="small mute">${fmtWon(m.earned)} / ${fmtWon(m.max)} · 외운 단어 ${p.mastered}/${p.total}</span>
              </span>
            </button>
            <a class="btn stop-flash" href="#flash${d}">카드 ${f ? f.known.length : 0}/50</a>
          </li>`;
        }).join("")}</ol>
      </section>
      <section class="panel stack">
        <div class="row between">
          <div><h2>자유 연습</h2><p class="mute small">맞히면 적립돼요. 배운 단어를 틀리면 감점돼요.</p></div>
          <label class="row small">범위
            <select id="range">
              <option value="learned">배운 단어</option>
              <option value="weak">자주 틀린 단어</option>
              ${dayOptions()}
            </select>
          </label>
        </div>
        <div class="games">
          ${gameBtn("meaning", "target", "뜻 맞히기", "단어와 뜻 4지선다")}
          ${gameBtn("match", "puzzle", "짝 맞추기", "단어와 뜻 연결")}
          ${gameBtn("real", "timer", "진짜 단어 찾기", "5초 YES/NO")}
          ${gameBtn("blank", "pencil", "문장 빈칸 채우기", "20초 안에 입력")}
          ${gameBtn("listen", "headphones", "듣고 쓰기", "발음 듣고 철자 입력")}
          ${gameBtn("exam", "flag", "실전 모의", "힌트 없이 시험처럼")}
        </div>
      </section>
      ${appPanelHtml()}
      <div class="row between">
        <button class="btn ghost" id="sound">${S.settings.sound ? icon("bell") + " 효과음 켜짐" : icon("bellOff") + " 효과음 꺼짐"}</button>
        <button class="btn" id="parent">보호자 화면</button>
      </div>
      <p class="small mute" style="text-align:center">Duolingo와 관련 없는 개인 학습용 프로젝트입니다. <a style="color:inherit" href="credits.html">이미지 출처</a></p>
      ${downloadLinksHtml()}
    </div>`);
  const mb = $("#mission");
  if (mb) { mb.onclick = runMission; mb.focus(); }
  if ($("#extra")) $("#extra").onclick = () => {
    const ids = reviewOrder().map(w => w.id);
    runRound(ids.map(id => ({ type: nextTypeFor(byId[id]), id })).map(q => q.type === "real" ? { ...q, fake: Math.random() < .5 } : q), { onDone: r => showResult(r, "복습 완료!") });
  };
  $$(".stop-main").forEach(b => { b.onclick = () => planetView(Number(b.dataset.day)); });
  $$(".game-btn").forEach(b => { b.onclick = () => startFree(b.dataset.game, $("#range").value); });
  $("#sound").onclick = () => { S.settings.sound = !S.settings.sound; save(); home(); };
  $("#parent").onclick = parentView;
  appPanelWire();
  downloadLinksWire();
}
/* ---------- 수험생 모드 홈 ---------- */
const pctOf = (c, a) => a ? Math.round(c / a * 100) : 0;
function examHome() {
  const dueN = dueWords().length, newN = dailyNewCount(), mastered = WORDS.filter(isMastered).length, seen = introduced().length;
  const active = missionActive(), done = missionDone();
  const dDay = S.settings.examDate ? diffDays(today(), S.settings.examDate) : null;
  const last = S.exams[S.exams.length - 1], best = S.exams.length ? Math.max(...S.exams.map(e => e.pct)) : null;
  render(`<header class="exam-hero">
      <div class="row between">
        <div>
          <p class="small mute">「${esc(BOOK_NAME)}」 기출 어휘</p>
          <h1>${esc(APP_NAME)}</h1>
        </div>
        <div class="chips">
          ${TRIAL ? `<span class="chip trial">체험판</span>` : ""}
          <span class="chip">목표 ${S.settings.target}+</span>
          ${dDay !== null ? `<span class="chip dday">${dDay > 0 ? "D-" + dDay : dDay === 0 ? "D-Day" : "시험 종료"}</span>` : ""}
          <span class="chip">${icon("flame")} ${S.streak}일</span>
        </div>
      </div>
      <div class="goal">
        <div class="row between"><span><b class="goal-now">${mastered}</b> <span class="mute">/ ${WORDS.length} 단어 완성</span></span><span class="mute small">학습 시작 ${seen}개</span></div>
        <div class="bar goal-bar" role="img" aria-label="완성한 단어 ${mastered}개 중 ${WORDS.length}개"><i style="width:${seen / WORDS.length * 100}%" class="seen"></i><i style="width:${mastered / WORDS.length * 100}%"></i></div>
        <p class="small mute">${seen === WORDS.length ? `${WORDS.length}개를 모두 학습했어요. 이제 복습과 실전 모의로 다져요.` : S.settings.examDate ? `시험일까지 하루 새 단어 <b>${newN}</b>개씩 배우면 시험 5일 전에 ${WORDS.length}개를 모두 끝내요.` : `<button class="linkish" id="setDate">시험일을 입력</button>하면 하루 분량을 자동으로 계산해요.`}</p>
      </div>
    </header>
    <div class="stack">
      ${trialNote()}
      ${saveFailed ? `<p class="notice">이 브라우저에서 기록을 저장하지 못하고 있어요. 다른 브라우저로 열거나 학습 관리 화면에서 백업하세요.</p>` : ""}
      <section class="panel mission">
        <h2>${done ? "오늘의 학습을 끝냈어요" : active ? "오늘의 학습 이어서 하기" : "오늘의 학습"}</h2>
        <div class="counts">
          <span>복습 <b>${Math.min(dueN, REVIEW_CAP)}</b>개</span>
          <span>새 단어 <b>${done ? 0 : newN}</b>개</span>
          <span>DET 유형 문제 포함</span>
        </div>
        ${done
          ? (dueN ? `<button class="btn primary big" id="extra">남은 복습 ${dueN}개 풀기</button>` : `<p class="mute">내일 다시 만나요. 아래 유형별 연습은 언제든 할 수 있어요.</p>`)
          : `<button class="btn primary big" id="mission">${active ? "이어서 하기" : "학습 시작"} (Enter)</button>`}
      </section>
      <section class="panel stack">
        <div class="row between"><h2>DET 유형별 정답률</h2><span class="small mute">이 앱에서 푼 문제 기준</span></div>
        ${DET_TYPES.map(t => {
          const s = S.typeStats[t.type] || { a: 0, c: 0 }, p = pctOf(s.c, s.a);
          return `<button class="type-row" data-game="${t.type}">
            <span class="type-name"><b class="en">${t.name}</b><span class="small mute">${t.desc}</span></span>
            <span class="bar grow"><i style="width:${p}%"></i></span>
            <span class="type-pct">${s.a ? p + "%" : "-"}<span class="small mute">${s.a}문제</span></span>
          </button>`;
        }).join("")}
        <div class="row between exam-rec">
          <span><b>실전 모의</b> <span class="small mute">${last ? `최근 ${last.right}/${last.total} (${last.pct}%) · 최고 ${best}% · ${S.exams.length}회` : "아직 기록이 없어요"}</span></span>
          <button class="btn primary" id="exam">실전 모의 보기</button>
        </div>
      </section>
      <section class="panel stack">
        <div class="row between">
          <div><h2>유형별 연습</h2><p class="mute small">범위를 고르고 원하는 유형만 집중해서 풀어요.</p></div>
          <label class="row small">범위
            <select id="range">
              <option value="learned">학습한 단어</option>
              <option value="weak">자주 틀린 단어</option>
              ${dayOptions()}
            </select>
          </label>
        </div>
        <div class="games">
          ${gameBtn("real", "timer", "Read and Select", "5초 안에 진짜 단어 YES/NO")}
          ${gameBtn("blank", "pencil", "Fill in the Blanks", "20초 안에 빈칸 완성")}
          ${gameBtn("listen", "headphones", "Listen and Type", "발음 듣고 철자 입력")}
          ${gameBtn("meaning", "target", "뜻 확인", "단어와 뜻 4지선다")}
          ${gameBtn("match", "puzzle", "짝 맞추기", "단어와 뜻 연결")}
          ${gameBtn("exam", "flag", "실전 모의", "세 유형을 힌트 없이")}
        </div>
      </section>
      <section class="stack" aria-label="DAY별 단어">
        <h2>DAY별 단어</h2>
        <ol class="daylist">${PLANET_NAMES.map((_, i) => {
          const d = i + 1;
          if (!isOpen(d)) return `<li class="day-row locked"><div class="day-main"><b class="day-no">${dayLabel(d)}</b><span class="grow small mute">정식판에서 열려요 · 50단어</span></div></li>`;
          const p = planetStats(d), f = S.flash[d];
          return `<li class="day-row${S.boss[d] ? " clear" : ""}">
            <button class="day-main" data-day="${d}" aria-label="DAY ${d} 단어 목록 열기">
              <b class="day-no">DAY ${String(d).padStart(2, "0")}</b>
              <span class="grow stack-tight">
                <span class="bar"><i style="width:${p.mastered / p.total * 100}%"></i></span>
                <span class="small mute">완성 ${p.mastered}/${p.total} · 학습 ${p.seen}/${p.total}${S.boss[d] ? " · DAY 테스트 통과" : ""}</span>
              </span>
            </button>
            <a class="btn stop-flash" href="#flash${d}">카드 ${f ? f.known.length : 0}/50</a>
          </li>`;
        }).join("")}</ol>
      </section>
      ${appPanelHtml()}
      <div class="row between">
        <button class="btn ghost" id="sound">${S.settings.sound ? icon("bell") + " 효과음 켜짐" : icon("bellOff") + " 효과음 꺼짐"}</button>
        <button class="btn" id="parent">학습 관리</button>
      </div>
      <p class="small mute" style="text-align:center">「${esc(BOOK_NAME)}」 교재용 샘플 앱입니다. Duolingo와 관련 없습니다. <a style="color:inherit" href="credits.html">이미지 출처</a></p>
      ${downloadLinksHtml()}
    </div>`);
  const mb = $("#mission");
  if (mb) { mb.onclick = runMission; mb.focus(); }
  if ($("#extra")) $("#extra").onclick = () => {
    const ids = reviewOrder().map(w => w.id);
    runRound(ids.map(id => ({ type: nextTypeFor(byId[id]), id })).map(q => q.type === "real" ? { ...q, fake: Math.random() < .5 } : q), { onDone: r => showResult(r, "복습 완료!") });
  };
  if ($("#setDate")) $("#setDate").onclick = parentView;
  $("#exam").onclick = () => startFree("exam", $("#range").value);
  $$(".type-row").forEach(b => { b.onclick = () => startFree(b.dataset.game, $("#range").value); });
  $$(".day-main").forEach(b => { b.onclick = () => planetView(Number(b.dataset.day)); });
  $$(".game-btn").forEach(b => { b.onclick = () => startFree(b.dataset.game, $("#range").value); });
  $("#sound").onclick = () => { S.settings.sound = !S.settings.sound; save(); home(); };
  $("#parent").onclick = parentView;
  appPanelWire();
  downloadLinksWire();
}
const gameBtn = (id, ic, name, desc) => `<button class="game-btn" data-game="${id}"><span class="icon" aria-hidden="true">${icon(ic)}</span><strong>${name}</strong><span class="mute">${desc}</span></button>`;

/* ---------- 자유 연습 ---------- */
function rangeWords(range) {
  if (range === "learned") return introduced();
  if (range === "weak") return introduced().filter(w => st(w.id).wrong > 0).sort((a, b) => st(b.id).wrong - st(a.id).wrong).slice(0, 40);
  return WORDS.filter(w => w.day === Number(range));
}
function startFree(game, range) {
  let pool = rangeWords(range);
  if (pool.length < 4) {
    if (range === "weak") return message("자주 틀린 단어가 아직 적어요", "틀린 단어가 4개 이상 모이면 여기서 연습할 수 있어요.");
    if (range === "learned") pool = WORDS.filter(w => w.day === 1);
  }
  const done = r => showResult(r, "연습 완료!", () => startFree(game, range));
  if (game === "meaning") runRound(pick(pool, 15).map(w => ({ type: "meaning", id: w.id })), { onDone: done });
  else if (game === "match") {
    const ids = pick(pool, 5).map(w => w.id), before = moneyStats().balance;
    showMatch(ids, () => showResult({ total: ids.length, right: ids.length, wrong: [], won: moneyStats().balance - before }, "짝 맞추기 완료!", () => startFree(game, range)), home);
  }
  else if (game === "real") {
    const items = makeRealItems(pool, 15 + Math.floor(Math.random() * 4));
    if (!items.length) return message("이 범위에는 한 단어 항목이 없어요", "다른 범위를 골라 주세요.");
    runRound(items, { onDone: done });
  }
  else if (game === "blank") runRound(pick(pool, 9).map(w => ({ type: "blank", id: w.id })), { onDone: done });
  else if (game === "listen") runRound(pick(pool.filter(canListen), 10).map(w => ({ type: "listen", id: w.id })), { onDone: done });
  else startExam(pool);
}
function startExam(pool) {
  const base = pool.length >= 30 ? pool : WORDS;
  const real = makeRealItems(base, 15 + Math.floor(Math.random() * 4));
  const blank = pick(base, 6 + Math.floor(Math.random() * 4)).map(w => ({ type: "blank", id: w.id }));
  const listen = pick(base.filter(canListen), 5).map(w => ({ type: "listen", id: w.id }));
  const last = S.exams[S.exams.length - 1];
  intermission("실전 모의", `진짜 단어 찾기 ${real.length}문제, 빈칸 ${blank.length}문제, 듣고 쓰기 ${listen.length}문제를 힌트 없이 풀어요. DET 점수를 예측하는 시험은 아니에요.${last ? ` 지난 기록: ${last.right}/${last.total}` : ""}`, () =>
    runRound([...real, ...blank, ...listen], { exam: true, onDone: r => {
      const pct = r.total ? Math.round(r.right / r.total * 100) : 0;
      const best = Math.max(pct, ...S.exams.map(e => e.pct));
      S.exams.push({ at: Date.now(), date: today(), right: r.right, total: r.total, pct, won: r.won });
      if (S.exams.length > 50) S.exams.shift();
      save();
      r.note = `${S.exams.length}번째 기록을 저장했어요. 최고 기록 ${best}%`;
      showResult(r, "실전 모의 끝!", () => startExam(pool));
    } }));
}
function showResult(r, title, again) {
  const pct = r.total ? Math.round(r.right / r.total * 100) : 0;
  render(`<div class="panel result stack">
      <h1>${esc(title)}</h1>
      <div class="score">${r.right} / ${r.total}</div>
      <p>정답률 ${pct}%${isExam() ? "" : ` · 이번 변동 <b>${r.won > 0 ? "+" : ""}${fmtWon(r.won)}</b> · 적립금 <b>${fmtWon(moneyStats().balance)}</b>`}</p>
      ${r.note ? `<p class="story-note">${esc(r.note)}</p>` : ""}
      ${r.wrong.length ? `<div style="text-align:left"><h3>다시 볼 단어</h3>${r.wrong.map(id => wordRow(byId[id])).join("")}</div>` : `<p>모두 맞혔어요!</p>`}
      <div class="row" style="justify-content:center">
        ${again ? `<button class="btn" id="again">한 번 더</button>` : ""}
        <button class="btn primary" id="home">${homeLabel()}</button>
      </div>
    </div>`);
  if (again) $("#again").onclick = again;
  $("#home").onclick = home; $("#home").focus();
  wireRows();
}
function message(title, text) {
  render(`<div class="panel result stack"><h2>${esc(title)}</h2><p class="mute">${esc(text)}</p><button class="btn primary big" id="home">돌아가기</button></div>`);
  $("#home").onclick = home; $("#home").focus();
}

/* ---------- 행성 (DAY) 화면 ---------- */
function statusBadge(w) {
  const s = st(w.id);
  if (!s) return `<span class="badge">새 단어</span>`;
  if (isMastered(w)) return `<span class="badge m">${isExam() ? "완성" : "외움"}</span>`;
  return `<span class="badge l">${Object.keys(s.skill).length}/3</span>`;
}
const wordRow = w => `<button class="wordrow" data-say="${w.id}"><span class="mute small">${String(w.no).padStart(3, "0")}</span><span class="en"><b>${esc(w.w)}</b></span><span class="small">${esc(w.m)}</span>${statusBadge(w)}</button>`;
function wireRows() { $$(".wordrow").forEach(b => { b.onclick = () => speak(spoken(byId[b.dataset.say])); }); }
function planetView(day) {
  const list = WORDS.filter(w => w.day === day), p = planetStats(day), m = moneyStats(day);
  const ready = list.every(w => st(w.id));
  if (isExam()) {
    render(`<div class="play-top"><button class="btn ghost" id="back" aria-label="뒤로">←</button><h2 class="grow">DAY ${String(day).padStart(2, "0")}</h2><span class="chip">${p.mastered}/${p.total} 완성</span></div>
      <div class="stack">
        <div class="panel stack">
          <div class="row between small"><span>완성한 단어</span><b>${p.mastered} / ${p.total}</b></div>
          <div class="bar"><i style="width:${p.mastered / p.total * 100}%"></i></div>
          <p class="small mute">완성 = 뜻 확인, 철자 판별, 직접 입력을 서로 다른 날에 모두 통과한 단어</p>
        </div>
        <a class="btn primary big flash-link" href="#flash${day}">플래시카드 50장으로 익히기</a>
        <div class="panel stack">
          <div class="row between">
            <div class="grow"><h3>DAY 테스트${S.boss[day] ? " · 통과" : ""}</h3><p class="mute small">${ready ? "20문제, 3개 틀리면 종료. Read and Select, Fill in the Blanks, 뜻 확인이 섞여 나와요." : `이 DAY의 단어를 모두 학습하면 열려요. (${p.seen}/${p.total})`}</p></div>
            <button class="btn primary" id="boss" ${ready ? "" : "disabled"}>응시</button>
          </div>
        </div>
        <div class="panel">${list.map(wordRow).join("")}</div>
      </div>`);
    $("#back").onclick = () => { if (location.hash) location.hash = ""; else home(); };
    wireRows();
    $("#boss").onclick = () => bossBattle(day);
    return;
  }
  render(`<div class="play-top"><button class="btn ghost" id="back" aria-label="뒤로">←</button><h2 class="grow">DAY ${day} · ${PLANET_NAMES[day - 1]} 행성</h2><span class="chip">${p.mastered}/${p.total} 외움</span></div>
    <div class="stack">
      <div class="panel story stack">
        <h3>${esc(STORY[day - 1].title)}</h3>
        <p>${esc(S.boss[day] ? STORY[day - 1].clear : STORY[day - 1].intro)}</p>
        <div class="row between small"><span>이 행성의 보상</span><b>${fmtWon(m.earned)} / ${fmtWon(m.max)}</b></div>
        <div class="bar"><i style="width:${m.earned / m.max * 100}%"></i></div>
      </div>
      <a class="btn primary big flash-link" href="#flash${day}">플래시카드 50장으로 익히기</a>
      <div class="panel stack">
        <div class="row between">
          <div class="grow"><h3>보스전${S.boss[day] ? "★ 클리어" : ""}</h3><p class="mute small">${ready ? `20문제, 하트 3개. 처음 격파하면 +${WON_BOSS}원. 틀린 문제는 감점돼요.` : `이 행성의 단어를 모두 배우면 열려요. (${p.seen}/${p.total})`}</p></div>
          <button class="btn primary" id="boss" ${ready ? "" : "disabled"}>도전</button>
        </div>
      </div>
      <div class="panel">${list.map(wordRow).join("")}</div>
    </div>`);
  $("#back").onclick = () => { if (location.hash) location.hash = ""; else home(); };
  wireRows();
  $("#boss").onclick = () => bossBattle(day);
}
function bossBattle(day) {
  const pool = WORDS.filter(w => w.day === day);
  const qs = pick(pool, 20).map((w, i) => {
    if (i % 3 === 0 && isSingle(w)) return { type: "real", id: w.id, fake: Math.random() < .5 };
    if (i % 3 === 1) return { type: "blank", id: w.id };
    return { type: "meaning", id: w.id };
  });
  runRound(qs, {
    hearts: 3,
    onQuit: () => planetView(day),
    onDone: r => {
      const first = !r.lost && !S.boss[day];
      if (!r.lost) { S.boss[day] = true; save(); }
      if (first) { moneyToast(WON_BOSS); r.won += WON_BOSS; }
      if (isExam()) return showResult(r, r.lost ? "3개를 틀려 종료됐어요. 틀린 단어를 보고 다시 응시하세요" : `DAY ${String(day).padStart(2, "0")} 테스트 통과!`, () => bossBattle(day));
      if (!r.lost) r.note = day === 10 && first ? STORY[9].clear + " 탐험 완료!" : STORY[day - 1].clear;
      showResult(r, r.lost ?"아쉬워요! 틀린 단어를 보고 다시 도전해요" : first ? `보스 격파! +${WON_BOSS}원` : "보스 다시 격파!", () => bossBattle(day));
    },
  });
}

/* ---------- 시연 ----------
   ?demo 로 열면 학습 관리 화면에 시연 도구가 생긴다.
   시험 42일 전 수험생의 기록을 만든다. */
const DEMO = /[?&]demo\b/.test(location.search);
function demoState(mode) {
  const s = blank(), t = today(), d = n => addDays(t, n);
  s.settings = { ...s.settings, mode, examDate: d(42), target: 120 };
  s.storySeen = true;
  // 정식판은 DAY 1~4의 200개를 배우고 162개 완성, 체험판은 DAY 1의 35개를 배우고 25개 완성
  const pool = WORDS.filter(w => w.day <= 4).slice(0, TRIAL ? 35 : 200), doneN = TRIAL ? 25 : 162;
  pool.forEach((w, i) => {
    const done = i < doneN;
    s.words[w.id] = {
      box: done ? 4 : 1, due: done ? d(5) : d(i % 3 ? 0 : 1), wrong: i % 7 === 0 ? 3 : i % 5 === 0 ? 1 : 0, right: 6,
      last: d(-1), failed: false, intro: d(-12 + Math.floor(i / 25)),
      skill: done ? { meaning: d(-9), recog: d(-6), type: d(-3) } : { meaning: d(-2) },
      earn: done ? { meaning: 1, recog: 1, type: 1 } : { meaning: 1 },
    };
  });
  s.typeStats = { real: { a: 286, c: 251 }, blank: { a: 154, c: 117 }, listen: { a: 98, c: 71 }, meaning: { a: 420, c: 391 } };
  const now = Date.now();
  s.exams = [[-7, 21, 31], [-4, 24, 32], [-1, 26, 31]].map(([k, r, n]) => ({ at: now + k * 864e5, date: d(k), right: r, total: n, pct: Math.round(r / n * 100), won: 0 }));
  s.streak = 12; s.lastDay = d(-1);
  [1, 2, 3].forEach(d => { if (isOpen(d) && WORDS.filter(w => w.day === d).every(w => s.words[w.id] && s.words[w.id].box === 4)) s.boss[d] = true; });
  for (let k = 12; k >= 1; k--) s.log[d(-k)] = { answered: 80, correct: 68 };
  const known = day => WORDS.filter(w => w.day === day).map(w => w.id);
  s.flash = { 1: { known: known(1).slice(0, TRIAL ? 30 : 50), rounds: 2, missed: {}, ms: 9e5, t: now } };
  if (isOpen(2)) s.flash[2] = { known: known(2).slice(0, 44), rounds: 1, missed: {}, ms: 6e5, t: now };
  return s;
}

/* ---------- 보호자 화면 ---------- */
function parentView() {
  const seen = introduced().length, mastered = WORDS.filter(isMastered).length;
  const weak = introduced().filter(w => st(w.id).wrong > 0).sort((a, b) => st(b.id).wrong - st(a.id).wrong).slice(0, 20);
  const logs = Object.values(S.log);
  const ans = logs.reduce((n, l) => n + l.answered, 0), cor = logs.reduce((n, l) => n + l.correct, 0);
  const exam = isExam();
  render(`<div class="play-top"><button class="btn ghost" id="back" aria-label="뒤로">←</button><h2 class="grow">${exam ? "학습 관리" : "보호자 화면"}</h2></div>
    <div class="stack">
      <div class="stat">
        <div><b>${mastered}</b>${exam ? "완성한 단어" : "외운 단어"}</div>
        <div><b>${seen}</b>${exam ? "학습한 단어" : "배운 단어"}</div>
        <div><b>${ans ? Math.round(cor / ans * 100) : 0}%</b>전체 정답률</div>
        <div><b>${Object.keys(S.log).length}</b>학습한 날</div>
      </div>
      <div class="panel stack">
        <h3>학습 모드</h3>
        <div class="row">
          <label class="row small"><input type="radio" name="mode" value="exam" ${exam ? "checked" : ""}> 수험생 모드</label>
          <label class="row small"><input type="radio" name="mode" value="kids" ${exam ? "" : "checked"}> 초등 탐험대 모드</label>
        </div>
        ${exam ? `<label class="field">목표 점수
          <select id="target">${TARGETS.map(n => `<option value="${n}" ${n === Number(S.settings.target) ? "selected" : ""}>${n}+</option>`).join("")}</select></label>` : ""}
        <p class="small mute">모드를 바꿔도 학습 기록은 그대로 유지됩니다.</p>
      </div>
      ${exam ? "" : `<div class="panel stack">
        <h3>탐험 적립금</h3>
        <div class="row between"><span>현재 적립금</span><b>${fmtWon(moneyStats().balance)} / ${fmtWon(WON_GOAL)}</b></div>
        <div class="row between small mute"><span>적립 ${fmtWon(moneyStats().earned)}</span><span>감점 ${fmtWon(S.lost)}</span></div>
        <p class="small mute">게임 안의 숫자입니다. 실제로 지급할지와 지급 조건은 보호자가 정해 주세요.</p>
      </div>`}
      <div class="panel stack">
        <h3>실전 모의 기록</h3>
        ${S.exams.length ? S.exams.slice(-5).reverse().map(e => `<div class="row between small"><span>${esc(e.date)}</span><b>${e.right}/${e.total} (${e.pct}%)</b></div>`).join("") : `<p class="small mute">아직 기록이 없습니다.</p>`}
      </div>
      <p class="mute small">"${exam ? "완성한 단어" : "외운 단어"}"는 뜻 맞히기, 철자 판별, 직접 입력을 서로 다른 날에 모두 통과한 단어입니다. 밀린 복습이 ${REVIEW_CAP}개를 넘으면 새 단어 수가 자동으로 줄어듭니다.</p>
      <div class="panel stack">
        <h3>DAY별 진행</h3>
        ${OPEN_DAYS.map(d => { const p = planetStats(d); return `<div class="row"><span class="small" style="width:60px">DAY ${d}</span><div class="bar grow"><i style="width:${p.mastered / p.total * 100}%"></i></div><span class="small mute" style="width:50px;text-align:right">${p.mastered}/${p.total}</span></div>`; }).join("")}
      </div>
      <div class="panel stack">
        <h3>학습 설정</h3>
        <label class="field">시험 날짜 (입력하면 하루 새 단어 수를 자동으로 계산)
          <input type="date" id="exam" value="${esc(S.settings.examDate)}"></label>
        <label class="field">시험 날짜가 없을 때 하루 새 단어 수
          <select id="daily">${[10, 15, 20, 25, 30, 40, 50].map(n => `<option ${n === S.settings.dailyNew ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <p class="small mute" id="calc">앞으로 하루 새 단어: ${dailyNewCount()}개</p>
      </div>
      <div class="panel stack">
        <h3>자주 틀린 단어</h3>
        ${weak.length ? weak.map(w => `<div class="row between small"><span class="en"><b>${esc(w.w)}</b> <span class="mute">${esc(w.m)}</span></span><span class="chip">틀림 ${st(w.id).wrong}</span></div>`).join("") : `<p class="mute small">아직 없습니다.</p>`}
      </div>
      ${syncPanelHtml()}
      <div class="panel stack">
        <h3>기록 백업과 복원</h3>
        <p class="small mute">기록은 이 브라우저에 저장됩니다. 브라우저 데이터를 지우면 사라지므로 가끔 백업해 주세요.</p>
        <div class="row">
          <button class="btn" id="export">백업 파일 저장</button>
          <label class="btn" style="display:inline-flex;align-items:center">복원 파일 선택<input type="file" id="import" accept=".json,application/json" style="position:absolute;opacity:0;width:1px"></label>
          <button class="btn bad" id="reset">기록 전체 삭제</button>
        </div>
        <p class="small" id="ioMsg" role="status"></p>
      </div>
      <div class="panel stack">
        <h3>책의 뜻 확인이 필요한 단어</h3>
        <p class="small mute">게임은 책 표기를 그대로 사용합니다. 아래 항목은 사전의 대표 뜻과 달라 지도할 때 참고해 주세요.</p>
        ${Object.entries(BOOK_NOTES).filter(([k]) => WORDS.some(w => w.w === k)).map(([k, v]) => `<p class="small"><b class="en">${esc(k)}</b>: ${esc(v)}</p>`).join("")}
      </div>
      ${DEMO ? `<div class="panel stack demo-panel">
        <h3>시연 도구</h3>
        <p class="small mute">주소 끝에 <b>?demo</b>를 붙였을 때만 보입니다. 기기 동기화는 끊고 이 기기에만 적용됩니다.</p>
        <div class="row">
          <button class="btn" id="demoSeed">진행 중인 학습자 기록 넣기</button>
          <button class="btn" id="demoFresh">처음 상태로 (모드 선택부터)</button>
        </div>
      </div>` : ""}
    </div>`);
  $("#back").onclick = home;
  syncPanelWire(parentView);
  if (DEMO) {
    $("#demoSeed").onclick = () => { syncDisconnect(); S = demoState(S.settings.mode || "exam"); save(); home(); };
    $("#demoFresh").onclick = () => { syncDisconnect(); S = blank(); save(); home(); };
  }
  const upd = () => { $("#calc").textContent = `앞으로 하루 새 단어: ${dailyNewCount()}개`; };
  $("#exam").onchange = e => { S.settings.examDate = e.target.value; save(); upd(); };
  $("#daily").onchange = e => { S.settings.dailyNew = Number(e.target.value); save(); upd(); };
  $$('input[name="mode"]').forEach(r => { r.onchange = () => { S.settings.mode = r.value; save(); parentView(); }; });
  if ($("#target")) $("#target").onchange = e => { S.settings.target = Number(e.target.value); save(); };
  $("#export").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }));
    a.download = "단어행성-백업-" + today() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $("#ioMsg").textContent = "백업 파일을 저장했어요.";
  };
  $("#import").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d.words || !d.settings) throw new Error("형식 오류");
      const b = blank();
      S = { ...b, ...d, settings: { ...b.settings, ...d.settings } };
      save();
      parentView();
      $("#ioMsg").textContent = "기록을 복원했어요.";
    } catch (err) { $("#ioMsg").textContent = "복원하지 못했어요. 이 게임에서 저장한 백업 파일인지 확인해 주세요."; }
  };
  $("#reset").onclick = () => {
    if (confirm("모든 학습 기록을 지울까요? 되돌릴 수 없어요.") && confirm("정말 지울까요? 백업이 없다면 복구할 수 없어요.")) { syncDisconnect(); S = blank(); save(); home(); }
  };
}

/* ---------- 타자 연습 칸 ----------
   글자와 숫자만 칸으로 만들고, 띄어쓰기와 문장 부호는 고정해 둔다.
   틀린 글자는 채우지 않으며, 다 채우면 onDone을 부르고 첫 칸으로 돌아간다. */
const isTypable = c => /[a-z0-9]/i.test(c);
const typingText = w => w.w.replace(/\(=.*?\)/, "").replace(/\[.*?\]/, "");
function makeTyper(el, text, onDone) {
  const chars = [...text];
  let n = 0;
  el.innerHTML = `<div class="tcells" aria-hidden="true">${text.split(" ").map(part =>
    `<span class="tword">${[...part].map(c => isTypable(c) ? `<span class="tcell" data-i="${n++}"></span>` : `<span class="tfixed">${esc(c)}</span>`).join("")}</span>`).join("")}</div>
    <p class="tcount small mute"></p>`;
  const cells = [...el.querySelectorAll(".tcell")];
  const letters = chars.filter(isTypable);
  let pos = 0, reps = 0, timer = 0, finishing = false;
  const mark = () => cells.forEach((c, i) => c.classList.toggle("cur", i === pos && el.classList.contains("active")));
  const clear = () => {
    clearTimeout(timer);
    finishing = false;
    pos = 0;
    el.classList.remove("done");
    cells.forEach(c => { c.textContent = ""; c.classList.remove("ok"); });
    mark();
  };
  const api = {
    key(ch) {
      if (finishing) clear();
      const cell = cells[pos];
      if (ch !== letters[pos].toLowerCase()) {
        cell.textContent = ch;
        cell.classList.remove("bad");
        void cell.offsetWidth;
        cell.classList.add("bad");
        return;
      }
      cell.classList.remove("bad");
      cell.textContent = letters[pos];
      cell.classList.add("ok");
      pos++;
      if (pos < cells.length) return mark();
      reps++;
      finishing = true;
      el.classList.add("done");
      el.querySelector(".tcount").textContent = `${reps}번 완성!`;
      mark();
      onDone();
      timer = setTimeout(clear, 600);
    },
    back() {
      if (finishing) return clear();
      if (cells[pos] && cells[pos].classList.contains("bad")) { cells[pos].classList.remove("bad"); cells[pos].textContent = ""; return; }
      if (pos === 0) return;
      pos--;
      cells[pos].textContent = "";
      cells[pos].classList.remove("ok");
      mark();
    },
    setActive(on) { el.classList.toggle("active", on); mark(); },
    stop() { clearTimeout(timer); },
  };
  return api;
}
// 한글 입력 상태에서도 실제로 누른 영어 글자를 읽는다
function typedChar(e) {
  if (/^Key[A-Z]$/.test(e.code)) return e.code[3].toLowerCase();
  if (/^Digit\d$/.test(e.code) && !e.shiftKey) return e.code[5];
  return e.key && e.key.length === 1 && isTypable(e.key) && !e.code ? e.key.toLowerCase() : "";
}

/* ---------- 플래시카드: DAY별 50장 ---------- */
const credits = () => (typeof IMG_CREDITS === "undefined" ? {} : IMG_CREDITS);
function backToHome() { if (location.hash) location.hash = ""; else home(); }
function flashView(day, restart) {
  const list = WORDS.filter(w => w.day === day);
  const saved = S.flash[day] || { known: [], rounds: 1, missed: {}, ms: 0 };
  if (restart || saved.known.length >= list.length) { saved.known = []; saved.rounds = 1; saved.missed = {}; saved.ms = 0; saved.t = Date.now(); }
  S.flash[day] = saved;
  save();
  let queue = list.filter(w => !saved.known.includes(w.id));
  let i = 0, shown = false, t0 = Date.now();

  function tick() { saved.ms += Date.now() - t0; t0 = Date.now(); saved.t = t0; }
  function preload() { const n = queue[i + 1]; if (n) new Image().src = "images/" + n.id + ".jpg"; }
  function draw() {
    const w = queue[i], c = credits()[w.id];
    shown = false;
    render(`<div class="play-top">
        <button class="btn ghost" id="back" aria-label="나가기">${icon("close")}</button>
        <div class="progress" role="progressbar" aria-valuenow="${saved.known.length}" aria-valuemin="0" aria-valuemax="50"><i style="width:${saved.known.length / list.length * 100}%"></i></div>
        <span class="chip">알아요 ${saved.known.length}/${list.length}</span>
      </div>
      <p class="mute small flash-sub">DAY ${day} · ${saved.rounds}바퀴째 · 이번 바퀴 ${i + 1}/${queue.length}장 · <span id="flashStatus">${statusBadge(w)}</span></p>
      <article class="panel flash">
        <figure class="flash-img">
          <img src="images/${w.id}.jpg" alt="${esc(w.w)}를 나타내는 그림" onerror="this.parentNode.classList.add('none')">
          <span class="noimg" aria-hidden="true">${icon("image")}</span>
        </figure>
        <button class="flash-word en" id="say" aria-label="${esc(w.w)} 미국식 발음 듣기">${esc(w.w)} ${icon("speaker")}</button>
        <div class="type-zone en" id="tzWord" role="group" aria-label="단어 타자 연습 칸"></div>
        <input class="type-in" id="typeIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="타자 입력">
        <button class="flash-mean" id="reveal" aria-expanded="false">뜻 보기 <span class="mute small">(Space)</span></button>
        <div class="flash-rate">
          <button class="btn bad big" id="no">몰랐어요 (←)</button>
          <button class="btn good big" id="yes">알아요 (→)</button>
        </div>
        ${c ? `<p class="credit">사진: ${/^https?:\/\//i.test(c.page || "") ? `<a href="${esc(c.page)}" target="_blank" rel="noopener noreferrer">${esc(c.artist || c.title)}</a>` : esc(c.artist || c.title)} · ${esc(c.license)}</p>` : ""}
      </article>`);
    $("#back").onclick = () => { tick(); save(); backToHome(); };
    const say = () => speak(spoken(w));
    const sentence = w.s.replace(/[{}]/g, "");
    const saySentence = () => speak(sentence);
    const input = $("#typeIn");
    const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    // 단어를 다 치면 직접 입력 단계를 통과한 것으로 기록한다
    const wordTyper = makeTyper($("#tzWord"), typingText(w), () => {
      say();
      markSkill(intro(w.id), "type");
      save();
      $("#flashStatus").innerHTML = statusBadge(w);
    });
    let sentTyper = null, active = wordTyper;
    const activate = (t, showKeyboard) => {
      active = t;
      wordTyper.setActive(t === wordTyper);
      if (sentTyper) sentTyper.setActive(t === sentTyper);
      if (showKeyboard && touch) input.focus({ preventScroll: true });
    };
    activate(wordTyper);
    addCleanup(() => { wordTyper.stop(); if (sentTyper) sentTyper.stop(); });
    $("#tzWord").onclick = () => activate(wordTyper, true);
    const reveal = () => {
      if (shown) return;
      shown = true;
      const box = document.createElement("div");
      box.className = "flash-mean open";
      box.id = "meaning";
      box.innerHTML = `<strong>${esc(w.m)}</strong>
        <button class="sent-say en small" id="saySent" aria-label="예문 듣기">${esc(w.s).replace(/\{(.+?)\}/, "<mark>$1</mark>")} ${icon("speaker")}</button>
        <span class="mute small">${esc(w.k)}</span>
        <div class="type-zone en" id="tzSent" role="group" aria-label="예문 타자 연습 칸"></div>`;
      $("#reveal").replaceWith(box);
      $("#saySent").onclick = saySentence;
      sentTyper = makeTyper($("#tzSent"), sentence, saySentence);
      $("#tzSent").onclick = () => activate(sentTyper, true);
      activate(sentTyper);
      saySentence();
      $(".flash-rate").scrollIntoView({ block: "nearest" });
    };
    const rate = knew => {
      intro(w.id);
      record(w.id, knew, knew ? "meaning" : null);
      if (knew) saved.known.push(w.id);
      else saved.missed[w.id] = (saved.missed[w.id] || 0) + 1;
      tick();
      beep(knew);
      save();
      i++;
      if (i < queue.length) return draw();
      queue = shuffle(list.filter(x => !saved.known.includes(x.id)));
      if (!queue.length) return finish();
      saved.rounds++; save(); i = 0;
      roundBreak();
    };
    $("#say").onclick = say;
    $("#reveal").onclick = reveal;
    $("#yes").onclick = () => rate(true);
    $("#no").onclick = () => rate(false);
    preload();
    addCleanup(onKey(e => {
      const ch = typedChar(e);
      if (ch) { e.preventDefault(); active.key(ch); }
      else if (e.key === "Backspace") { e.preventDefault(); active.back(); }
      else if (e.key === " ") { e.preventDefault(); reveal(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active === wordTyper ? say() : saySentence(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (sentTyper) activate(active === wordTyper ? sentTyper : wordTyper); }
      else if (e.key === "ArrowRight") rate(true);
      else if (e.key === "ArrowLeft") rate(false);
    }));
    // 화면 키보드는 키 코드를 주지 않으므로 입력값으로 읽는다
    input.addEventListener("input", () => {
      for (const c of input.value) if (isTypable(c)) active.key(c.toLowerCase());
      input.value = "";
    });
  }
  function roundBreak() {
    render(`<div class="panel result stack">
        <div class="big-star">${icon("repeat")}</div>
        <h2>${saved.known.length}장을 끝냈어요</h2>
        <p class="mute">몰랐던 ${queue.length}장만 다시 볼게요.</p>
        <button class="btn primary big" id="go">계속 (Enter)</button>
      </div>`);
    $("#go").onclick = () => { t0 = Date.now(); draw(); };
    $("#go").focus();
  }
  function finish() {
    const secs = Math.round(saved.ms / 1000);
    const hard = list.filter(w => saved.missed[w.id]).sort((a, b) => saved.missed[b.id] - saved.missed[a.id]);
    render(`<div class="panel result stack">
        <div class="big-star">${icon("trophy")}</div>
        <h1>DAY ${day} 50장 완료!</h1>
        <p>${saved.rounds}바퀴 · ${Math.floor(secs / 60)}분 ${secs % 60}초</p>
        ${hard.length ? `<div style="text-align:left"><h3>다시 본 단어 ${hard.length}개</h3>${hard.map(wordRow).join("")}</div>` : "<p>한 번에 모두 알았어요!</p>"}
        <div class="row" style="justify-content:center">
          <button class="btn" id="again">처음부터 다시</button>
          <button class="btn primary" id="test">뜻 맞히기로 확인</button>
        </div>
        <button class="btn ghost" id="out">${isExam() ? "홈으로" : "행성 지도로"}</button>
      </div>`);
    wireRows();
    $("#again").onclick = () => flashView(day, true);
    $("#test").onclick = () => runRound(shuffle(list).map(w => ({ type: "meaning", id: w.id })), { onQuit: backToHome, onDone: r => showResult(r, `DAY ${day} 확인 끝!`) });
    $("#out").onclick = backToHome;
    $("#test").focus();
  }
  if (!queue.length) return finish();
  draw();
}

/* ---------- 주소로 바로 열기: #day1 ~ #day10, #flash1 ~ #flash10 ---------- */
function route() {
  const m = location.hash.match(/^#(day|flash)(\d+)$/);
  const d = m ? Number(m[2]) : 0;
  if (isOpen(d)) (m[1] === "day" ? planetView : flashView)(d);
  else home();
}
window.addEventListener("hashchange", route);
route();
syncStart();
