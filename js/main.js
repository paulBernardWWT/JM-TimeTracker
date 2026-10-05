// App shell: tab switching, top-level render and startup.
let view = 'timer';

function setView(v) {
  view = v;
  $('timerView').hidden = v !== 'timer'; $('weekView').hidden = v !== 'week';
  $('tabTimer').classList.toggle('on', v === 'timer'); $('tabWeek').classList.toggle('on', v === 'week');
  render();
}
$('tabTimer').onclick = () => setView('timer');
$('tabWeek').onclick = () => setView('week');

function render() { view === 'timer' ? renderTimer() : renderWeek(); }

state.tasks.forEach(t => {
  if (t.todayFrom) { const d = new Date(t.todayFrom); d.setHours(0, 0, 0, 0); removeRange(t.id, d.getTime(), t.todayFrom); delete t.todayFrom; save(); }
});
render();
setInterval(tick, 500);
setInterval(() => { if (view === 'week' && running()) renderWeek(); }, 15000);
