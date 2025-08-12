// app.js - 전역 애플리케이션 관리 (로그인 기능 포함)

window.App = {
    supabase: supabase.createClient(
        "https://harsxljqcnyfgsueiwvq.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnN4bGpxY255ZmdzdWVpd3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQ2OTYsImV4cCI6MjA3MDUyMDY5Nn0.jyXqWN_IwNagbxXCikO2dJxvegWS0Wblo79rb87f2Rg"
    ),
    user: null, // 로그인한 사용자 정보를 저장할 변수
    
    SCHOOLS: [
        "숭덕여자중학교", "숭덕여자고등학교", "인천예림학교", "간석여자중학교", "삼산유치원",
        "인천초은중학교", "인천루원중학교", "인천가석초등학교", "상정중학교", "제물포중학교",
        "가좌중학교", "인천건지초등학교", "가림고등학교", "인천대정초등학교", "재능대학교 송림캠퍼스부속유치원",
        "인천소방고등학교", "인성여자중학교", "인천신흥초등학교", "인천송림초등학교", "인천예일고등학교",
        "인천양촌중학교", "임학중학교", "인천안남초등학교", "인천안남중학교", "계산공업고등학교",
        "경인교육대학교부설초등학교", "인천효성동초등학교", "명현중학교", "인천미송유치원",
        "칼빈매니토바국제학교", "영흥초등학교(분기)", "덕적초중고등학교(분기)"
    ],

    fillTimeOptions: (startSelectEl, endSelectEl) => {
        if (!startSelectEl || !endSelectEl) return;
        startSelectEl.innerHTML = "";
        endSelectEl.innerHTML = "";
        for (let h = 8; h <= 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                startSelectEl.add(new Option(timeStr, timeStr));
                endSelectEl.add(new Option(timeStr, timeStr));
            }
        }
    },

    fetchMyVisits: async (rangeStart = null, rangeEnd = null) => {
        if (!App.user) return []; // 로그인 안했으면 빈 배열 반환
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

    handleAuth: async () => {
        const { data: { session } } = await App.supabase.auth.getSession();
        App.user = session?.user || null;

        if (location.pathname.includes('login.html')) return;
        
        App.updateMainUI();
    },
    
    // [수정] 로그인 상태에 따라 UI를 제어하는 함수
    updateMainUI: () => {
        const loginSectionEl = document.getElementById('sidebar-login-section');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (!loginSectionEl || !logoutBtn) return;

        if (App.user) {
            // 로그인 상태: 로그인 폼 숨기고, 로그아웃 버튼 표시
            loginSectionEl.style.display = 'none';
            logoutBtn.style.display = 'block';

            logoutBtn.onclick = async () => {
                await App.supabase.auth.signOut();
                location.reload();
            };

        } else {
            // 로그아웃 상태: 로그인 폼 표시, 로그아웃 버튼 숨김
            loginSectionEl.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
        
        App.attachSidebarLoginForm();
    },

    attachSidebarLoginForm: () => {
        const form = document.getElementById('loginFormSidebar');
        if (!form) return;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('sidebar-email').value;
            const password = document.getElementById('sidebar-password').value;
            const errorMessageEl = document.getElementById('sidebar-error-message');
            
            errorMessageEl.style.display = 'none';

            const { error } = await App.supabase.auth.signInWithPassword({ email, password });

            if (error) {
                errorMessageEl.textContent = "로그인 실패. 정보를 확인하세요.";
                errorMessageEl.style.display = 'block';
                return;
            }
            location.reload();
        };
    }
};

document.addEventListener('DOMContentLoaded', App.handleAuth);
