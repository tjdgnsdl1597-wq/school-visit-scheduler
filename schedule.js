// schedule.js - 일정 관리 페이지 스크립트 (인증 기능 제거)

// [수정] DOM이 로드되면 먼저 App 객체가 있는지 확인합니다.
document.addEventListener('DOMContentLoaded', () => {
    if (window.App) {
        // App이 이미 준비되었다면 바로 실행
        initializeSchedulePage();
    } else {
        // App이 아직 없다면, 페이지의 모든 리소스(이미지, 스크립트 등)가
        // 완전히 로드된 후에 실행하도록 예약합니다. 이것이 가장 안정적인 방법입니다.
        window.addEventListener('load', initializeSchedulePage);
    }
});

function initializeSchedulePage() {
    // App 객체가 준비되었는지 다시 한번 확인하여 안정성을 높입니다.
    if (!window.App) {
        console.error("App 객체를 찾을 수 없습니다. app.js가 제대로 로드되었는지 확인하세요.");
        alert("페이지를 초기화하는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
    }

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

    // 학교 목록과 시간 옵션을 채우는 기능
    App.SCHOOLS.forEach(school => {
        schoolSelect.add(new Option(school, school));
    });

    const applyTimeFilter = () => {
        const filter = periodSelect.value;
        const currentStart = startTimeSelect.value;
        const currentEnd = endTimeSelect.value;
        App.fillTimeOptions(startTimeSelect, endTimeSelect);
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
    applyTimeFilter();

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
    edu_text: eduTypeInput.value.trim() || null,     // DB 컬럼명에 맞춤
    other_text: etcPurposeInput.value.trim() || null // DB 컬럼명에 맞춤
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
