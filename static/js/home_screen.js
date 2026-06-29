// home_screen.js — 홈 랜딩 화면 (PRD v1.2 §6.3)
// 공통 컴포넌트: TopNav · Btn · Badge · EmpathySection · DocumentTypePicker
//               PaymentCardGrid · LegalNotice · SiteFooter

window.HomeScreen = function HomeScreen() {
  // 활용 방법 3단계
  const HOW_STEPS = [
    {
      icon: "timeline",
      title: "사건 입력 + 증거 업로드",
      desc: "기억나는 사건을 시간순으로 입력하고, 카카오톡·계약서·입금내역을 업로드하면 AI가 경위를 자동 정리합니다.",
      badge: "STEP 1",
    },
    {
      icon: "document",
      title: "나의 주장 + 상대방 분석",
      desc: "내 주장과 증거를 연결하고, 상대방 문서에서 핵심 주장·반박 쟁점을 자동으로 추출합니다.",
      badge: "STEP 2",
    },
    {
      icon: "sparkle",
      title: "초안 생성 + 수정 + 저장",
      desc: "AI가 법률 양식에 맞는 초안을 생성하고, 대화로 다듬어 .docx 파일로 저장합니다.",
      badge: "STEP 3",
    },
  ];

  return (
    <div className="screen">
      <TopNav active="home" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="screen-section" style={{
        paddingTop: 80, paddingBottom: 96,
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: 64,
        alignItems: "center",
      }}>
        <div>
          <Badge variant="info" icon="sparkle" style={{ marginBottom: 20 }}>
            Claude AI 기반 초안 생성
          </Badge>

          <h1 style={{
            fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.1, fontWeight: 700,
            letterSpacing: "-0.03em", margin: "0 0 16px",
          }}>
            억울한 일을<br />
            <span style={{ color: "var(--brand-rest)" }}>법률문서의 언어</span>로<br />
            정리해드립니다.
          </h1>

          <p style={{
            fontSize: 16, lineHeight: 1.7,
            color: "var(--color-neutral-fg-2)",
            margin: "0 0 32px", maxWidth: 480,
          }}>
            사건의 시간적 흐름, 상대방 주장과 내 주장, 내 증거를 정리하여<br />
            나홀로 내용증명을 보내거나,<br />
            변호사에게 가져가기 좋은 사건 정리와 문서 초안을 만들어 드립니다.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            <Btn variant="primary" size="xl" icon="arrowR" iconPos="right" dataNav="/signup">
              법률문서 만들어보기
            </Btn>
            <Btn variant="secondary" size="xl" icon="document" dataNav="/help">
              사용 예시 보기
            </Btn>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-neutral-fg-3)" }}>
            {[
              { icon: "checkOnly", text: "내용증명 1건 무료" },
              { icon: "checkOnly", text: "수정 3회 무료" },
              { icon: "checkOnly", text: ".docx 저장" },
            ].map((item, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name={item.icon} size={14} color="var(--brand-rest)" />
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Hero 시각: 문서 미리보기 카드 */}
        <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
          <CardFlat style={{
            position: "absolute", inset: "20px 40px 20px 0",
            fontFamily: "var(--font-family-serif)",
            fontSize: 11, lineHeight: 1.7, overflow: "hidden",
            padding: "28px 32px",
          }}>
            <div style={{ textAlign: "center", fontFamily: "var(--font-family-base)",
              fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              내 용 증 명
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", rowGap: 3,
              fontSize: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
              <span style={{ color: "var(--color-neutral-fg-3)" }}>발신인</span>
              <span>김○○ (서울시 강남구 테헤란로 152)</span>
              <span style={{ color: "var(--color-neutral-fg-3)" }}>수신인</span>
              <span>(주)미지급상사 대표이사 박○○</span>
              <span style={{ color: "var(--color-neutral-fg-3)" }}>제 목</span>
              <span>물품대금 12,400,000원 지급 독촉의 건</span>
            </div>
            <p style={{ margin: "0 0 8px" }}>1. 귀사의 무궁한 발전을 기원합니다.</p>
            <p style={{ margin: "0 0 8px" }}>
              2. 발신인은 2025년 11월 15일 귀사와 가공식품 납품 계약을 체결하고,
              같은 해 11월 28일 물품 1,200kg 전량을 납품 완료하였습니다.
              약정 대금 금 일천이백사십만원(₩12,400,000)의 지급기일은 2025년 12월 15일이었습니다.
            </p>
            <p style={{ margin: 0, opacity: 0.5 }}>3. 그러나 약정 지급기일이 경과한 현재까지…</p>
          </CardFlat>

          {/* AI 수정 채팅 미니 카드 */}
          <Card style={{
            position: "absolute", bottom: 20, right: 0,
            width: 200, padding: 14,
            background: "var(--brand-light)",
            border: "1px solid var(--brand-light-2)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-rest)", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="sparkle" size={12} color="var(--brand-rest)" filled /> AI 어시스턴트
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: "var(--color-neutral-fg-2)" }}>
              지급 기한을 7일로 단축하고 어조를 강하게 수정했어요.
            </div>
          </Card>
        </div>
      </section>

      {/* ── 공감 섹션 (EmpathySection) ──────────────────────── */}
      <EmpathySection
        cta={
          <Btn variant="primary" size="xl" icon="arrowR" iconPos="right" iconColor="var(--brand-rest)" dataNav="/signup"
            style={{ background: "#fff", color: "var(--brand-rest)" }}>
            법률문서 만들어보기
          </Btn>
        }
      />

      {/* ── 활용 방법 ─────────────────────────────────────────── */}
      <section className="screen-section" style={{ paddingTop: 80, paddingBottom: 80, background: "var(--color-neutral-bg-alt)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge variant="neutral" style={{ marginBottom: 12 }}>어떻게 사용하나요?</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            3단계로 법률 문서 완성
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-neutral-fg-3)", margin: 0 }}>
            법률 지식이 없어도 괜찮아요. 기억나는 사건을 말하듯 입력하면 됩니다.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {HOW_STEPS.map((s, i) => (
            <CardFlat key={i} padding={32}>
              <span style={{
                display: "inline-block", marginBottom: 16,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                color: "var(--brand-rest)", background: "var(--brand-light)",
                padding: "4px 10px", borderRadius: 999,
              }}>
                {s.badge}
              </span>
              <div style={{ marginBottom: 12 }}>
                <Icon name={s.icon} size={28} color="var(--brand-rest)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-neutral-fg-3)", margin: 0 }}>
                {s.desc}
              </p>
            </CardFlat>
          ))}
        </div>
      </section>

      {/* ── 문서 종류 ─────────────────────────────────────────── */}
      <section className="screen-section" style={{
        paddingTop: 80, paddingBottom: 80,
        background: "#fff",
        borderTop: "1px solid var(--color-neutral-stroke-2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Badge variant="neutral" style={{ marginBottom: 12 }}>지원 문서</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            어떤 문서가 필요하세요?
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-neutral-fg-3)", margin: 0 }}>
            내용증명 · 상대방 반박문 · 준비서면 즉시 생성 — 소견서·항소이유서는 v2.0 예정
          </p>
        </div>
        <DocumentTypePicker
          value={null}
          onChange={id => { window.location.hash = "/create/1"; }}
          withPrice
        />
      </section>

      {/* ── 요금제 (건별 결제) ─────────────────────────────── */}
      <section className="screen-section" style={{ paddingTop: 80, paddingBottom: 80, background: "var(--color-neutral-bg-alt)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge variant="neutral" style={{ marginBottom: 12 }}>요금제</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            필요한 문서만, 건별로 구매
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-neutral-fg-3)", margin: "0 0 8px" }}>
            구독 없이 필요할 때만. 첫 내용증명은 무료로 시작하세요.
          </p>
        </div>
        <PaymentCardGrid />
      </section>

      {/* ── 법적 고지 (대시보드·마이페이지와 동일 규칙: 푸터 바로 위 풀폭) ── */}
      <div className="screen-section"><LegalNotice /></div>

      {/* ── 사이트 푸터 ────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
};
