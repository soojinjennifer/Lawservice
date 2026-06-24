// dashboard_screen.js — 홈 대시보드 (로그인 상태, PRD v1.2 FR-16)
// 공통 컴포넌트: window.YesNoToggle, window.MiniSteps, window.CaseProgressCard,
//               window.LoadingState, window.EmptyState
//               (dashboard/CaseProgressCard.js, feedback/* 에서 로드)
// 데이터: GET /api/documents (window.LawAPI.documents) — 설계 PRD §6

// ── DB doc_type(영문) → CaseProgressCard 표시용 메타 매핑 ─────
// CaseProgressCard 내부 CASE_QUESTIONS/NEXT_DOCS 는 한글 docType 키를 쓰므로 변환.
const DASHBOARD_DOC_META = {
  notice:   { docType: "내용증명",     icon: "mail" },
  brief:    { docType: "준비서면",     icon: "book" },
  rebuttal: { docType: "상대방 반박문", icon: "shield" },
};

// DB status(영문) → 표시 라벨(한글, STATUS_BADGE_VARIANT 키와 정합)
const DASHBOARD_STATUS_LABEL = {
  draft:     "작성중",
  generated: "초안생성됨",
  in_review: "수정중",
  saved:     "저장완료",
  delivered: "발송완료",
};

// DB row → CaseProgressCard 가 기대하는 doc 형태로 변환
function toCaseDoc(row) {
  const meta = DASHBOARD_DOC_META[row.doc_type] || DASHBOARD_DOC_META.notice;
  return {
    id:         row.id,
    docId:      row.id,
    title:      row.title || "(제목 없음)",
    docType:    meta.docType,
    icon:       meta.icon,
    status:     DASHBOARD_STATUS_LABEL[row.status] || "작성중",
    dbStatus:   row.status,          // statusToStep() 계산용
    updatedAt:  (row.updated_at || "").slice(0, 10),
    inputData:  row.input_data || null,
  };
}


// ── DashboardScreen ──────────────────────────────────────────
window.DashboardScreen = function DashboardScreen() {
  const [cases,   setCases]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    window.LawAPI.documents
      .list({ perPage: 50, sort: "updated_at:desc" })
      .then((res) => {
        if (!alive) return;
        const docs = res.items || [];
        // doc_type 별 최신 2건 groupBy (설계 PRD §6.1)
        const grouped = {};
        docs.forEach((doc) => {
          if (!grouped[doc.doc_type]) grouped[doc.doc_type] = [];
          if (grouped[doc.doc_type].length < 2) grouped[doc.doc_type].push(doc);
        });
        const flat = Object.values(grouped).flat().map(toCaseDoc);
        setCases(flat);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setCases([]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  return (
    <div className="screen">
      <TopNav active="home" />

      {/* ── 1. Hero ─────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 96px 96px",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: 64,
        alignItems: "center",
      }}>
        <div>
          <Badge variant="info" icon="sparkle" style={{ marginBottom: 20 }}>
            AI 기반 · 내 편이 되어주는 법률문서
          </Badge>

          <h1 style={{
            fontSize: 52, lineHeight: 1.1, fontWeight: 700,
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
            여러분의 언어로 털어놓은 억울한 일을 AI가 참고용 법률 문서 초안으로 만들고,
            제출 전 확인할 항목까지 안내해 드려요. 변호사 사무실에 가기 전, 내 사건을
            가장 잘 아는 내가 직접 준비하세요.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            <Btn variant="primary" size="xl" icon="arrowR" iconPos="right" dataNav="/create/1">
              내편문서 만들기
            </Btn>
            <Btn variant="secondary" size="xl" icon="document" dataNav="/help">
              사용 예시 보기
            </Btn>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-neutral-fg-3)" }}>
            {[
              { icon: "checkOnly", text: "내용증명 1건 무료 체험" },
              { icon: "checkOnly", text: "구독 없이 건별 결제" },
              { icon: "checkOnly", text: ".docx 저장" },
            ].map((item, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name={item.icon} size={14} color="var(--brand-rest)" />
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* Hero 우측: 문서 미리보기 카드 + AI 어시스턴트 카드 */}
        <div style={{ position: "relative", height: 420 }}>
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

          <Card style={{
            position: "absolute", bottom: 20, right: -20,
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

      {/* ── 2. 공감 섹션 ────────────────────────────────────────── */}
      <EmpathySection
        cta={
          <Btn variant="primary" size="xl" icon="arrowR" iconPos="right" iconColor="var(--brand-rest)"
            dataNav="/create/1" style={{ background: "#fff", color: "var(--brand-rest)" }}>
            내편문서 만들기
          </Btn>
        }
      />

      {/* ── 3. 지원 문서 ────────────────────────────────────────── */}
      <section style={{
        padding: "80px 96px",
        background: "#fff",
        borderTop: "1px solid var(--color-neutral-stroke-2)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <Badge variant="neutral" style={{ marginBottom: 12 }}>지원 문서</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              만들 수 있는 문서, 클릭하면 바로 시작돼요
            </h2>
          </div>
          <button className="btn btn-subtle btn-sm" data-nav="/create/1">
            전체 보기 <Icon name="chevronR" size={12} />
          </button>
        </div>
        <DocumentTypePicker
          value={null}
          onChange={() => { window.location.hash = "/create/1"; }}
          withPrice
        />
      </section>

      {/* ── 4. 나의 진행 현황 ───────────────────────────────────── */}
      <section style={{ padding: "60px 96px", background: "var(--color-neutral-bg-alt)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
              color: "var(--color-neutral-fg-3)", marginBottom: 6,
            }}>
              나의 진행 현황
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              진행 중인 사건, 다음 단계를 이어가세요
            </h2>
          </div>
          <button className="btn btn-subtle btn-sm" data-nav="/mydocs">
            전체 문서 보기 <Icon name="chevronR" size={12} />
          </button>
        </div>
        {loading ? (
          <LoadingState context="list" message="진행 중인 사건을 불러오는 중..." />
        ) : cases.length === 0 ? (
          <EmptyState
            context="list"
            message="아직 생성한 문서가 없습니다."
            actionLabel="내편문서 만들기"
            onAction={() => { window.location.hash = "/create/1"; }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {cases.map(doc => (
              <CaseProgressCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>

      <LegalNotice />
      <SiteFooter />
    </div>
  );
};
