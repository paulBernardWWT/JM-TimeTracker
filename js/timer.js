// Timer tab: add-a-task form, Today / Totals lists, edit dialog and the live tick.
let timerMode = 'today', renderedDay = null;

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  let t = state.tasks.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (!t) { t = { id: uid(), name, base: 0 }; state.tasks.unshift(t); }
  $('name').value = '';
  start(t.id);
});

$('list').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.id;
  if (b.dataset.act === 'start') start(id);
  if (b.dataset.act === 'stop') stop();
  if (b.dataset.act === 'edit') openEdit(id);
  if (b.dataset.act === 'continue') start(id);
  if (b.dataset.act === 'del') {   // deletes today's time only; earlier days are untouched
    const t = state.tasks.find(t => t.id === id);
    if (!confirm(`Remove today's time for "${t.name}"? It will also be removed from Totals and today's column on the Week tab.`)) return;
    removeRange(id, dayStart(), nextDay(dayStart())); save(); render();
  }
});

$('modeToday').onclick = () => { timerMode = 'today'; render(); };
$('modeTotals').onclick = () => { timerMode = 'totals'; render(); };
let period = '30d';
try { period = localStorage.getItem('task-timer-period') || '30d'; } catch (e) {}
$('period').value = period = ['week', 'month', '30d', 'year', 'all'].includes(period) ? period : '30d';
$('period').onchange = e => { period = e.target.value; try { localStorage.setItem('task-timer-period', period); } catch (e) {} renderTimer(); };

/* ---------- timer view ---------- */
function renderTimer() {
  const r = running(), ds = dayStart(), today = timerMode === 'today';
  renderedDay = ds;
  $('modeToday').classList.toggle('on', today); $('modeTotals').classList.toggle('on', !today);
  $('periodWrap').hidden = today;
  // Today: tasks with time today. Totals: every task with time in the chosen period, most recently tracked first.
  const shown = today ? state.tasks.filter(t => worksToday(t, ds))
                      : state.tasks.filter(t => periodMs(t) > 0).sort((a, b) => lastTracked(b) - lastTracked(a));
  $('list').innerHTML = shown.length ? shown.map(t => {
    const live = r && r.taskId === t.id;
    return `<div class="task ${live ? 'live' : ''}">
      <span class="dot" style="background:${colorOf(t.id)}"></span>
      <div class="info"><div class="name" title="${esc(t.name)}">${esc(t.name)}</div><div class="time" data-id="${t.id}">${fmt(shownMs(t))}</div></div>
      <div class="actions">
        ${today ? `<button class="ghost" data-act="edit" data-id="${t.id}" title="Edit name and color">Edit</button>
        <button class="ghost" data-act="del" data-id="${t.id}" title="Delete today's time for this task">✕</button>` : ''}
        ${live ? `<button class="stop" data-act="stop">Stop</button>` : `<button data-act="${today ? 'start' : 'continue'}" data-id="${t.id}">${today ? 'Start' : 'Continue'}</button>`}
      </div></div>`;
  }).join('') : `<div class="empty">${today ? 'Nothing tracked today yet. Type a task name above and press Start.' : 'No time tracked in this period.'}</div>`;
  tick();
}

/* ---------- edit dialog ---------- */
let editId = null;
function openEdit(id) {
  const t = state.tasks.find(t => t.id === id), mins = Math.floor(todayTime(t) / 6e4);   // seconds are dropped
  editId = id;
  $('editName').value = t.name; $('editColor').value = colorOf(id);
  $('editH').value = Math.floor(mins / 60); $('editM').value = mins % 60; $('editM').setCustomValidity('');
  $('editDlg').showModal(); $('editName').focus(); $('editName').select();
}
$('editCancel').onclick = () => $('editDlg').close();
$('editM').oninput = $('editH').oninput = () => $('editM').setCustomValidity('');
$('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const t = state.tasks.find(t => t.id === editId), name = $('editName').value.trim();
  const mins = (+$('editH').value) * 60 + (+$('editM').value), r = running(), live = r && r.taskId === t.id;
  if (!name) return;
  if (state.tasks.some(o => o.id !== t.id && o.name.toLowerCase() === name.toLowerCase())) { alert('Another task already has that name.'); return; }
  if (mins <= 0 && !live) { $('editM').setCustomValidity('Enter a time greater than zero.'); $('editM').reportValidity(); return; }
  t.name = name; t.color = $('editColor').value;
  // today's time becomes exactly hours:minutes:00; earlier days are untouched. A running timer keeps running from there.
  const ds = dayStart();
  removeRange(t.id, ds, nextDay(ds));
  if (mins > 0) state.sessions.push({ id: uid(), taskId: t.id, start: ds, end: ds + mins * 6e4, manual: true });
  if (live) state.sessions.push({ id: uid(), taskId: t.id, start: Date.now(), end: null });
  save(); $('editDlg').close(); render();
});

/* ---------- totals period + live tick ---------- */
// start of the selected totals period (null = all time, which also includes untimestamped carried-over time)
const periodStart = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  else if (period === 'month') d.setDate(1);
  else if (period === '30d') d.setDate(d.getDate() - 29);
  else if (period === 'year') { d.setMonth(0, 1); }
  else return null;
  return d.getTime();
};
// when the task was last worked on (a running timer counts as now; carried-over time with no dates sorts last)
const lastTracked = t => state.sessions.reduce((m, s) => s.taskId === t.id ? Math.max(m, s.end ?? Date.now()) : m, 0);
const periodMs = t => {
  const from = periodStart();
  if (from === null) return taskTime(t);
  return state.sessions.filter(s => s.taskId === t.id).reduce((a, s) => a + Math.max(0, (s.end ?? Date.now()) - Math.max(s.start, from)), 0);
};
// time shown on the timer view: today's time on the Today list, the period total on the Totals list
const shownMs = t => timerMode === 'today' ? todayTime(t) : periodMs(t);
function tick() {
  if (renderedDay !== null && renderedDay !== dayStart() && view === 'timer') { renderTimer(); return; }   // date rolled over
  const ds = dayStart();
  let sum = 0;
  state.tasks.forEach(t => {
    const v = shownMs(t); sum += v;
    const el = document.querySelector(`.time[data-id="${t.id}"]`);
    if (el) el.textContent = fmt(v);
  });
  $('total').textContent = timerMode === 'today' ? (state.tasks.some(t => worksToday(t, ds)) ? 'Total today: ' + fmt(sum) : '')
                                                  : (sum ? 'Total: ' + fmt(sum) : '');
  const r = running(), t = r && state.tasks.find(t => t.id === r.taskId);
  document.title = t ? `${fmt(todayTime(t))} · ${t.name}` : 'Task Timer';
}
