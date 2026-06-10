// supabase_client.js — Supabase 클라이언트 초기화 (1단계: 기반 연결)
// 역할:
//   · window.__SUPABASE__ (index.html에서 서버가 주입) 값으로 createClient 호출
//   · window.sb 로 전역 노출 → auth_store.js 및 이후 화면에서 사용
// 주의:
//   · 이 파일은 화면/로직과 연결하지 않는다. 클라이언트 인스턴스 생성만 담당.
//   · CDN 미로드 또는 환경변수 미설정 시에도 앱이 죽지 않도록 방어한다.

(function () {
  var cfg = (typeof window !== "undefined" && window.__SUPABASE__) || {};
  var url = cfg.url || "";
  var anonKey = cfg.anonKey || "";

  // 방어 1: Supabase CDN 미로드
  if (typeof window === "undefined" ||
      !window.supabase ||
      typeof window.supabase.createClient !== "function") {
    console.warn("[supabase_client] Supabase CDN(@supabase/supabase-js)이 로드되지 않았습니다. 인증 기능이 비활성화됩니다.");
    if (typeof window !== "undefined") window.sb = null;
    return;
  }

  // 방어 2: 환경변수(URL / anon key) 미설정
  if (!url || !anonKey) {
    console.warn("[supabase_client] SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다. (.env 확인) 인증 기능이 비활성화됩니다.");
    window.sb = null;
    return;
  }

  try {
    window.sb = window.supabase.createClient(url, anonKey, {
      auth: {
        persistSession: true,      // localStorage에 세션 영속
        autoRefreshToken: true,    // 액세스 토큰 자동 갱신
        detectSessionInUrl: true,  // OAuth 리다이렉트 복귀 시 URL에서 세션 자동 감지
      },
    });
    console.info("[supabase_client] Supabase 클라이언트 초기화 완료.");
  } catch (e) {
    console.error("[supabase_client] createClient 실패:", e);
    window.sb = null;
  }
})();
