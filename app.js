// app.js — Supabase 초기화 + 라우트 가드 + 공통 유틸
const SUPABASE_URL = "https://harsxljqcnyfgsueiwvq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnN4bGpxY255ZmdzdWVpd3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQ2OTYsImV4cCI6MjA3MDUyMDY5Nn0.jyXqWN_IwNagbxXCikO2dJxvegWS0Wblo79rb87f2Rg";
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 로그인 가드: login.html 제외하고 세션 없으면 리다이렉트
(async () => {
  if (location.pathname.endsWith('login.html')) return;
  const { data } = await sb.auth.getSession();
  if (!data.session) location.href = 'login.html';
  else {
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = data.session.user.email;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = async () => { await sb.auth.signOut(); location.href='login.html'; };
  }
})();

// 학교 리스트 (32개)
window.SCHOOLS = [
  "숭덕여자중학교","숭덕여자고등학교","인천예림학교","간석여자중학교","삼산유치원",
  "인천초은중학교","인천루원중학교","인천가석초등학교","상정중학교","제물포중학교",
  "가좌중학교","인천건지초등학교","가림고등학교","인천대정초등학교","재능대학교 송림캠퍼스부속유치원",
  "인천소방고등학교","인성여자중학교","인천신흥초등학교","인천송림초등학교","인천예일고등학교",
  "인천양촌중학교","임학중학교","인천안남초등학교","인천안남중학교","계산공업고등학교",
  "경인교육대학교부설초등학교","인천효성동초등학교","명현중학교","인천미송유치원",
  "칼빈매니토바국제학교","영흥초등학교(분기)","덕적초중고등학교(분기)"
];

// 08:00~17:00 30분 단위 옵션
window.fillTimeOptions = (startSel, endSel) => {
  startSel.innerHTML = ""; endSel.innerHTML = "";
  for (let h=8; h<=17; h++){
    for (let m=0; m<60; m+=30){
      const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const s = document.createElement('option'); s.value = s.textContent = t;
      const e = document.createElement('option'); e.value = e.textContent = t;
      startSel.appendChild(s); endSel.appendChild(e);
    }
  }
};

// 로그인 사용자 일정 조회
window.fetchMyVisits = async (rangeStart=null, rangeEnd=null) => {
  const { data: session } = await sb.auth.getSession();
  if (!session.session) return [];
  let q = sb.from('visits').select('*').eq('user_id', session.session.user.id);
  if (rangeStart) q = q.gte('visit_date', rangeStart);
  if (rangeEnd) q = q.lte('visit_date', rangeEnd);
  const { data, error } = await q.order('visit_date', { ascending:true });
  if (error) { console.error(error); return []; }
  return data || [];
};
