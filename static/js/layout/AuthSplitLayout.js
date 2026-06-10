// layout/AuthSplitLayout.js — 로그인·가입·비번찾기 공용 2분할 레이아웃 (PRD v1.2)
// 좌: 브랜드 패널(그라데이션·헤드카피·특징), 우: 폼 카드 영역
//
// Props:
//   headline    : string — 좌 패널 대제목 (JSX 가능)
//   subtext     : string — 좌 패널 부제
//   features    : [{ icon, text }] — 특징 아이콘 목록 (선택)
//   previewCard : ReactNode — 좌 패널 하단 미리보기 카드 (선택)
//   children    : ReactNode — 우 패널 폼 콘텐츠
//   activeTab   : 'login' | 'signup' — 상단 탭 강조 (선택)
//
// 사용 예시:
//   <AuthSplitLayout
//     headline={<>억울한 일을<br/>법률문서의 언어로<br/>정리해드립니다.</>}
//     subtext="가입 즉시 내용증명 1건을 무료로 만들어 볼 수 있어요."
//     activeTab="signup"
//   >
//     <YourFormCard />
//   </AuthSplitLayout>

const AUTH_FEATURES = [
  { icon: "sparkle", text: "Claude AI 기반 초안 자동 생성" },
  { icon: "chat",    text: "대화로 다듬는 자연어 수정" },
  { icon: "save",    text: ".docx 파일 저장 및 재다운로드" },
  { icon: "shield",  text: "사건 정보 암호화 보관" },
];

window.AuthSplitLayout = function AuthSplitLayout({
  headline,
  subtext,
  features    = AUTH_FEATURES,
  previewCard = null,
  activeTab,
  children,
}) {
  return (
    <div className="screen" style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1.05fr",
      background: "#fff",
    }}>
      {/* ── 좌측 브랜드 패널 ─────────────────────────────── */}
      <aside style={{
        background: "linear-gradient(160deg, var(--brand-rest) 0%, var(--brand-darker) 100%)",
        color: "#fff",
        padding: "56px 64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 배경 원형 장식 */}
        <div style={{ position: "absolute", right: -120, top: -120, width: 400, height: 400, borderRadius: 999, background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", right: 100, bottom: -200, width: 320, height: 320, borderRadius: 999, background: "rgba(255,255,255,.04)" }} />

        {/* 로고 */}
        <div style={{ zIndex: 1 }}>
          <ServiceMark light />
        </div>

        {/* 헤드카피 + 특징 */}
        <div style={{ zIndex: 1 }}>
          <h1 style={{
            fontSize: 36, lineHeight: 1.25, fontWeight: 700,
            letterSpacing: "-0.02em", margin: "0 0 20px",
            color: "rgba(210, 239, 255, 0.95)",
          }}>
            {headline || <>억울한 일을<br />법률문서의 언어로<br />정리해드립니다.</>}
          </h1>

          {subtext && (
            <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.85, margin: "0 0 32px", maxWidth: 440 }}>
              {subtext}
            </p>
          )}

          {features && features.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(255,255,255,.16)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name={f.icon} size={18} color="#fff" />
                  </span>
                  <span style={{ opacity: 0.92 }}>{f.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 선택적 미리보기 카드 */}
          {previewCard && (
            <div style={{ marginTop: 36 }}>
              {previewCard}
            </div>
          )}
        </div>

        {/* 하단 법적 고지 */}
        <div style={{ zIndex: 1, fontSize: 12, opacity: 0.6, lineHeight: 1.6 }}>
          본 서비스가 생성하는 문서는 참고용 초안이며 법적 효력을 보장하지 않습니다.<br />
          © TheGroundMOYO Inc.
        </div>
      </aside>

      {/* ── 우측 폼 패널 ─────────────────────────────────── */}
      <main style={{
        padding: "48px 64px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-neutral-bg-alt)",
        overflowY: "auto",
      }}>
        {/* 로그인/가입 전환 탭 */}
        {activeTab && (
          <div style={{
            display: "flex", gap: 4, padding: 4,
            background: "#fff",
            border: "1px solid var(--color-neutral-stroke-2)",
            borderRadius: 999, width: "fit-content", marginBottom: 24,
          }}>
            {[
              { id: "login",  label: "로그인",  nav: "/login" },
              { id: "signup", label: "회원가입", nav: "/signup" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                data-nav={activeTab !== tab.id ? tab.nav : undefined}
                className="btn btn-sm"
                style={{
                  borderRadius: 999, padding: "0 20px", height: 32,
                  background: activeTab === tab.id ? "var(--brand-rest)" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "var(--color-neutral-fg-3)",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  transition: "all .15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 폼 카드 */}
        {children}
      </main>
    </div>
  );
};