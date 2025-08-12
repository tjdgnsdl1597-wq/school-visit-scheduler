// home.js — 메인 달력 + 실시간 반영
document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('homeCalendar');
  const cal = new FullCalendar.Calendar(el, {
    locale: 'ko',
    initialView: 'dayGridMonth',
    height: 650,
    headerToolbar: { left:'prev,next today', center:'title', right:'dayGridMonth,dayGridWeek,listMonth' },
    events: async (info, success, failure) => {
      const rows = await fetchMyVisits(info.startStr.slice(0,10), info.endStr.slice(0,10));
      success(rows.map(r => ({
        id: r.id, title: `${r.school} (${r.start_time}~${r.end_time})`, start: r.visit_date, allDay: true
      })));
    }
  });
  cal.render();

  // 미완료업무 (오늘 이전)
  const today = new Date().toISOString().slice(0,10);
  (async () => {
    const rows = await fetchMyVisits();
    const list = rows.filter(r => r.visit_date < today).slice(-6);
    const ul = document.getElementById('todoList'); ul.innerHTML = "";
    list.forEach(r => {
      const li = document.createElement('li'); li.textContent = `${r.visit_date} ${r.school} (${r.purposes||""})`;
      ul.appendChild(li);
    });
  })();

  // 실시간 반영
  sb.channel('realtime:visits')
    .on('postgres_changes', { event:'*', schema:'public', table:'visits' }, () => cal.refetchEvents())
    .subscribe();
});
