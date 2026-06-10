// help_screen.js — 법률 문서 도움말 (내용증명 발송 5단계 가이드)
// 각 단계는 Closable Panel + 참고 이미지 포함

const POST_STEPS = [
  {
    n: 1,
    t: "내용 작성",
    icon: "docEdit",
    sub: "AI 법률 문서 자동화 서비스에서 초안을 작성하고 .docx 파일을 저장해요.",
    bullets: [
      "문서 종류로 '내용증명'을 선택하고 발신·수신인 정보, 사건 경위, 요구사항을 입력합니다.",
      "AI가 생성한 초안을 확인하고 대화형 수정으로 다듬어 완성합니다.",
      "완성된 문서를 .docx 형식으로 저장해 두면 다음 단계에서 업로드할 수 있어요.",
    ],
    img: "/static/images/help_step1.png",
  },
  {
    n: 2,
    t: "인터넷 우체국 접속",
    icon: "home",
    sub: "service.epost.go.kr 에서 증명서비스 → 내용증명 메뉴로 이동해요.",
    bullets: [
      "주소창에 service.epost.go.kr 을 입력하거나 검색에서 '인터넷 우체국'으로 접속합니다.",
      "상단의 우편 → 증명서비스 → 내용증명 으로 이동합니다.",
      "'내용증명 신청' 탭을 누르고 본인 인증(공동·금융·간편 인증)을 진행합니다.",
    ],
    img: "/static/images/help_step2.png",
  },
  {
    n: 3,
    t: "내용 작성 방법 선택",
    icon: "folder",
    sub: "'문서첨부하기' 또는 '우편직접작성' 중에서 선택해요.",
    bullets: [
      "이미 작성된 .docx 파일이 있으면 '문서첨부하기'를 선택합니다.",
      "사이트에서 직접 입력하고 싶다면 '우편직접작성'을 선택합니다.",
      "권장: AI 법률 문서 자동화 서비스에서 만든 .docx를 첨부하면 작성 시간을 크게 줄일 수 있어요.",
    ],
    img: "/static/images/help_step3.png",
  },
  {
    n: 4,
    t: "내용증명 내용 넣기",
    icon: "document",
    sub: "iFormEditor 화면에서 본문 내용을 입력하거나 첨부한 파일의 내용을 확인해요.",
    bullets: [
      "발신인·수신인 정보가 정확히 입력되었는지 확인합니다.",
      "본문(사실관계 / 요구사항 / 미이행 시 조치)이 단락 단위로 깔끔하게 보이는지 확인합니다.",
      "내용에 수정이 필요하면 우체국 에디터에서 직접 수정하거나, AI 서비스에서 수정 후 재업로드합니다.",
    ],
    img: "/static/images/help_step4.png",
  },
  {
    n: 5,
    t: "미리보기 및 주소 입력",
    icon: "mail",
    sub: "최종 발송 전 양면 미리보기로 확인하고 발송 옵션을 선택해요.",
    bullets: [
      "양면보기 / 페이지 단위로 출력될 모습을 확인합니다.",
      "수신인 주소와 발송 옵션(보통/익일·등기 등)을 입력하고 부수(보통 3부)를 선택합니다.",
      "수수료 결제 후 등기번호가 발급되며, 진행 상태와 배송 결과는 '나의 내용증명'에서 확인할 수 있어요.",
    ],
    img: "/static/images/help_step5.png",
  },
];

