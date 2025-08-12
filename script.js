// =======================
// Supabase 연결 (직접 값으로 교체)
// =======================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 학교 목록
const SCHOOLS = [
  "숭덕여자중학교","숭덕여자고등학교","인천예림학교","간석여자중학교","삼산유치원",
  "인천초은중학교","인천루원중학교","인천가석초등학교","상정중학교","제물포중학교",
  "가좌중학교","인천건지초등학교","가림고등학교","인천대정초등학교","재능대학교 송림캠퍼스부속유치원",
  "인천소방고등학교","인성여자중학교","인천신흥초등학교","인천송림초등학교","인천예일고등학교",
  "인천양촌중학교","임학중학교","인천안남초등학교","인천안남중학교","계산공업고등학교",
  "경인교육대학교부설초등학교","인천효성동초등학교","명현중학교","인천미송유치원",
  "칼빈매니토바국제학교","영흥초등학교(분기)","덕적초중고등학교(분기)"
];

// DOM
const schoolSelect = document.getElementById("schoolSelect");
const purposeList  = document.getElementById("purposeList");
const eduTypeInput = document.getElementById("eduType");
const etcInput     = document.getElementById("etcPurpose");
const periodSel    = document.getElementById("period");
const startSel     = document.getElementById("startTime");
const endSel       = document.getElementById("endTime");
const dateInput    = document.getElementById("visitDate");
const loginBtn     = document.getElementById("loginBtn");
const logoutBtn    = document.getElementById("logoutBtn");

function fmt(n){ return String(n).padStart(2,'0'); }

// 로그인 UI
refreshAuthUI();
loginBtn.addEventListener("click", async () => {
  const email = prompt("로그인 이메일 (매직 링크 발송)");
  if(!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  alert(error ? "메일 발송 실패: " + error.message : "메일함에서 로그인 링크 확인 후 접속하세요.");
});
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  refreshAuthUI();
  calendar?.refetchEvents();
});
async function refreshAuthUI(){
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;
  loginBtn.style.display  = loggedIn ? "none" : "inline-block";
  logoutBtn.style.display = loggedIn ? "inline-block" : "none";
}

// 학교 채움
(function fillSchools(){
  schoolSelect.innerHTML = '<option value="">선택</option>' + SCHOOLS.map(s=>`<option value="${s}">${s}</option>`).join('');
})();

// 시간 채움 (08:00~17:00 30분 간격, 오전/오후 필터)
function buildTimes(filterFn){
  const arr = ['<option value="">선택</option>'];
  for(let h=8; h<=17; h++){
    for(let m of [0,30]){
      const t = `${fmt(h)}:${fmt(m)}`;
      if(!filterFn || filterFn(t)) arr.push(`<option value="${t}">${t}</option>`);
    }
  }
  return arr.join('');
}
function applyTimes(){
  const f = (t)=>{
    if(periodSel.value==='') return true;
    const h = +t.slice(0,2);
    return periodSel.value==='AM' ? h<12 : h>=12;
  };
  startSel.innerHTML = buildTimes(f);
  endSel.innerHTML   = buildTimes(f);
}
applyTimes();
periodSel.addEventListener('change', applyTimes);

// 시작시간 선택 시 종료 기본값 +30분
startSel.addEventListener('change', ()=>{
  const v = startSel.value; if(!v) return;
  let [h,m] = v.split(':').map(Number);
  m += 30; if(m>=60){ m=0; h+=1; }
  const target = `${fmt(h)}:${fmt(m)}`;
  const has = Array.from(endSel.options).some(o=>o.value===target);
  endSel.value = has ? target : v;
});

// 보조 입력 강조
purposeList.querySelectorAll('input[type=checkbox]').forEach(cb=>{
  cb.addEventListener('change', ()=>{
    if(cb.value==='교육')  eduTypeInput.parentElement.style.opacity = cb.checked?1:.5;
    if(cb.value==='기타')  etcInput.parentElement.style.opacity      = cb.checked?1:.5;
  });
});

// 저장
document.getElementById("visitForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user){ alert("먼저 상단 로그인으로 인증해주세요."); return; }

  const purposes = Array.from(purposeList.querySelectorAll("input:checked")).map(x=>x.value);
  if(purposes.includes('교육') && !eduTypeInput.value.trim()){
    alert('교육을 선택하셨습니다. 교육 종류를 입력해주세요.'); return;
  }
  if(purposes.includes('기타') && !etcInput.value.trim()){
    alert('기타를 선택하셨습니다. 내용을 입력해주세요.'); return;
  }

  const payload = {
    user_id   : user.id,
    visit_date: dateInput.value,
    start_time: startSel.value,
    end_time  : endSel.value,
    purposes  : purposes.join(','),
    edu_type  : eduTypeInput.value.trim() || null,
    etc       : etcInput.value.trim() || null,
    school    : schoolSelect.value
  };

  const { error } = await supabase.from('visits').insert([payload]);
  if(error){ alert('저장 실패: ' + error.message); return; }

  alert('저장 완료!');
  e.target.reset();
  applyTimes();
  refreshAuthUI();
  calendar.refetchEvents();
});

// 캘린더
let calendar;
document.addEventListener('DOMContentLoaded', ()=>{
  const el = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    height: 'auto',
    locale: 'ko',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
    events: fetchEvents,
  });
  calendar.render();
});

async function fetchEvents(info, success, failure){
  try{
    const { data: { user } } = await supabase.auth.getUser();
    if(!user){ success([]); return; }
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', user.id)
      .gte('visit_date', info.startStr.slice(0,10))
      .lte('visit_date', info.endStr.slice(0,10));
    if(error) throw error;

    const events = (data||[]).map(r=>{
      const start = `${r.visit_date}T${r.start_time}:00`;
      const end   = `${r.visit_date}T${r.end_time}:00`;
      const title = `${r.school} · ${r.purposes || ''}`;
      return { id: r.id, title, start, end };
    });
    success(events);
  }catch(err){
    console.error(err);
    failure(err);
  }
}
