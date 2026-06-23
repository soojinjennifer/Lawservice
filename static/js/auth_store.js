// auth_store.js — 인증 함수 골격 (1단계: 구조만 준비, 화면 연결 X)
// 역할:
//   · window.sb (supabase_client.js) 를 감싸는 얇은 인증 래퍼
//   · 이번 단계에서는 어떤 화면도 이 함수를 호출하지 않는다 (구조만 준비)
//   · 다음 단계에서 login/auth 화면, OAuth 버튼, 라우트 가드가 이 함수를 사용한다
// 노출:
//   · window.AuthStore  — 인증 함수 모음
//   · window.useAuth    — React 훅 (세션 상태 구독)
// 방어:
//   · window.sb 가 없으면(=Supabase 미설정) 모든 함수가 안전하게 실패값을 반환한다.

(function () {
  function client() {
    return (typeof window !== "undefined" && window.sb) || null;
  }

  function ensureClient() {
    var sb = client();
    if (!sb) {
      console.warn("[auth_store] Supabase 클라이언트가 없습니다. 인증 기능을 사용할 수 없습니다.");
    }
    return sb;
  }

  // 현재 세션 조회 → { data: { session }, error }
  async function getSession() {
    var sb = ensureClient();
    if (!sb) return { data: { session: null }, error: new Error("supabase-unavailable") };
    return await sb.auth.getSession();
  }

  // 현재 사용자(user) 객체만 반환 (없으면 null)
  async function getCurrentUser() {
    var sb = ensureClient();
    if (!sb) return null;
    var res = await sb.auth.getUser();
    return (res && res.data && res.data.user) || null;
  }

  // 인증 상태 변화 구독 → 구독 해제 함수 반환
  function onAuthStateChange(callback) {
    var sb = ensureClient();
    if (!sb) return function () {}; // no-op unsubscribe
    var sub = sb.auth.onAuthStateChange(function (event, session) {
      if (typeof callback === "function") callback(event, session);
    });
    return function () {
      try { sub.data.subscription.unsubscribe(); } catch (e) {}
    };
  }

  // 이메일/비밀번호 로그인
  async function signIn(params) {
    params = params || {};
    var sb = ensureClient();
    if (!sb) return { data: null, error: new Error("supabase-unavailable") };
    return await sb.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
  }

  // 이메일/비밀번호 회원가입 (name은 user_metadata로 저장)
  async function signUp(params) {
    params = params || {};
    var sb = ensureClient();
    if (!sb) return { data: null, error: new Error("supabase-unavailable") };
    return await sb.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name || "" } },
    });
  }

  // 소셜 OAuth 로그인 (provider: 'google' | 'kakao' ...)
  // scopes: 공백으로 구분한 권한 문자열(provider의 scope 파라미터로 전달). 생략 시 provider 기본 scope.
  async function signInWithOAuth(provider, redirectTo, scopes) {
    var sb = ensureClient();
    if (!sb) return { data: null, error: new Error("supabase-unavailable") };
    var options = {};
    if (redirectTo) options.redirectTo = redirectTo;
    if (scopes) options.scopes = scopes;
    return await sb.auth.signInWithOAuth({ provider: provider, options: options });
  }

  // 로그아웃
  async function signOut() {
    var sb = ensureClient();
    if (!sb) return { error: new Error("supabase-unavailable") };
    return await sb.auth.signOut();
  }

  // 현재 사용자의 무료체험 크레딧 조회
  async function getCredits() {
    var sb = ensureClient();
    if (!sb) return { data: null, error: new Error("supabase-unavailable") };
    return await sb
      .from("user_credits")
      .select("trial_notice_remaining, trial_revision_remaining")
      .single();
  }

  // 내용증명 크레딧 1건 차감 (RPC — SECURITY DEFINER)
  // 반환: { data: true } = 차감 성공 / { data: false } = 잔여 없음
  async function deductTrialNotice() {
    var sb = ensureClient();
    if (!sb) return { data: false, error: new Error("supabase-unavailable") };
    return await sb.rpc("deduct_trial_notice");
  }

  // 대화형 수정 크레딧 1회 차감 (RPC — SECURITY DEFINER)
  async function deductTrialRevision() {
    var sb = ensureClient();
    if (!sb) return { data: false, error: new Error("supabase-unavailable") };
    return await sb.rpc("deduct_trial_revision");
  }

  // 동기 user-id 캐시 (결제 권한 게이트 X-User-Id 헤더용, FR-30)
  // async getCurrentUser는 fetch 헤더에서 못 쓰므로 세션 변화 시 캐시.
  var _cachedUserId = null;
  function getUserId() { return _cachedUserId; }
  getSession().then(function (res) {
    var s = res && res.data && res.data.session;
    _cachedUserId = (s && s.user && s.user.id) || null;
  });
  onAuthStateChange(function (event, session) {
    _cachedUserId = (session && session.user && session.user.id) || null;
  });

  window.AuthStore = {
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    getUserId: getUserId,
    onAuthStateChange: onAuthStateChange,
    signIn: signIn,
    signUp: signUp,
    signInWithOAuth: signInWithOAuth,
    signOut: signOut,
    getCredits: getCredits,
    deductTrialNotice: deductTrialNotice,
    deductTrialRevision: deductTrialRevision,
  };

  // React 훅 — 무료체험 크레딧 상태 구독
  // 로그인 상태 변화 시 자동 갱신. refreshCredits()로 수동 갱신 가능.
  if (typeof window !== "undefined" && window.React) {
    window.useCredits = function useCredits() {
      var React = window.React;
      var _credits = React.useState(null);
      var credits = _credits[0], setCredits = _credits[1];
      var _loading = React.useState(true);
      var loading = _loading[0], setLoading = _loading[1];

      function fetchCredits(mounted) {
        getCredits().then(function (res) {
          if (!mounted || !mounted.current) return;
          setCredits((res && res.data) || null);
          setLoading(false);
        });
      }

      React.useEffect(function () {
        var mounted = { current: true };

        getSession().then(function (res) {
          if (!mounted.current) return;
          if (res && res.data && res.data.session) {
            fetchCredits(mounted);
          } else {
            setLoading(false);
          }
        });

        var unsubscribe = onAuthStateChange(function (event, session) {
          if (!mounted.current) return;
          if (session) {
            fetchCredits(mounted);
          } else {
            setCredits(null);
            setLoading(false);
          }
        });

        return function () {
          mounted.current = false;
          unsubscribe();
        };
      }, []);

      return {
        credits: credits,
        creditLoading: loading,
        refreshCredits: function () { fetchCredits({ current: true }); },
      };
    };
  }

  // React 훅 — 세션/사용자 상태 구독 (다음 단계에서 화면이 사용)
  // React가 로드된 환경에서만 정의한다.
  if (typeof window !== "undefined" && window.React) {
    window.useAuth = function useAuth() {
      var React = window.React;
      var _session = React.useState(null);
      var session = _session[0], setSession = _session[1];
      var _loading = React.useState(true);
      var loading = _loading[0], setLoading = _loading[1];

      React.useEffect(function () {
        var mounted = true;

        getSession().then(function (res) {
          if (!mounted) return;
          setSession((res && res.data && res.data.session) || null);
          setLoading(false);
        });

        var unsubscribe = onAuthStateChange(function (_event, newSession) {
          if (!mounted) return;
          setSession(newSession || null);
        });

        return function () {
          mounted = false;
          unsubscribe();
        };
      }, []);

      return {
        session: session,
        user: (session && session.user) || null,
        isAuthed: !!(session && session.user),
        loading: loading,
      };
    };
  }
})();
