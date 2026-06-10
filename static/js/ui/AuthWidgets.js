// ui/AuthWidgets.js — 로그인·가입 공용 소형 컴포넌트
// SocialLoginRow / AuthDivider / AuthCard
// 세 컴포넌트 모두 login_screen.js · auth_screen.js 양쪽에서 동일하게 사용.

// ── SocialLoginRow ────────────────────────────────────────────
// Google · Kakao · Naver 소셜 버튼 행
// Props:
//   cols              : 2 | 3(기본) — 컬럼 수 (2 = Google+Kakao 또는 원하는 2종)
//   providers         : string[] — 표시할 프로바이더 (기본: 전체 3종)
//   disabledProviders : string[] — "준비 중"으로 비활성화할 프로바이더 (기본: [])
//   onLogin           : function(provider) — 클릭 핸들러 (미제공 시 "#/"로 이동)
//
// 사용 예시:
//   <SocialLoginRow />                              // 3종 기본
//   <SocialLoginRow cols={2} providers={['google','kakao']} />
//   <SocialLoginRow onLogin={fn} disabledProviders={['naver']} />

const SOCIAL_PROVIDERS = {
  google: {
    label: "Google",
    cls: "",
    icon: <Icon name="google" size={18} />,
  },
  kakao: {
    label: "Kakao",
    cls: "kakao",
    icon: <Icon name="kakao" size={18} />,
  },
  naver: {
    label: "Naver",
    cls: "naver",
    icon: <span style={{ fontWeight: 800, fontSize: 16, fontStyle: "italic", lineHeight: 1 }}>N</span>,
  },
};

window.SocialLoginRow = function SocialLoginRow({
  cols              = 3,
  providers         = ["google", "kakao", "naver"],
  disabledProviders = [],
  onLogin,
}) {
  const rowCls = `social-row${cols === 2 ? " cols-2" : ""}`;
  return (
    <div className={rowCls}>
      {providers.map(p => {
        const cfg = SOCIAL_PROVIDERS[p];
        if (!cfg) return null;
        const isDisabled = disabledProviders.includes(p);
        return (
          <button
            key={p}
            type="button"
            // 비활성 시 컬러 클래스(cfg.cls)를 빼서 중립 회색 버튼으로 표시
            className={`social-btn ${isDisabled ? "" : cfg.cls}`}
            disabled={isDisabled}
            onClick={isDisabled ? undefined : () => (onLogin ? onLogin(p) : (window.location.hash = "/"))}
            aria-label={isDisabled ? `${cfg.label} 준비 중` : `${cfg.label}로 계속하기`}
            title={isDisabled ? "준비 중입니다" : undefined}
            style={isDisabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            {cfg.icon} {isDisabled ? `${cfg.label} 준비 중` : cfg.label}
          </button>
        );
      })}
    </div>
  );
};

// ── AuthDivider ───────────────────────────────────────────────
// "또는 이메일로 로그인/가입" 구분선
// Props:
//   children : string (기본: "또는 이메일로 계속")
//
// 사용 예시:
//   <AuthDivider>또는 이메일로 로그인</AuthDivider>
//   <AuthDivider>또는 이메일로 가입</AuthDivider>

window.AuthDivider = function AuthDivider({ children = "또는 이메일로 계속" }) {
  return <div className="auth-divider">{children}</div>;
};

// ── AuthCard ──────────────────────────────────────────────────
// 로그인·가입 우측 패널의 흰색 폼 카드
// Props:
//   size     : 'narrow'(기본, 440px) | 'wide'(520px) — 로그인=narrow, 가입=wide
//   children : ReactNode
//
// 사용 예시 (로그인):
//   <AuthCard size="narrow">…로그인 폼…</AuthCard>
//
// 사용 예시 (가입):
//   <AuthCard size="wide">…가입 폼…</AuthCard>

window.AuthCard = function AuthCard({ size = "narrow", children, style }) {
  return (
    <div
      className={`auth-card auth-card-${size}`}
      style={style}
    >
      {children}
    </div>
  );
};

// ── AuthCardHeader ────────────────────────────────────────────
// 카드 상단 제목 + 부제목 영역 (.auth-crown)
// Props:
//   title    : string
//   subtitle : ReactNode
//
// 사용 예시:
//   <AuthCardHeader
//     title="로그인"
//     subtitle={<>계정이 없으신가요? <a href="#/signup">무료 가입</a></>}
//   />

window.AuthCardHeader = function AuthCardHeader({ title, subtitle }) {
  return (
    <div className="auth-crown">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{title}</h2>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-neutral-fg-3)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
