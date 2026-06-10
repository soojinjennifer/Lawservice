// auth_screen.js — 회원가입 화면 (PRD v1.2 §6.1)
// 공통 컴포넌트: AuthSplitLayout · AuthCard · AuthCardHeader
//               SocialLoginRow · AuthDivider
//               TextInput(showToggle) · Btn · Alert · Badge · LegalNotice

window.AuthScreen = function AuthScreen() {
  const [email,    setEmail]    = React.useState("");
  const [name,     setName]     = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agreed,   setAgreed]   = React.useState(false);
  const [error,    setError]    = React.useState("");
  const [loading,  setLoading]  = React.useState(false);

  const validate = () => {
    if (!email.trim())    return "이메일을 입력해 주세요.";
    if (!name.trim())     return "이름 또는 닉네임을 입력해 주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (!agreed)          return "이용약관 및 개인정보처리방침에 동의해 주세요.";
    return "";
  };

  // 이메일/비밀번호 회원가입 (이메일 인증 OFF 전제 → 성공 시 즉시 세션 발급)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError("");
    setLoading(true);

    const { error: signUpError } = await AuthStore.signUp({ email, password, name });

    if (signUpError) {
      setError(signUpError.message || "회원가입에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    // 이메일 인증 OFF면 signUp 직후 세션이 발급될 수 있음.
    // 사용자가 로그인 화면에서 정식 로그인하도록 세션을 정리한 뒤 #/login으로 이동.
    await AuthStore.signOut();
    if (window.ToastManager) {
      window.ToastManager.show({
        type: "success",
        message: "회원가입이 완료되었습니다. 로그인해주세요.",
      });
    }
    window.location.hash = "/login";
  };

  // 소셜 회원가입/로그인 — Google · Kakao (Naver는 준비 중, 비활성)
  const handleSocial = async (provider) => {
    if (provider === "naver") return; // 준비 중 — 다음 단계에서 별도 구현
    setError("");
    setLoading(true);
    // 해시 라우팅 복귀를 고려해 사이트 루트로 복귀 (OAuth 콜백 라우팅은 다음 단계)
    const redirectTo = window.location.origin + "/";
    // Kakao는 account_email 없이 닉네임·프로필 이미지만 요청 (Google은 provider 기본 scope)
    const scopes = provider === "kakao" ? "profile_nickname profile_image" : undefined;
    const { error: oauthError } = await AuthStore.signInWithOAuth(provider, redirectTo, scopes);
    if (oauthError) {
      setError(oauthError.message || "소셜 회원가입에 실패했습니다.");
      setLoading(false);
    }
    // 성공 시 브라우저가 Supabase OAuth 페이지로 이동하므로 이후 코드는 실행되지 않음
  };

  // ── 좌 패널 특징 목록 (가입용 메시지) ──────────────────
  const signupFeatures = [
    { icon: "sparkle", text: "내용증명 첫 1건 무료 생성 (워터마크 포함)" },
    { icon: "chat",    text: "대화형 AI 수정 3회 무료 제공" },
    { icon: "save",    text: ".docx 파일 저장 및 재다운로드" },
    { icon: "shield",  text: "사건 정보 암호화 보관" },
  ];

  return (
    <AuthSplitLayout
      headline={<>법률 지식이 없어도<br />10분이면<br />첫 초안이 완성됩니다.</>}
      subtext="가입 즉시 내용증명 1건을 무료로 만들어 볼 수 있어요. 변호사 없이도, 억울한 일을 법률문서의 언어로 정리해 드립니다."
      features={signupFeatures}
      activeTab="signup"
    >
      <AuthCard size="wide">
        {/* 카드 헤더 */}
        <AuthCardHeader
          title="무료로 시작하세요"
          subtitle={
            <>
              이미 계정이 있으신가요?{" "}
              <a href="#/login" style={{ color: "var(--brand-rest)", fontWeight: 600 }}>로그인</a>
            </>
          }
        />

        {/* 무료 체험 강조 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Badge variant="success" icon="sparkle">내용증명 1건 무료</Badge>
          <Badge variant="info">대화형 수정 3회</Badge>
        </div>

        {/* 소셜 가입 — Google·Kakao 연결, Naver는 준비 중(비활성) */}
        <SocialLoginRow onLogin={handleSocial} disabledProviders={["naver"]} />

        {/* 구분선 */}
        <AuthDivider>또는 이메일로 가입</AuthDivider>

        {/* 에러 */}
        {error && (
          <Alert type="error" closable onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* 가입 폼 */}
        <form className="field-stack" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="이메일"
            type="email"
            required
            leadingIcon="mail"
            placeholder="example@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />

          <TextInput
            label="이름 / 닉네임"
            type="text"
            required
            leadingIcon="person"
            placeholder="실명 또는 닉네임"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
          />

          <TextInput
            label="비밀번호"
            type="password"
            required
            showToggle
            leadingIcon="lock"
            placeholder="8자 이상, 영문+숫자 조합"
            value={password}
            onChange={e => setPassword(e.target.value)}
            helperText="8자 이상, 영문 + 숫자를 포함해 주세요."
            autoComplete="new-password"
          />

          {/* 약관 동의 */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13,
            cursor: "pointer", color: "var(--color-neutral-fg-2)", lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--brand-rest)", flexShrink: 0 }}
            />
            <span>
              <a href="#/terms" style={{ color: "var(--brand-rest)", fontWeight: 600 }}>이용약관</a> 및{" "}
              <a href="#/privacy" style={{ color: "var(--brand-rest)", fontWeight: 600 }}>개인정보처리방침</a>에
              동의합니다. <span style={{ color: "var(--color-status-danger-fg)" }}>*</span>
            </span>
          </label>

          <Btn
            variant="primary"
            size="lg"
            width="fill"
            type="submit"
            loading={loading}
            icon={loading ? undefined : "sparkle"}
            iconPos="left"
          >
            {loading ? "가입 중..." : "무료로 시작하기"}
          </Btn>
        </form>

        {/*<LegalNotice compact />*/}
      </AuthCard>
    </AuthSplitLayout>
  );
};
