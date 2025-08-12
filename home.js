// home.js - 메인 페이지 대시보드 스크립트

document.addEventListener('DOMContentLoaded', () => {
    // App.handleAuth가 완료되어 App.user가 설정될 때까지 기다립니다.
    // DOMContentLoaded는 App.handleAuth를 호출하지만, 비동기이므로 완료를 보장하지 않습니다.
    // 간단한 지연으로 대부분의 경우를 해결하거나, 더 복잡한 앱에서는 커스텀 이벤트를 사용할 수 있습니다.
    setTimeout(initializeDashboard, 100); 
});

function initializeDashboard() {
    // App 객체가 로드되었는지, 사용자가 인증되었는지 확인
    if (!window.App || !App.user) {
        console.log("사용자 인증 대기 중... 또는 App 객체 초기화 전");
        // 로그인 페이지로 리디렉션은 app.js의 handleAuth가 처리합니다.
        return;
    }

    const calendarEl = document.getElementById('calendar');
    const todoListEl = document.querySelector('.todo-list');

    if (!calendarEl || !todoListEl) {
        console.error("필수 UI 요소를 찾을 수 없습니다: #calendar 또는 .todo-list");
        return;
    }

    // 1. FullCalendar 초기화
    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ko',
        initialView: 'dayGridMonth',
        height: 'auto', // 부모 컨테이너 높이에 맞춤
        headerToolbar: {
            left: '',
            center: 'title',
            right: 'prev,next'
        },
        titleFormat: { year: 'numeric' },
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                // App.fetchMyVisits 함수를 사용하여 일정 데이터를 가져옵니다.
                const visits = await App.fetchMyVisits(
                    fetchInfo.start.toISOString().slice(0, 10),
                    fetchInfo.end.toISOString().slice(0, 10)
                );
                
                const events = visits.map(visit => ({
                    id: visit.id,
                    title: `${visit.school} (${visit.start_time}~${visit.end_time})`,
                    start: visit.visit_date,
                    allDay: true,
                    // 필요에 따라 이벤트 색상 등을 추가할 수 있습니다.
                    // color: '#004aad' 
                }));
                successCallback(events);
            } catch (error) {
                console.error("캘린더 이벤트 로딩 실패:", error);
                failureCallback(error);
            }
        }
    });
    calendar.render();

    // 2. 미확인 업무(지난 일정) 목록 렌더링
    async function renderOverdueTasks() {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const allVisits = await App.fetchMyVisits();
            
            const overdueTasks = allVisits
                .filter(visit => visit.visit_date < today && !visit.completed) // 'completed' 같은 플래그가 있다면 활용
                .slice(-6); // 최근 6개만 표시

            todoListEl.innerHTML = ""; // 목록 초기화

            if (overdueTasks.length === 0) {
                const li = document.createElement('div');
                li.textContent = "미확인 업무가 없습니다.";
                li.className = 'empty-message';
                todoListEl.appendChild(li);
            } else {
                overdueTasks.forEach(task => {
                    const li = document.createElement('div');
                    li.className = 'todo-item';
                    li.textContent = `${task.visit_date} - ${task.school} (${task.purposes || "목적 없음"})`;
                    todoListEl.appendChild(li);
                });
            }
        } catch (error) {
            console.error("미확인 업무 로딩 실패:", error);
            todoListEl.innerHTML = "<div class='error-message'>업무를 불러오지 못했습니다.</div>";
        }
    }
    renderOverdueTasks();

    // 3. Supabase 실시간 연동
    // 'visits' 테이블에 변경이 생기면 캘린더와 업무 목록을 모두 새로고침합니다.
    App.supabase.channel('public:visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (payload) => {
          console.log('visits 테이블 변경 감지:', payload);
          calendar.refetchEvents();
          renderOverdueTasks();
      })
      .subscribe();
}
