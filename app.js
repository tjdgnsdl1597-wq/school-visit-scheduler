// app.js - 전역 애플리케이션 관리

// 1. 전역 네임스페이스 생성 및 Supabase 클라이언트 초기화
// - window.App 객체를 만들어 모든 공통 기능과 데이터를 담아 관리합니다.
// - 이렇게 하면 window 객체를 직접 오염시키지 않아 코드 충돌을 방지할 수 있습니다.
window.App = {
    supabase: supabase.createClient(
        "https://harsxljqcnyfgsueiwvq.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnN4bGpxY255ZmdzdWVpd3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQ2OTYsImV4cCI6MjA3MDUyMDY5Nn0.jyXqWN_IwNagbxXCikO2dJxvegWS0Wblo79rb87f2Rg"
    ),
    user: null, // 로그인한 사용자 정보를 저장할 변수
    
    // 2. 공통 데이터
    SCHOOLS: [
        "숭덕여자중학교", "숭덕여자고등학교", "인천예림학교", "간석여자중학교", "삼산유치원",
        "인천초은중학교", "인천루원중학교", "인천가석초등학교", "상정중학교", "제물포중학교",
        "가좌중학교", "인천건지초등학교", "가림고등학교", "인천대정초등학교", "재능대학교 송림캠퍼스부속유치원",
        "인천소방고등학교", "인성여자중학교", "인천신흥초등학교", "인천송림초등학교", "인천예일고등학교",
        "인천양촌중학교", "임학중학교", "인천안남초등학교", "인천안남중학교", "계산공업고등학교",
        "경인교육대학교부설초등학교", "인천효성동초등학교", "명현중학교", "인천미송유치원",
        "칼빈매니토바국제학교", "영흥초등학교(분기)", "덕적초중고등학교(분기)"
    ],

    // 3. 공통 유틸리티 함수
    /**
     * 시간 선택 <select> 엘리먼트에 08:00-17:30 옵션을 채웁니다.
     * @param {HTMLSelectElement} startSelectEl - 시작 시간 select 엘리먼트
     * @param {HTMLSelectElement} endSelectEl - 종료 시간 select 엘리먼트
     */
    fillTimeOptions: (startSelectEl, endSelectEl) => {
        if (!startSelectEl || !endSelectEl) return;
        startSelectEl.innerHTML = "";
        endSelectEl.innerHTML = "";
        for (let h = 8; h <= 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const startOption = new Option(timeStr, timeStr);
                const endOption = new Option(timeStr, timeStr);
                startSelectEl.add(startOption);
                endSelectEl.add(endOption);
            }
        }
    },

    /**
     * 현재 로그인한 사용자의 방문 일정을 가져옵니다.
     * @param {string | null} rangeStart - 조회 시작일 (YYYY-MM-DD)
     * @param {string | null} rangeEnd - 조회 종료일 (YYYY-MM-DD)
     * @returns {Promise<Array>} - 방문 일정 데이터 배열
     */
    fetchMyVisits: async (rangeStart = null, rangeEnd = null) => {
        if (!App.user) {
            console.warn("사용자 정보가 없어 일정을 가져올 수 없습니다.");
            return [];
        }
        
        let query = App.supabase.from('visits').select('*').eq('user_id', App.user.id);
        if (rangeStart) query = query.gte('visit_date', rangeStart);
        if (rangeEnd) query = query.lte('visit_date', rangeEnd);
        
        const { data, error } = await query.order('visit_date', { ascending: true });
        
        if (error) {
            console.error("일정 조회 중 에러 발생:", error);
            return [];
        }
        return data || [];
    },

    /**
     * 페이지 접근 권한을 확인하고 사용자 정보를 설정합니다.
     * login.html을 제외한 모든 페이지에서 세션이 없으면 로그인 페이지로 리디렉션합니다.
     */
    handleAuth: async () => {
        // 로그인 페이지에 있다면 가드 로직을 실행하지 않음
        if (location.pathname.includes('login.html')) {
            return;
        }

        const { data: { session }, error } = await App.supabase.auth.getSession();

        if (error) {
            console.error("세션 확인 중 에러:", error);
            location.href = 'login.html';
            return;
        }

        if (!session) {
            location.href = 'login.html';
        } else {
            App.user = session.user; // 전역 객체에 사용자 정보 저장
            App.updateUserInfoUI(); // 헤더의 사용자 정보 UI 업데이트
        }
    },
    
    /**
     * 헤더의 사용자 정보 UI를 업데이트합니다.
     */
    updateUserInfoUI: () => {
        if (!App.user) return;
        
        // 새로운 디자인에는 이메일과 로그아웃 버튼이 명시적으로 없으므로,
        // 콘솔에만 로그를 남기거나 필요시 UI 요소를 찾아 업데이트합니다.
        // 예: const userEmailEl = document.querySelector('.user-info .email');
        // if (userEmailEl) userEmailEl.textContent = App.user.email;
        console.log(`로그인된 사용자: ${App.user.email}`);

        // 로그아웃 버튼 (만약 존재한다면)
        const logoutBtn = document.getElementById('logoutBtn'); // 예시 ID
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                await App.supabase.auth.signOut();
                location.href = 'login.html';
            };
        }
    }
};

// 4. 페이지가 로드될 때 항상 인증 상태를 확인합니다.
document.addEventListener('DOMContentLoaded', App.handleAuth);
