// app.js - 전역 애플리케이션 관리 (인증 기능 완전 제거)

window.App = {
    supabase: window.supabase.createClient(
        "https://harsxljqcnyfgsueiwvq.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnN4bGpxY255ZmdzdWVpd3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQ2OTYsImV4cCI6MjA3MDUyMDY5Nn0.jyXqWN_IwNagbxXCikO2dJxvegWS0Wblo79rb87f2Rg"
    ),
    
    // 공통 데이터
    SCHOOLS: [
        "숭덕여자중학교", "숭덕여자고등학교", "인천예림학교", "간석여자중학교", "삼산유치원",
        "인천초은중학교", "인천루원중학교", "인천가석초등학교", "상정중학교", "제물포중학교",
        "가좌중학교", "인천건지초등학교", "가림고등학교", "인천대정초등학교", "재능대학교 송림캠퍼스부속유치원",
        "인천소방고등학교", "인성여자중학교", "인천신흥초등학교", "인천송림초등학교", "인천예일고등학교",
        "인천양촌중학교", "임학중학교", "인천안남초등학교", "인천안남중학교", "계산공업고등학교",
        "경인교육대학교부설초등학교", "인천효성동초등학교", "명현중학교", "인천미송유치원",
        "칼빈매니토바국제학교", "영흥초등학교(분기)", "덕적초중고등학교(분기)"
    ],

    // 공통 유틸리티 함수
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

    // 모든 방문 일정을 가져옵니다. (사용자 구분 없음)
    fetchAllVisits: async (rangeStart = null, rangeEnd = null) => {
        let query = App.supabase.from('visits').select('*');
        if (rangeStart) query = query.gte('visit_date', rangeStart);
        if (rangeEnd) query = query.lte('visit_date', rangeEnd);
        
        const { data, error } = await query.order('visit_date', { ascending: true });
        
        if (error) {
            console.error("일정 조회 중 에러 발생:", error);
            alert("일정 데이터를 불러오지 못했습니다. 데이터베이스 설정을 확인하세요.");
            return [];
        }
        return data || [];
    },
};
