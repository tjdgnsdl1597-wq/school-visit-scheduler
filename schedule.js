// schedule.js - 일정 관리 페이지 스크립트 (인증 기능 제거)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.App) {
        console.error('App가 아직 준비되지 않았습니다.');
        // App이 늦게 붙는 케이스 대비
        window.addEventListener('load', () => {
            if (window.App) initializeSchedulePage();
        });
        return;
    }
    initializeSchedulePage();
});

function initializeSchedulePage() {
    console.log('App.SCHOOLS length =', App.SCHOOLS?.length); // 디버그용

    // DOM 요소 가져오기
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

    // 학교 목록 채우기
    App.SCHOOLS.forEach(school => {
        schoolSelect.add(new Option(school, school));
    });

    // 시간 필터링 기능
    const applyTimeFilter = () => {
        const filter = periodSelect.value;
        const currentStart = startTimeSelect.value;
        const currentEnd = endTimeSelect.value;

        App.fillTimeOptions(startTimeSelect, endTimeSelect); // app.js의 기능 사용

        if (filter) {
            const filterFn = (timeStr) => {
                const hour = parseInt(timeStr.split(':')[0], 10);
                return filter === 'AM' ? hour < 12 : hour >= 12;
            };
            Array.from(startTimeSelect.options).forEach(opt => {
                if (opt.value && !filterFn(opt.value)) opt.remove();
            });
            Array.from(endTimeSelect.options).forEach(opt => {
                if (opt.value && !filterFn(opt.value)) opt.remove();
            });
        }
        startTimeSelect.value = currentStart;
        endTimeSelect.value = currentEnd;
    };

    // 시작 시간 선택 시 종료 시간 자동 설정
    periodSelect.addEventListener('change', applyTimeFilter);
    startTimeSelect.addEventListener('change', () => {
        const v = startTimeSelect.value;
        if (!v) return;
        let [h, m] = v.split(':').map(Number);
        m += 30;
        if (m >= 60) { m = 0; h += 1; }
        const targetTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        if (Array.from(endTimeSelect.options).some(o => o.value === targetTime)) {
            endTimeSelect.value = targetTime;
        } else {
            endTimeSelect.value = v;
        }
    });
    applyTimeFilter(); // 페이지 로드 시 초기 실행

    // 방문 목적 선택 시 추가 입력칸 표시
    purposeContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const eduCheckbox = document.querySelector('input[value="교육"]');
            const etcCheckbox = document.querySelector('input[value="기타"]');
            if(eduTypeInput) eduTypeInput.parentElement.style.display = eduCheckbox.checked ? 'block' : 'none';
            if(etcPurposeInput) etcPurposeInput.parentElement.style.display = etcCheckbox.checked ? 'block' : 'none';
        }
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
        if(eduTypeInput) eduTypeInput.parentElement.style.display = 'none';
        if(etcPurposeInput) etcPurposeInput.parentElement.style.display = 'none';
        calendar.refetchEvents();
    });
    
    App.supabase.channel('public:visits:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          calendar.refetchEvents();
      })
      .subscribe();
}
