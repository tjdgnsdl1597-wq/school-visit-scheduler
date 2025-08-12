// schedule.js - 일정 관리 페이지 스크립트

document.addEventListener('DOMContentLoaded', () => {
    // app.js의 비동기 인증 처리를 기다리기 위한 지연
    setTimeout(initializeSchedulePage, 100);
});

function initializeSchedulePage() {
    if (!window.App || !App.user) {
        console.log("사용자 인증 대기 중...");
        return;
    }

    // DOM 요소 가져오기
    const calendarEl = document.getElementById('schedule-calendar');
    const form = document.getElementById('schedule-form');
    const dateInput = document.getElementById('visit-date');
    const schoolSelect = document.getElementById('school-select');
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    const purposesInput = document.getElementById('purposes');
    const formMessageEl = document.getElementById('form-message');

    // 학교 목록과 시간 옵션 채우기 (app.js의 유틸리티 함수 사용)
    App.SCHOOLS.forEach(school => {
        const option = new Option(school, school);
        schoolSelect.add(option);
    });
    App.fillTimeOptions(startTimeSelect, endTimeSelect);

    // FullCalendar 초기화
    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ko',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        selectable: true, // 날짜 선택 활성화
        events: async (fetchInfo, successCallback, failureCallback) => {
            // 내 기존 일정을 캘린더에 표시
            const visits = await App.fetchMyVisits(
                fetchInfo.start.toISOString().slice(0, 10),
                fetchInfo.end.toISOString().slice(0, 10)
            );
            const events = visits.map(v => ({
                title: `${v.school}`,
                start: v.visit_date,
                allDay: true,
                extendedProps: v
            }));
            successCallback(events);
        },
        // 날짜를 클릭하면 폼의 날짜 입력란에 자동 완성
        select: (info) => {
            dateInput.value = info.startStr;
            formMessageEl.style.display = 'none'; // 메시지 숨기기
        },
        // 이벤트를 클릭하면 상세 정보 표시 (예시)
        eventClick: (info) => {
            const props = info.event.extendedProps;
            alert(
                `[일정 상세]\n\n` +
                `학교: ${props.school}\n` +
                `날짜: ${props.visit_date}\n` +
                `시간: ${props.start_time} ~ ${props.end_time}\n` +
                `목적: ${props.purposes || '없음'}`
            );
        }
    });
    calendar.render();

    // 폼 제출 이벤트 처리
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessageEl.style.display = 'none';

        // 입력 데이터 객체 생성
        const newVisit = {
            user_id: App.user.id,
            visit_date: dateInput.value,
            school: schoolSelect.value,
            start_time: startTimeSelect.value,
            end_time: endTimeSelect.value,
            purposes: purposesInput.value,
        };

        // 데이터베이스에 일정 추가
        const { data, error } = await App.supabase
            .from('visits')
            .insert([newVisit])
            .select();

        if (error) {
            formMessageEl.textContent = `저장 실패: ${error.message}`;
            formMessageEl.className = 'form-message error';
            formMessageEl.style.display = 'block';
            console.error("Insert error:", error);
            return;
        }

        // 성공 시
        formMessageEl.textContent = '일정이 성공적으로 저장되었습니다!';
        formMessageEl.className = 'form-message success';
        formMessageEl.style.display = 'block';
        
        form.reset(); // 폼 초기화
        calendar.refetchEvents(); // 캘린더 새로고침하여 새 일정 표시
    });
    
    // Supabase 실시간 연동
    App.supabase.channel('public:visits:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (payload) => {
          console.log('visits 테이블 변경 감지 (일정관리 페이지):', payload);
          calendar.refetchEvents();
      })
      .subscribe();
}