window.HelpScreen = function HelpScreen() {
  const [open, setOpen] = React.useState({ 1: true, 2: false, 3: false, 4: false, 5: false });
  const toggle = (n) => setOpen(o => ({ ...o, [n]: !o[n] }));
  const expandAll   = () => setOpen({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const collapseAll = () => setOpen({ 1: false, 2: false, 3: false, 4: false, 5: false });

  return (
    <div className="screen">
      <TopNav active="help" />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 840 }}>

        {/* ── 좌측 사이드바 ───────────────────────────────── */}
        <aside style={{
          borderRight: "1px solid var(--color-neutral-stroke-2)",
          background: "#fff",
          padding: "24px 16px 24px 32px",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            법률 문서 도움말
          </h2>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input className="input" placeholder="용어·문서 검색" style={{ paddingLeft: 32 }} />
            <span style={{ position: "absolute", left: 10, top: 8 }}>
              <Icon name="search" size={16} color="var(--color-neutral-fg-3)" />
            </span>
          </div>

          <div className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 8px 8px" }}>
            문서 종류별 가이드
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {window.DOC_TYPES.map((t, i) => (
              <button
                key={t.id}
                className="gnb-link"
                disabled={t.comingSoon}
                data-nav={t.comingSoon ? undefined : "/help"}
                style={{
                  justifyContent: "flex-start", height: 36, width: "100%", paddingLeft: 8,
                  fontWeight: i === 0 ? 600 : 500,
                  background: i === 0 ? "var(--brand-light)" : "transparent",
                  color: t.comingSoon ? "var(--color-neutral-fg-4)" : i === 0 ? "var(--brand-rest)" : "var(--color-neutral-fg-2)",
                  cursor: t.comingSoon ? "not-allowed" : "pointer",
                  opacity: t.comingSoon ? 0.6 : 1,
                  gap: 8,
                }}
              >
                <Icon name={t.icon} size={14} /> {t.name}
                {t.comingSoon && (
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#FFF4CE", color: "#8A6500", border: "1px solid #F9DEA0", borderRadius: 999 }}>
                    예정
                  </span>
                )}
              </button>
            ))}
          </nav>

          <hr className="divider" style={{ margin: "20px 0" }} />

          <div className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 8px 8px" }}>
            발송 단계
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {POST_STEPS.map(s => (
              <button
                key={s.n}
                type="button"
                onClick={() => { setOpen(o => ({ ...o, [s.n]: true })); setTimeout(() => document.getElementById(`step-${s.n}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                style={{
                  justifyContent: "flex-start", height: 32, width: "100%", paddingLeft: 8,
                  border: 0, background: open[s.n] ? "var(--brand-light)" : "transparent",
                  color: open[s.n] ? "var(--brand-rest)" : "var(--color-neutral-fg-2)",
                  fontWeight: open[s.n] ? 600 : 400, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", borderRadius: 6,
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: 999,
                  background: open[s.n] ? "var(--brand-rest)" : "var(--color-neutral-bg-subtle-3)",
                  color: open[s.n] ? "#fff" : "var(--color-neutral-fg-2)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flex: "none",
                }}>
                  {s.n}
                </span>
                {s.t}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── 본문 ────────────────────────────────────────── */}
        <main style={{ padding: "32px 64px 64px", maxWidth: 960, width: "100%" }}>

          {/* 브레드크럼 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-neutral-fg-3)", marginBottom: 8 }}>
            <span>법률 문서 도움말</span>
            <Icon name="chevronR" size={12} />
            <span style={{ color: "var(--color-neutral-fg-1)", fontWeight: 600 }}>내용증명</span>
          </div>

          {/* 제목 + 설명 */}
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>내용증명</h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--color-neutral-fg-2)", margin: "0 0 24px", maxWidth: 720 }}>
            <b>내용증명</b>은 발신인이 수신인에게 어떤 의사표시(독촉·해지·통지)를 했는지를 <b>우체국이 공적으로 증명</b>해 주는 우편 제도입니다.
            법적 강제력 자체는 없지만, 후속 소송에서 "통지가 있었다"는 증거로 활용되며, 상대방의 자발적 이행을 유도하는 효과가 있어요.
          </p>

          {/* CTA 버튼 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            <button className="btn btn-primary" data-nav="/create/1">
              <Icon name="sparkle" size={14} color="#fff" filled /> 이 문서 만들기
            </button>
          </div>

          {/* 활용 상황 / 주의사항 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
            <div className="card-flat" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="check" size={18} color="var(--color-status-success-fg)" filled /> 이런 상황에 적합해요
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.9, color: "var(--color-neutral-fg-2)" }}>
                <li>거래처 미수금·차용금 등 <b>금전 채권 독촉</b></li>
                <li>임대차·서비스 등 <b>계약 해지 통지</b></li>
                <li>약정 불이행에 대한 <b>이행 촉구</b></li>
                <li>소멸시효 중단을 위한 <b>사전 통지</b></li>
              </ul>
            </div>
            <div className="card-flat" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="dismiss" size={18} color="var(--color-status-danger-fg)" /> 이런 점을 주의하세요
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.9, color: "var(--color-neutral-fg-2)" }}>
                <li>내용증명 자체에는 <b>강제 집행력</b>이 없습니다</li>
                <li>지급 기한은 도달 시간을 고려해 <b>10일 이상</b> 권장</li>
                <li>모욕·협박성 표현은 명예훼손 위험이 있어요</li>
                <li><b>3부를 작성</b>: 발신인·수신인·우체국 보관 각 1부</li>
              </ul>
            </div>
          </div>

          {/* 발송 단계 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>인터넷 우체국 발송 단계</h2>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                AI 법률 문서 자동화 서비스에서 초안을 만든 후, 인터넷 우체국에서 발송하는 과정을 단계별로 안내합니다.
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-sm btn-secondary" onClick={expandAll}>모두 열기</button>
              <button className="btn btn-sm btn-secondary" onClick={collapseAll}>모두 닫기</button>
            </div>
          </div>

          {/* Closable Panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {POST_STEPS.map(s => {
              const isOpen = !!open[s.n];
              return (
                <div key={s.n} id={`step-${s.n}`} className="card-flat" style={{ padding: 0, overflow: "hidden" }}>

                  {/* 패널 헤더 (클릭하면 토글) */}
                  <button
                    type="button"
                    onClick={() => toggle(s.n)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%", border: 0,
                      background: isOpen ? "var(--brand-light)" : "#fff",
                      padding: "16px 20px", cursor: "pointer",
                      display: "grid",
                      gridTemplateColumns: "40px 36px 1fr auto",
                      gap: 16, alignItems: "center", textAlign: "left",
                    }}
                  >
                    {/* 단계 번호 */}
                    <span style={{
                      width: 32, height: 32, borderRadius: 999,
                      background: isOpen ? "var(--brand-rest)" : "var(--color-neutral-fg-3)",
                      color: "#fff", display: "inline-flex", alignItems: "center",
                      justifyContent: "center", fontWeight: 700, fontSize: 14,
                    }}>
                      {s.n}
                    </span>
                    {/* 아이콘 */}
                    <span style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: isOpen ? "#fff" : "var(--color-neutral-bg-subtle)",
                      color: "var(--brand-rest)", display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                      border: "1px solid var(--brand-light-2)",
                    }}>
                      <Icon name={s.icon} size={18} />
                    </span>
                    {/* 제목 + 부제 */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-neutral-fg-1)" }}>{s.t}</div>
                      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{s.sub}</div>
                    </div>
                    {/* 접기/펼치기 화살표 */}
                    <span style={{
                      width: 32, height: 32, borderRadius: 6,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      color: "var(--color-neutral-fg-2)",
                      transition: "transform .2s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}>
                      <Icon name="chevronD" size={20} />
                    </span>
                  </button>

                  {/* 패널 본문 (열렸을 때만 표시) */}
                  {isOpen && (
                    <div style={{ padding: "20px 24px 28px", borderTop: "1px solid var(--brand-light-2)" }}>

                      {/* 참고 이미지 */}
                      <figure style={{
                        margin: "0 0 20px",
                        background: "var(--color-neutral-bg-alt)",
                        border: "1px solid var(--color-neutral-stroke-2)",
                        borderRadius: 12,
                        padding: 16,
                      }}>
                        <img
                          src={s.img}
                          alt={`STEP ${s.n} · ${s.t} 화면 예시`}
                          style={{
                            display: "block", width: "100%", height: "auto",
                            borderRadius: 6, background: "#fff",
                            boxShadow: "var(--shadow-4)",
                          }}
                          loading="lazy"
                        />
                        <figcaption style={{ marginTop: 10, fontSize: 12, color: "var(--color-neutral-fg-3)", textAlign: "center" }}>
                          STEP {s.n} · {s.t} 화면 예시
                        </figcaption>
                      </figure>

                      {/* 안내 항목 */}
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: "var(--color-neutral-fg-1)" }}>
                        {s.bullets.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 하단 안내 */}
          <Alert type="info" style={{ marginTop: 32 }}>
            <b>법률 전문가 검토를 권장합니다</b><br />
            <span style={{ fontSize: 13 }}>
              AI가 생성한 문서는 참고용 초안입니다. 실제 발송·제출 전 변호사 등 전문가의 검토를 받으시면 더욱 안전합니다.
            </span>
          </Alert>
        </main>
      </div>
      <LegalNotice />
      <SiteFooter />
    </div>
  );
};
