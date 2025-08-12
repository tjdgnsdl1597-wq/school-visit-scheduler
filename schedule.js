// schedule.js - 일정 관리 페이지 스크립트 (인증 기능 제거)

document.addEventListener('DOMContentLoaded', () => {
    initializeSchedulePage();
});

function initializeSchedulePage() {
    const calendarEl = document.getElementById('schedule-calendar');
    const form = document.getElementById('schedule-form');
    const dateInput = document.getElementById('visit-date');
    const schoolSelect = document.getElementById('school-select');
    const periodSelect = document.getElementById('period');
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    const purposeContainer = document.getElementById('purpose-list');
    const eduTypeInput = document.getElementById('edu-type');
    const etcPurposeInput = document.getElementById('etc-purpose');
    const formMessageEl = document.getElementById('form-message');

    App.SCHOOLS.forEach(school => {
        schoolSelect.add(new Option(school, school));
    });

    const applyTimeFilter = () => {
        // ... (이전과 동일)
    };
    periodSelect.addEventListener('change', applyTimeFilter);
    startTimeSelect.addEventListener('change', () => {
        // ... (이전과 동일)
    });
    applyTimeFilter();

    purposeContainer.addEventListener('change', (e) => {
        // ... (이전과 동일)
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'ko',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        selectable: true,
        events: async (fetchInfo, successCallback) => {
            const visits = await App.fetchAllVisits(fetchInfo.startStr, fetchInfo.endStr);
            successCallback(visits.map(v => ({
                title: `${v.school}`,
                start: v.visit_date,
                allDay: true,
                extendedProps: v
            })));
        },
        select: (info) => {
            dateInput.value = info.startStr;
        },
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const checkedPurposes = Array.from(purposeContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        
        if (checkedPurposes.includes('교육') && !eduTypeInput.value.trim()) {
            return alert('교육 종류를 입력해주세요.');
        }
        if (checkedPurposes.includes('기타') && !etcPurposeInput.value.trim()) {
            return alert('기타 목적을 입력해주세요.');
        }

        const newVisit = {
            // user_id 필드 제거
            visit_date: dateInput.value,
            school: schoolSelect.value,
            start_time: startTimeSelect.value,
            end_time: endTimeSelect.value,
            purposes: checkedPurposes.join(', '),
            edu_type: eduTypeInput.value.trim() || null,
            etc: etcPurposeInput.value.trim() || null,
        };

        const { error } = await App.supabase.from('visits').insert([newVisit]);

        if (error) {
            formMessageEl.textContent = `저장 실패: ${error.message}`;
            formMessageEl.className = 'form-message error';
            formMessageEl.style.display = 'block';
            return;
        }

        formMessageEl.textContent = '일정이 성공적으로 저장되었습니다!';
        formMessageEl.className = 'form-message success';
        formMessageEl.style.display = 'block';
        
        form.reset();
        eduTypeInput.parentElement.style.display = 'none';
        etcPurposeInput.parentElement.style.display = 'none';
        calendar.refetchEvents();
    });
    
    App.supabase.channel('public:visits:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          calendar.refetchEvents();
      })
      .subscribe();
}
