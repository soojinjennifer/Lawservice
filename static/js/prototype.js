// prototype.js — SPA 라우터 (hash-based)

// ── FAQ 화면 (간단 스텁) ──────────────────────────────────────
window.FAQScreen = function FAQScreen() {
  const faqs = [
    { q: "AI가 생성한 문서를 그대로 제출해도 되나요?",
      a: "본 서비스가 생성하는 모든 문서는 '참고용 초안'입니다. 법적 효력이나 정확성을 보장하지 않으므로, 실제 발송·제출 전 변호사 검토를 권고드립니다." },
    { q: "API 키는 어디에 입력해야 하나요?",
      a: "API 키는 서버의 .env 파일에 저장되어 있으며, 사용자 화면에서는 노출되지 않습니다. 서버 관리자가 설정합니다." },
    { q: "내가 입력한 사건 정보는 어디에 저장되나요?",
      a: "사건 정보는 AI 초안 생성에만 사용되며, 서버에 별도로 저장되지 않습니다." },
    { q: "생성된 문서를 어떻게 저장하나요?",
      a: "초안 미리보기 또는 수정 화면에서 '.docx 받기' 버튼을 클릭하면 Word 문서 형식으로 다운로드됩니다." },
    { q: "계약서 기능은 언제 사용할 수 있나요?",
      a: "계약서는 현재 개발 중으로, 곧 오픈될 예정입니다." },
  ];

  return (
    <div className="screen">
      <TopNav active="faq" />
      <div className="screen-content" style={{ maxWidth: 880, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px" }}>자주 묻는 질문</h1>
        <p className="muted" style={{ margin: "0 0 32px", fontSize: 15 }}>서비스 이용 관련 안내입니다.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((f, i) => <AccordionItem key={i} {...f} defaultOpen={i === 0} />)}
        </div>
      </div>
    </div>
  );
};

// ── 비밀번호 찾기 화면 (stub) ─────────────────────────────────
window.ResetScreen = function ResetScreen() {
  const [email, setEmail] = React.useState("");
  const [sent,  setSent]  = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <AuthSplitLayout
      headline={<>비밀번호를<br />재설정합니다.</>}
      subtext="가입하신 이메일 주소를 입력하면 재설정 링크를 보내드립니다."
      activeTab={null}
    >
      <AuthCard size="narrow">
        <AuthCardHeader
          title="비밀번호 찾기"
          subtitle={<><a href="#/login" style={{ color: "var(--brand-rest)", fontWeight: 600 }}>로그인으로 돌아가기</a></>}
        />
        {sent ? (
          <Alert type="success">
            <b>{email}</b>로 재설정 링크를 발송했습니다. 메일함을 확인해 주세요.
          </Alert>
        ) : (
          <form className="field-stack" onSubmit={handleSubmit} noValidate>
            <TextInput
              label="가입하신 이메일"
              type="email"
              required
              leadingIcon="mail"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Btn variant="primary" size="lg" width="fill" type="submit">
              재설정 링크 보내기
            </Btn>
          </form>
        )}
        <LegalNotice compact />
      </AuthCard>
    </AuthSplitLayout>
  );
};

// ── 인증 라우팅 상수 ──────────────────────────────────────────
// 로그인한 사용자만 접근 가능한 보호 페이지
const PROTECTED_ROUTES = new Set(["dashboard", "mydocs", "subscription", "create"]);

