// login_screen.js — 로그인 화면 (PRD v1.2 §6.2)
// 공통 컴포넌트: AuthSplitLayout · AuthCard · AuthCardHeader
//               SocialLoginRow · AuthDivider
//               TextInput(showToggle) · Btn · Alert · LegalNotice

window.LoginScreen = function LoginScreen() {
  const [email,     setEmail]    = React.useState("");
  const [password,  setPassword] = React.useState("");
  const [error,     setError]    = React.useState("");
  const [loading,   setLoading]  = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Supabase 호출 전 선검증
    if (!email.trim())    { setError("이메일을 입력해 주세요."); return; }
    if (!password.trim()) { setError("비밀번호를 입력해 주세요."); return; }
    setError("");
    setLoading(true);

    const { error: signInError } = await AuthStore.signIn({ email, password });

    if (signInError) {
      setError(signInError.message || "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }

    // returnTo 우선순위: URL 쿼리(?returnTo=) → sessionStorage → 대시보드
    let returnTo = null;
    const qi = window.location.hash.indexOf("?");
    if (qi >= 0) {
      returnTo = new URLSearchParams(window.location.hash.slice(qi + 1)).get("returnTo");
    }
    if (!returnTo) returnTo = sessionStorage.getItem("returnTo");
    sessionStorage.removeItem("returnTo");

    window.location.hash = returnTo || "/dashboard";
  };

  // 소셜 로그인 — Google · Kakao (Naver는 준비 중, 비활성)
  // OAuth 성공 후 dashboard 안착·완료 토스트는 prototype.js 콜백 처리에서 담당
  const handleSocial = async (provider) => {
    if (provider === "naver") return; // 준비 중 — 별도 구현 예정
    setError("");
    setLoading(true);

    // OAuth 완료 후 복귀할 경로를 sessionStorage에 보존
    // (브라우저가 외부 OAuth 페이지로 이동하면 이 컴포넌트 state가 날아가므로 sessionStorage 사용)
    const qi = window.location.hash.indexOf("?");
    const returnTo = qi >= 0
      ? new URLSearchParams(window.location.hash.slice(qi + 1)).get("returnTo")
      : null;
    if (returnTo) {
      sessionStorage.setItem("returnTo", returnTo);
    } else {
      sessionStorage.removeItem("returnTo");
    }

    // 해시 라우팅 복귀를 고려해 사이트 루트로 복귀
    const redirectTo = window.location.origin + "/";
    // Kakao는 account_email 없이 닉네임·프로필 이미지만 요청 (Google은 provider 기본 scope)
    const scopes = provider === "kakao" ? "profile_nickname profile_image" : undefined;
    const { error: oauthError } = await AuthStore.signInWithOAuth(provider, redirectTo, scopes);
    if (oauthError) {
      setError(oauthError.message || "소셜 로그인에 실패했습니다.");
      setLoading(false);
    }
    // 성공 시 브라우저가 Supabase OAuth 페이지로 이동하므로 이후 코드는 실행되지 않음
  };

  // ── 좌 패널 — 마지막 문서 미리보기 카드 ─────────────────
  const previewCard = (
    <CardFlat padding={20} style={{
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.18)",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Icon name="document" size={13} color="rgba(255,255,255,0.7)" />
        마지막으로 보던 문서
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>내용증명 — 미수금 독촉</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>작성중 · 3시간 전</div>
    </CardFlat>
  );

  return (
    <AuthSplitLayout
      headline={<>다시 오신 것을<br />환영해요.<br />작성 중이던 초안이<br />기다리고 있어요.</>}
      subtext="로그인하면 나의 문서에서 임시 저장한 초안을 이어서 수정하거나, 새 문서 생성을 바로 시작할 수 있어요."
      previewCard={previewCard}
      activeTab="login"
    >
      <AuthCard size="narrow">
        {/* 카드 헤더 */}
        <AuthCardHeader
          title="로그인"
          subtitle={<>계정이 없으신가요?{" "}<a href="#/signup" style={{ color: "var(--brand-rest)", fontWeight: 600 }}>무료 가입</a></>}
        />

        {/* 소셜 로그인 — Google·Kakao 연결, Naver는 준비 중(비활성) */}
        <SocialLoginRow onLogin={handleSocial} disabledProviders={["naver"]} />

        {/* 구분선 */}
        <AuthDivider>또는 이메일로 로그인</AuthDivider>

        {/* 에러 */}
        {error && (
          <Alert type="error" closable onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* 폼 */}
        <form className="field-stack" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="이메일"
            type="email"
            required
            leadingIcon="mail"
            placeholder="example@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            state={error && !email.trim() ? "error" : "default"}
            autoComplete="email"
          />

          <TextInput
            label="비밀번호"
            type="password"
            required
            showToggle
            leadingIcon="lock"
            placeholder="비밀번호 입력"
            value={password}
            onChange={e => setPassword(e.target.value)}
            state={error && !password.trim() ? "error" : "default"}
            autoComplete="current-password"
          />

          {/* 비밀번호 찾기 */}
          <div style={{ textAlign: "right" }}>
            <a href="#/reset/1" style={{ fontSize: 13, color: "var(--brand-rest)" }}>비밀번호 찾기</a>
          </div>

          <Btn
            variant="primary"
            size="lg"
            width="fill"
            type="submit"
            loading={loading}
            icon={loading ? undefined : "arrowR"}
            iconPos="right"
          >
            로그인
          </Btn>
        </form>

        {/*<LegalNotice compact />*/}
      </AuthCard>
    </AuthSplitLayout>
  );
};
