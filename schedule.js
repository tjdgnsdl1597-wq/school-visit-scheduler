// schedule.js — 일정 입력 + 페이지 달력
document.addEventListener('DOMContentLoaded', async () => {
  const startSel = document.getElementById('startTime');
  const endSel = document.getElementById('endTime');
  fillTimeOptions(startSel, endSel);

  const schoolSel = document.getElementById('schoolSelect');
  SCHOOLS.forEach(n => {
    const o = document.createElement('option'); o.value=o.textContent=n; schoolSel.appendChild(o);
  });

  const eduChk = document.getElementById('eduChk');
  const etcChk = document.getElementById('etcChk');
  const eduType = document.getElementById('eduType');
  const etcText = document.getElementById('etcText');
  function toggle(){ eduType.style.display = eduChk.checked?'block':'none'; etcText.style.display = etcChk.checked?'block':'none'; }
  [eduChk,etcChk].forEach(x=>x.addEventListener('change',toggle)); toggle();

  // 달력
  const cal = new FullCalendar.Calendar(document.getElementById('scheduleCalendar'), {
    locale:'ko', initialView:'dayGridMonth', height:650,
    headerToolbar:{left:'prev,next today',center:'title',right:'dayGridMonth,dayGridWeek,listMonth'},
    events: async (info, success, failure) => {
      const rows = await fetchMyVisits(info.startStr.slice(0,10), info.endStr.slice(0,10));
      success(rows.map(r => ({
        id:r.id, start:r.visit_date, allDay:true, title:`${r.school} (${r.start_time}~${r.end_time})`
      })));
    },
    eventClick: async ({ event }) => {
      if (!confirm('이 일정을 삭제할까요?')) return;
      const { error } = await sb.from('visits').delete().eq('id', event.id);
      if (error) alert('삭제 실패: ' + error.message);
      else cal.refetchEvents();
    }
  });
  cal.render();

  // 저장
  document.getElementById('visitForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const date = document.getElementById('visitDate').value;
    const half = document.getElementById('half').value;
    const start_time = startSel.value;
    const end_time = endSel.value;
    const school = schoolSel.value;
    const purposes = Array.from(document.querySelectorAll('#purposeList input:checked')).map(x=>x.value).join(',');
    const edu_type = eduChk.checked ? (eduType.value.trim() || null) : null;
    const etc = etcChk.checked ? (etcText.value.trim() || null) : null;

    const { data: session } = await sb.auth.getSession();
    const uid = session.session.user.id;

    // 같은 날 오전/오후 최대 2건 제한(클라이언트 확인)
    const existing = await fetchMyVisits(date, date);
    const sameHalf = existing.filter(v => (v.start_time < '12:00' ? '오전':'오후') === half);
    if (sameHalf.length >= 2){ alert(`${half} 일정은 최대 2건까지 가능합니다.`); return; }

    const { error } = await sb.from('visits').insert({
      user_id: uid, visit_date: date, start_time, end_time, half_day: half,
      purposes, edu_type, etc, school
    });
    if (error){ alert('저장 실패: ' + error.message); return; }
    alert('저장 완료!');
    e.target.reset();
    cal.refetchEvents();
  });

  // 실시간 반영
  sb.channel('realtime:visits')
    .on('postgres_changes', { event:'*', schema:'public', table:'visits' }, () => cal.refetchEvents())
    .subscribe();
});