// OAuth 콜백 여부 — 모듈 로드 시(동기) 1회 캡처.
// supabase-js(detectSessionInUrl)가 URL을 비동기로 정리하기 전에 읽어야 정확하다.
const OAUTH_RETURN = /[?&]code=/.test(window.location.search) || /access_token=/.test(window.location.hash);
const OAUTH_ERROR  = /[?&]error=/.test(window.location.search) || /[#&]error=/.test(window.location.hash);

// ── SPA 라우터 ────────────────────────────────────────────────
function Prototype() {
  const [path, setPath] = React.useState(() => window.location.hash.replace(/^#/, "") || "/");

  // 인증 상태(실제 Supabase 세션) — 미로드 시 안전 폴백
  const auth = (typeof window.useAuth === "function")
    ? window.useAuth()
    : { user: null, isAuthed: false, loading: false };

  React.useEffect(() => {
    const onHash = () => {
      const p = window.location.hash.replace(/^#/, "") || "/";
      setPath(p);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // data-nav 클릭 이벤트 위임
  React.useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest("[data-nav]");
      if (!el) return;
      if (el.hasAttribute("disabled")) return;
      const to = el.getAttribute("data-nav");
      if (!to) return;
      e.preventDefault();
      window.location.hash = to;
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // ── OAuth 콜백 안착: 세션 확정 시 #/dashboard로 이동 + 완료 피드백 ──
  React.useEffect(() => {
    // 실패/취소: 에러 토스트 후 로그인 화면으로
    if (OAUTH_ERROR) {
      if (window.ToastManager) {
        window.ToastManager.show({ type: "error", message: "소셜 로그인이 취소되었거나 실패했습니다." });
      }
      window.location.hash = "/login";
      return;
    }
    if (!OAUTH_RETURN) return;

    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      if (window.ToastManager) {
        window.ToastManager.show({ type: "success", message: "로그인되었습니다." });
      }
      // OAuth 시작 전 저장된 returnTo가 있으면 해당 경로로 복귀 (같은 오리진 경로만 허용)
      const saved = sessionStorage.getItem("returnTo");
      sessionStorage.removeItem("returnTo");
      const safe = saved && /^\//.test(saved) && !/^\/\//.test(saved) ? saved : null;
      window.location.hash = safe || "/dashboard";
    };

    // 이미 세션이 준비된 경우 즉시 안착
    if (window.AuthStore) {
      window.AuthStore.getSession().then(({ data }) => {
        if (data && data.session) land();
      });
    }
    // code 교환이 늦게 끝나는 경우 onAuthStateChange로 안착
    const unsub = window.AuthStore
      ? window.AuthStore.onAuthStateChange((event, session) => {
          if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) land();
        })
      : function () {};
    return unsub;
  }, []);

  // 라우트 path에서 쿼리스트링(?returnTo=…) 분리
  const [pathOnly] = path.split("?");
  const parts = pathOnly.replace(/^\//, "").split("/").filter(Boolean);
  const route = parts[0] || "home";
  const sub   = parts[1];

  // ── 라우트 가드 ──────────────────────────────────────────────
  React.useEffect(() => {
    if (auth.loading) return;          // 세션 확인 전엔 판단 보류(로그인 사용자 오축출 방지)
    if (OAUTH_RETURN || OAUTH_ERROR) return; // OAuth 안착 effect가 처리하도록 양보

    if (PROTECTED_ROUTES.has(route) && !auth.isAuthed) {
      // 비로그인 → 원래 경로를 returnTo로 보존하며 로그인으로
      window.location.hash = "/login?returnTo=" + encodeURIComponent(pathOnly);
    } else if ((route === "login" || route === "signup") && auth.isAuthed) {
      // 이미 로그인한 사용자가 로그인/가입 진입 → 대시보드
      window.location.hash = "/dashboard";
    } else if (route === "home" && auth.isAuthed) {
      // 로그인 상태에서 홈(/) 접근 → 대시보드로 이동
      window.location.hash = "/dashboard";
    }
  }, [path, route, pathOnly, auth.isAuthed, auth.loading]);

  // 보호 페이지 + 세션 확인 중에는 보호 콘텐츠 깜빡임 방지
  // 홈(/)도 로그인 상태면 대시보드를 보여주므로 로딩 중 깜빡임 방지 포함
  const guardPending = auth.loading && (PROTECTED_ROUTES.has(route) || route === "home");

  let screen;
  switch (route) {
    case "home":         screen = auth.isAuthed ? <DashboardScreen /> : <HomeScreen />; break;
    case "login":        screen = <LoginScreen />; break;
    case "signup":       screen = <AuthScreen />; break;
    case "create":       screen = <CreateScreen initialStep={Number(sub) || 1} />; break;
    case "mydocs":       screen = <MyDocsScreen />; break;
    case "subscription": screen = <SubscriptionScreen />; break;
    case "dashboard":    screen = <DashboardScreen />; break;
    case "reset":        screen = <ResetScreen />; break;
    case "faq":          screen = <FAQScreen />; break;
    case "help":         screen = <HelpScreen />; break;
    default:             screen = auth.isAuthed ? <DashboardScreen /> : <HomeScreen />;
  }

  // Toast + Modal 전역 마운트 (라우터 최상단에서 단 1회)
  return (
    <>
      {guardPending ? null : screen}
      <ToastContainer />
      <AppModalRoot />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Prototype />);
