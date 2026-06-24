// dashboard/CaseProgressCard.js — 사건 진행 확장 카드 (PRD v1.2 FR-16)
// 포함: MiniSteps, CaseProgressCard (구 CaseExpandedCard)
// 의존: window.YesNoToggle, window.Badge, window.Icon

// ── 상태 배지 variant 매핑 ────────────────────────────────────
const STATUS_BADGE_VARIANT = {
  "작성중":    "warning",
  "초안생성됨": "info",
  "수정중":    "info",
  "저장완료":  "success",
  "발송완료":  "success",
  "분석중":    "warning",
};

// ── doc type별 Q&A 질문 ───────────────────────────────────────
const CASE_QUESTIONS = {
  "내용증명": [
    "상대방이 답변을 했나요?",
    "내용증명이 반송되었나요?",
    "합의 제안을 받았나요?",
  ],
  "준비서면": [
    "상대방이 답변을 했나요?",
    "현재 소송이 진행 중인가요?",
    "합의 제안을 받았나요?",
  ],
  "상대방 반박문": [
    "상대방이 답변을 했나요?",
    "더 심한 주장을 보냈나요?",
    "합의 제안을 받았나요?",
  ],
};

// ── doc type별 다음 단계 추천 카드 ───────────────────────────
const NEXT_DOCS = {
  "내용증명": [
    { key: "재내용증명",    icon: "mail",     label: "재내용증명",      desc: "기한·요구를 강화해 한 번 더 통지" },
    { key: "상대방 반박문", icon: "shield",   label: "상대방 반박문",   desc: "상대 답변을 분석해 반박 초안 생성", recommended: true },
    { key: "소장/준비서면", icon: "book",     label: "소장 / 준비서면", desc: "소송으로 본격 대응" },
  ],
  "준비서면": [
    { key: "보충 준비서면",  icon: "book",    label: "보충 준비서면",  desc: "추가 주장·증거 보완",          recommended: true },
    { key: "상대방 반박문",  icon: "shield",  label: "상대방 반박문",  desc: "상대 주장에 조목조목 반박" },
    { key: "소장",           icon: "document",label: "소장",           desc: "본안 소송 제기" },
  ],
  "상대방 반박문": [
    { key: "반박문 이어쓰기", icon: "shield",  label: "반박문 이어쓰기", desc: "추가 쟁점을 반영해 반박 보강", recommended: true },
    { key: "준비서면",        icon: "book",    label: "준비서면",        desc: "소송 중 주장·증거 정리" },
    { key: "소장",            icon: "document",label: "소장",            desc: "본안 소송 제기" },
  ],
};
const FALLBACK_NEXT_DOCS = [
  { key: "내용증명",  icon: "mail",    label: "내용증명",  desc: "법적 의사 표시",   recommended: true },
  { key: "준비서면",  icon: "book",    label: "준비서면",  desc: "소송 주장 정리" },
  { key: "소장",      icon: "document",label: "소장",      desc: "소송 제기" },
];

// ── 추천 문서 라벨(한글) → CreateScreen docType(영문) 매핑 (설계 PRD §6.3) ─
// 활성 3종(notice/brief/rebuttal)만 prefill 대상. 소장 등 미지원은 notice 폴백.
const DOC_TYPE_MAP = {
  "재내용증명":      "notice",
  "내용증명":        "notice",
  "상대방 반박문":   "rebuttal",
  "반박문 이어쓰기": "rebuttal",
  "보충 준비서면":   "brief",
  "준비서면":        "brief",
};

// DB status(영문) → MiniSteps step (saved/delivered=4 → 1·2·3 모두 done)
function statusToStep(status) {
  if (status === "saved" || status === "delivered") return 4;
  if (status === "in_review") return 3;
  if (status === "generated") return 2;
  return 1;
}

