// home.js - 메인 페이지 대시보드 스크립트 (인증 기능 제거)

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    const calendarEl = document.getElementById('calendar');
    const todoListEl = document.querySelector('.todo-list');
    const yearEl = document.querySelector('.calendar-header .year');
    const monthEl = document.querySelector('.calendar-header .month');
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');

    if (!calendarEl) {
        console.error("캘린더 요소를 찾을 수 없습니다.");
        return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ko',
        initialView: 'dayGridMonth',
        height: 'auto',
        datesSet: (dateInfo) => {
            const currentDate = dateInfo.view.currentStart;
            if(yearEl) yearEl.textContent = currentDate.getFullYear();
            if(monthEl) monthEl.textContent = `${currentDate.getMonth() + 1}월`;
        },
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                const visits = await App.fetchAllVisits(
                    fetchInfo.start.toISOString().slice(0, 10),
                    fetchInfo.end.toISOString().slice(0, 10)
                );
                const events = visits.map(visit => ({
                    id: visit.id,
                    title: `${visit.school}`,
                    start: visit.visit_date,
                    allDay: true
                }));
                successCallback(events);
            } catch (error) {
                failureCallback(error);
            }
        }
    });
    calendar.render();

    prevBtn.addEventListener('click', () => calendar.prev());
    nextBtn.addEventListener('click', () => calendar.next());

    async function renderOverdueTasks() {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const allVisits = await App.fetchAllVisits();
            const overdueTasks = allVisits.filter(visit => visit.visit_date < today).slice(-6);

            todoListEl.innerHTML = "";
            if (overdueTasks.length === 0) {
                todoListEl.innerHTML = `<div class="empty-message">미완료 업무가 없습니다.</div>`;
            } else {
                overdueTasks.forEach(task => {
                    const li = document.createElement('div');
                    li.className = 'todo-item';
                    li.textContent = `${task.visit_date} - ${task.school}`;
                    todoListEl.appendChild(li);
                });
            }
        } catch (error) {
            console.error("미완료 업무 로딩 실패:", error);
        }
    }
    renderOverdueTasks();

    App.supabase.channel('public:visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          calendar.refetchEvents();
          renderOverdueTasks();
      })
      .subscribe();
}
