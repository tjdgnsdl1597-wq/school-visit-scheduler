const { createClient } = supabase;
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const schools = ["숭덕여자중학교","숭덕여자고등학교","인천예림학교","간석여자중학교"];

// 시간 선택
const startTimeSelect = document.getElementById("startTime");
const endTimeSelect = document.getElementById("endTime");
for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const option1 = document.createElement("option");
        const option2 = document.createElement("option");
        option1.value = timeStr;
        option1.textContent = timeStr;
        option2.value = timeStr;
        option2.textContent = timeStr;
        startTimeSelect.appendChild(option1);
        endTimeSelect.appendChild(option2);
    }
}

// 학교 목록
const schoolSelect = document.getElementById("schoolSelect");
schools.forEach(school => {
    const option = document.createElement("option");
    option.value = school;
    option.textContent = school;
    schoolSelect.appendChild(option);
});

// 기타 입력창
document.querySelectorAll("#purposeList input").forEach(cb => {
    cb.addEventListener("change", () => {
        document.getElementById("etcPurpose").style.display =
            cb.value === "기타" && cb.checked ? "block" : "none";
    });
});

// 데이터 저장
document.getElementById("visitForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const purposes = Array.from(document.querySelectorAll("#purposeList input:checked")).map(cb => cb.value);
    const { error } = await supabaseClient.from("visits").insert([{
        user_id: "test-user",
        visit_date: document.getElementById("visitDate").value,
        start_time: document.getElementById("startTime").value,
        end_time: document.getElementById("endTime").value,
        purposes: purposes.join(","),
        etc: document.getElementById("etcPurpose").value,
        edu_type: document.getElementById("eduType").value,
        school: document.getElementById("schoolSelect").value
    }]);
    if (error) {
        alert("저장 실패: " + error.message);
    } else {
        alert("저장 완료");
        loadVisits();
    }
});

// 데이터 불러오기
async function loadVisits() {
    const { data, error } = await supabaseClient.from("visits").select("*").order("visit_date");
    const visitList = document.getElementById("visitList");
    visitList.innerHTML = "";
    if (!error && data) {
        data.forEach(row => {
            const li = document.createElement("li");
            li.textContent = `${row.visit_date} ${row.start_time} - ${row.end_time} (${row.school})`;
            visitList.appendChild(li);
        });
    }
    renderCalendar(data || []);
}

// 캘린더 렌더링
function renderCalendar(events) {
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "ko",
        events: events.map(e => ({
            title: `${e.school} (${e.start_time}~${e.end_time})`,
            start: e.visit_date
        }))
    });
    calendar.render();
}

loadVisits();
