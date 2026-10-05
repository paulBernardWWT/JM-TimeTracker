// Core data: storage, session/time helpers, formatting and the start/stop actions.
const KEY = 'task-timer-v2', OLD_KEY = 'task-timer-v1';

// state: tasks [{id,name,base}] (base = time carried over from v1, no timestamps)
//        sessions [{id,taskId,start,end|null}] (end null = running)
let state = { tasks: [], sessions: [] };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = JSON.parse(raw);
  else {
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || '[]');
    state.tasks = old.map(t => ({ id: t.id, name: t.name, base: t.total }));
    old.filter(t => t.startedAt).forEach(t => state.sessions.push({ id: uid(), taskId: t.id, start: t.startedAt, end: null }));
  }
} catch (e) {}

function uid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
const running = () => state.sessions.find(s => s.end == null);
const taskTime = t => t.base + state.sessions.filter(s => s.taskId === t.id).reduce((a, s) => a + (s.end ?? Date.now()) - s.start, 0);
const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const nextDay = ds => { const d = new Date(ds); d.setDate(d.getDate() + 1); return d.getTime(); };   // DST-safe
const worksToday = (t, ds = dayStart()) => state.sessions.some(s => s.taskId === t.id && s.start < nextDay(ds) && (s.end ?? Date.now()) > ds);
const todayTime = (t, ds = dayStart()) => state.sessions.filter(s => s.taskId === t.id).reduce((a, s) => a + Math.max(0, Math.min(s.end ?? Date.now(), nextDay(ds)) - Math.max(s.start, ds)), 0);
// Delete a task's tracked time inside [from, to); sessions that straddle the range are trimmed, not dropped.
function removeRange(taskId, from, to) {
  const now = Date.now(), out = [];
  state.sessions.forEach(s => {
    const e = s.end ?? now;
    if (s.taskId !== taskId || e <= from || s.start >= to) return out.push(s);
    if (s.start < from) out.push({ ...s, end: from });
    if (e > to) out.push({ ...s, id: uid(), start: to });
  });
  state.sessions = out;
}
const fmt = ms => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return [h, m, s % 60].map(n => String(n).padStart(2, '0')).join(':');
};
const fmtShort = ms => { const m = Math.round(ms / 6e4); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };
const hslHex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
const colorOf = id => { const t = state.tasks.find(t => t.id === id); if (t && t.color) return t.color; let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return hslHex(h % 360, 55, 42); };
const inkOf = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff'; };
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = id => document.getElementById(id);

function stopAll() { const r = running(); if (r) r.end = Date.now(); }
function start(id) {
  stopAll();                       // only one timer may run at a time
  timerMode = 'today';             // a started task belongs to today's list
  state.sessions.push({ id: uid(), taskId: id, start: Date.now(), end: null });
  save(); render();
}
function stop() { stopAll(); save(); render(); }