// ── 카드 헤더용 미니 스텝 인디케이터 ────────────────────────
window.MiniSteps = function MiniSteps({ step }) {
  const steps = ["정보", "초안", "수정·저장"];
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {steps.map((label, i) => {
        const stepNum   = i + 1;
        const isDone    = stepNum < step;
        const isCurrent = stepNum === step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999,
                background: isDone
                  ? "var(--color-status-success-fg)"
                  : isCurrent ? "var(--brand-rest)" : "var(--color-neutral-stroke-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: (isDone || isCurrent) ? "#fff" : "var(--color-neutral-fg-3)",
              }}>
                {isDone ? <Icon name="checkOnly" size={11} color="#fff" /> : stepNum}
              </div>
              <span style={{
                fontSize: 9, whiteSpace: "nowrap",
                color: isCurrent ? "var(--brand-rest)" : "var(--color-neutral-fg-3)",
                fontWeight: isCurrent ? 700 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                width: 24, height: 2, margin: "0 3px", marginBottom: 12,
                background: isDone ? "var(--color-status-success-fg)" : "var(--color-neutral-stroke-2)",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── CaseProgressCard — 사건 확장 카드 (Q&A + 추천 인라인) ────
window.CaseProgressCard = function CaseProgressCard({ doc }) {
  const questions = CASE_QUESTIONS[doc.docType] || [
    "상대방에게서 연락이 있었나요?",
    "소송이 진행 중인가요?",
    "합의 제안을 받았나요?",
  ];
  const nextDocs   = NEXT_DOCS[doc.docType] || FALLBACK_NEXT_DOCS;
  const defaultKey = (nextDocs.find(d => d.recommended) || nextDocs[0]).key;

  const [answers,  setAnswers]  = React.useState([null, null, null]);
  const [selected, setSelected] = React.useState(defaultKey);

  // 추천 로딩 상태 (설계 PRD §6.2): 답변 1개 이상 → 500ms 로딩 → 추천 활성화
  const [recommendLoading, setRecommendLoading] = React.useState(false);
  const [recommendReady,   setRecommendReady]   = React.useState(false);
  const hasAnyAnswer = answers.some(a => a !== null);

  React.useEffect(() => {
    if (hasAnyAnswer && !recommendReady) {
      setRecommendLoading(true);
      const t = setTimeout(() => {
        setRecommendLoading(false);
        setRecommendReady(true);
      }, 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyAnswer]);

  // "선택한 문서 생성하기" → prefill 저장 후 CreateScreen 이동 (설계 PRD §6.3)
  const handleCreate = () => {
    if (!recommendReady) return;
    const inputData = doc.inputData || doc.input_data || {};
    const prefill = {
      docType: DOC_TYPE_MAP[selected] || "notice",
      sender:   inputData.sender   || "",
      receiver: inputData.receiver || "",
      prefillSource: "dashboard_recommendation",
    };
    try {
      sessionStorage.setItem("law_form_prefill", JSON.stringify(prefill));
    } catch (_) {}
    window.location.hash = "/create/1";
  };

  const badgeVariant = STATUS_BADGE_VARIANT[doc.status] || "neutral";
  const miniStep = statusToStep(doc.dbStatus);

  return (
    <div className="card-flat" style={{ padding: 0, overflow: "hidden" }}>
      {/* 카드 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: "1px solid var(--color-neutral-stroke-2)",
        background: "#fff", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 8, background: "var(--brand-light)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name={doc.icon} size={18} color="var(--brand-rest)" />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{doc.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className="doc-chip" style={{ height: 20, fontSize: 11 }}>{doc.docType}</span>
              <span className="muted" style={{ fontSize: 12 }}>{doc.updatedAt}</span>
            </div>
          </div>
        </div>

        {/* 스텝 인디케이터 + 상태 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <MiniSteps step={miniStep} />
          <Badge variant={badgeVariant}>{doc.status}</Badge>
        </div>
      </div>

      {/* 카드 바디 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", background: "var(--color-neutral-bg-alt)" }}>

        {/* 좌: 지금 상황을 알려주세요 */}
        <div style={{ padding: "20px 24px", borderRight: "1px solid var(--color-neutral-stroke-2)" }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "var(--color-neutral-fg-2)",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 16,
          }}>
            <Icon name="chat" size={13} color="var(--brand-rest)" />
            지금 상황을 알려주세요
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: "10px 12px",
              }}>
                <span style={{ fontSize: 13, color: "var(--color-neutral-fg-1)", lineHeight: 1.5, flex: 1 }}>
                  {q}
                </span>
                <YesNoToggle
                  value={answers[i]}
                  onChange={v => setAnswers(a => { const n = [...a]; n[i] = v; return n; })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 우: 다음으로 추천하는 문서 */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "var(--color-neutral-fg-2)", marginBottom: 14,
          }}>
            + 다음으로 추천하는 문서
          </div>
          {!recommendReady ? (
            // 답변 전 안내 / 로딩 (설계 PRD §6.2)
            recommendLoading ? (
              <LoadingState context="list" message="상황에 맞는 문서를 찾는 중..." inline />
            ) : (
              <div style={{
                border: "1px dashed var(--color-neutral-stroke-2)", borderRadius: 10,
                padding: "20px 16px", marginBottom: 14, textAlign: "center",
                fontSize: 12, color: "var(--color-neutral-fg-3)", lineHeight: 1.6,
              }}>
                지금 상황을 알려주세요<br />답변 후 추천됩니다
              </div>
            )
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              {nextDocs.map(nd => {
                const isSel = selected === nd.key;
                return (
                  <button key={nd.key} type="button" onClick={() => setSelected(nd.key)} style={{
                    border: `1.5px solid ${isSel ? "var(--brand-rest)" : "var(--color-neutral-stroke-2)"}`,
                    borderRadius: 10, padding: "12px 10px",
                    background: isSel ? "var(--brand-light)" : "#fff",
                    textAlign: "left", cursor: "pointer",
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 7, marginBottom: 8,
                      background: isSel ? "var(--brand-rest)" : "var(--color-neutral-bg-alt)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name={nd.icon} size={14} color={isSel ? "#fff" : "var(--brand-rest)"} />
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: "var(--color-neutral-fg-1)" }}>
                        {nd.label}
                      </span>
                      {nd.recommended && (
                        <Badge variant="info" style={{ fontSize: 9, padding: "1px 5px", lineHeight: 1.4 }}>추천</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-neutral-fg-3)", lineHeight: 1.4 }}>
                      {nd.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleCreate}
            disabled={!recommendReady}
          >
            선택한 문서 생성하기 <Icon name="arrowR" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
};
