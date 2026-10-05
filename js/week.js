// Week tab: weekly calendar, weekend toggle, copy-to-clipboard and the manual-add dialog.
let showWeekends = false;
try { showWeekends = localStorage.getItem('task-timer-weekends') === '1'; } catch (e) {}
$('weekends').checked = showWeekends;
$('weekends').onchange = e => { showWeekends = e.target.checked; try { localStorage.setItem('task-timer-weekends', showWeekends ? '1' : '0'); } catch (e) {} renderWeek(); };
let weekStart = mondayOf(new Date());
function mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
$('prev').onclick = () => { weekStart.setDate(weekStart.getDate() - 7); renderWeek(); };
$('next').onclick = () => { weekStart.setDate(weekStart.getDate() + 7); renderWeek(); };
$('today').onclick = () => { weekStart = mondayOf(new Date()); renderWeek(); };

/* ---------- week view ---------- */
let copyText = [];
let addDay = null;
$('cal').addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  addDay = +b.dataset.add;
  $('addDate').textContent = new Date(addDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('taskNames').innerHTML = state.tasks.map(t => `<option value="${esc(t.name)}">`).join('');
  $('addName').value = ''; $('addH').value = 0; $('addM').value = 0; $('addM').setCustomValidity('');
  $('addDlg').showModal(); $('addName').focus();
});
$('addCancel').onclick = () => $('addDlg').close();
$('addM').oninput = $('addH').oninput = () => $('addM').setCustomValidity('');
$('addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('addName').value.trim(), mins = (+$('addH').value) * 60 + (+$('addM').value);
  if (!name) return;
  if (mins <= 0) { $('addM').setCustomValidity('Enter a time greater than zero.'); $('addM').reportValidity(); return; }
  let t = state.tasks.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (!t) { t = { id: uid(), name, base: 0 }; state.tasks.unshift(t); }
  // logged as a session starting at midnight of the chosen day (max 23h59m, so it stays within that day)
  state.sessions.push({ id: uid(), taskId: t.id, start: addDay, end: addDay + mins * 6e4, manual: true });
  save(); $('addDlg').close(); renderTimer(); renderWeek();   // refresh both views so the Timer tab is current too
});
// hours rounded up to the nearest tenth, one decimal place, whole hours shown without a decimal
const hoursText = ms => { const tenths = Math.ceil(ms / 36e4); return tenths % 10 ? (tenths / 10).toFixed(1) : String(tenths / 10); };
async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove(); return ok;
}
$('cal').addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const ok = await copyToClipboard(copyText[+b.dataset.copy] || '');
  b.textContent = ok ? 'Copied!' : 'Copy failed';
  setTimeout(() => { if (b.isConnected) b.textContent = 'Copy'; }, 1500);
});

function renderWeek() {
  // always compute all 7 days so totals include the weekend; only the first 5 are shown unless weekends are on
  const allDays = [...Array(7)].map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const days = allDays.slice(0, showWeekends ? 7 : 5);
  const bounds = allDays.map(d => { const b = new Date(d); b.setDate(b.getDate() + 1); return [d.getTime(), b.getTime()]; });
  const now = Date.now(), byTask = {}, perDay = allDays.map(() => ({}));
  const names = Object.fromEntries(state.tasks.map(t => [t.id, t.name]));
  const r = running();

  // sum time per task per day (sessions crossing midnight are split)
  state.sessions.forEach(s => {
    const end = s.end ?? now;
    bounds.forEach(([a, b], i) => {
      const ms = Math.min(end, b) - Math.max(s.start, a);
      if (ms > 0) { perDay[i][s.taskId] = (perDay[i][s.taskId] || 0) + ms; byTask[s.taskId] = (byTask[s.taskId] || 0) + ms; }
    });
  });

  // clipboard text per day: "<task name> - <hours>", one task per line
  copyText = perDay.map(m => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([id, v]) => `${names[id] || '(deleted)'} - ${hoursText(v)}`).join('\n'));

  const f = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  $('weekLabel').textContent = `${f(days[0])} \u2013 ${f(days[days.length - 1])}, ${days[days.length - 1].getFullYear()}`;
  const todayStr = new Date().toDateString();

  $('cal').classList.toggle('five', !showWeekends);
  $('cal').innerHTML = days.map((d, i) => {
    const rows = Object.entries(perDay[i]).sort((a, b) => b[1] - a[1]);
    const tot = rows.reduce((a, [, v]) => a + v, 0);
    return `<div class="day ${d.toDateString() === todayStr ? 'today' : ''}">
      <div class="dayhead"><span>${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></span><span class="tot">${tot ? fmtShort(tot) : ''}</span>${rows.length ? `<button class="copy" data-copy="${i}" title="Copy tasks and hours to clipboard">Copy</button>` : ''}</div>` +
      '<div class="chips">' + (rows.length ? rows.map(([id, v]) => {
        const nm = names[id] || '(deleted)';
        return `<div class="chip ${r && r.taskId === id && d.toDateString() === todayStr ? 'run' : ''}" style="background:${colorOf(id)};color:${inkOf(colorOf(id))}" title="${esc(nm)}"><div class="cn">${esc(nm)}</div><div class="ct">${fmtShort(v)}</div></div>`;
      }).join('') : '<div class="none">\u2013</div>') + `</div><button class="add" data-add="${new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()}" title="Add time manually" aria-label="Add time manually for ${esc(d.toLocaleDateString(undefined, { weekday: 'long' }))}">+</button></div>`;
  }).join('');

  const rows = Object.entries(byTask).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, [, v]) => a + v, 0);
  $('legend').innerHTML = rows.length
    ? rows.map(([id, v]) => `<div class="row"><span class="dot" style="background:${colorOf(id)}"></span><span class="n">${esc(names[id] || '(deleted)')}</span><span class="t">${fmtShort(v)}</span></div>`).join('') +
      `<div class="row"><span class="n"><b>Week total</b></span><span class="t"><b>${fmtShort(total)}</b></span></div>`
    : '<div class="empty">No time tracked this week.</div>';
}
