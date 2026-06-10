// document/OpponentDocAnalysis.js — 상대방 문서 분석 섹션 (PRD v1.2 FR-18, 19)
// 반박문(rebuttal) 전용 섹션
// 구성: [상대방 문서 종류 select] + [파일 업로드] + [분석하기 버튼]
// 결과: OpponentClaimItem 목록 + RebuttalSuggestionTextarea

// 샘플 분석 결과 (실제 API 연동 전 목업)
const MOCK_OPPONENT_CLAIMS = [
  {
    claim: "원고는 계약 기간 내 납품을 완료하였으나 피고가 검수를 일방적으로 지연하였다.",
    rebuttal: "납품 완료 여부는 당사자 간 확인서가 없으며, 검수 지연은 원고 측 하자 발견에 따른 정당한 절차였음을 주장합니다.",
    riskLevel: "normal",
  },
  {
    claim: "피고는 계약서 제8조에 따라 지체상금을 지급할 의무가 있다.",
    rebuttal: "제8조의 적용 요건인 '검수 완료 확인서' 수령이 이루어지지 않았으므로, 지체상금 조항은 발동되지 않습니다.",
    riskLevel: "caution",
  },
  {
    claim: "피고의 대금 미지급으로 원고에게 상당한 영업 손해가 발생하였다.",
    rebuttal: "손해액 산정 근거가 불명확하며, 원고 측이 제시한 매출 손실액은 직접 인과관계가 인정되지 않습니다.",
    riskLevel: "normal",
  },
];

// ── OpponentClaimItem ────────────────────────────────────────
function OpponentClaimItem({ claim, rebuttal, riskLevel, checked, onToggle }) {
  const isCaution = riskLevel === "caution";
  return (
    <div style={{
      border: `1px solid ${isCaution ? "#FBBF24" : "var(--color-neutral-stroke-2)"}`,
      borderRadius: 10,
      padding: "16px 18px",
      background: isCaution ? "#FFFBEB" : "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          style={{ width: 16, height: 16, marginTop: 3, accentColor: "var(--brand-rest)", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          {/* 상대방 주장 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {isCaution && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#92400E",
                background: "#FDE68A", padding: "2px 8px", borderRadius: 999,
              }}>
                ⚠ 인정 주의
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-neutral-fg-3)", letterSpacing: "0.04em" }}>
              상대방 주장
            </span>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-fg-1)" }}>
            {claim}
          </p>

          {/* AI 반박 초안 */}
          <div style={{
            borderTop: "1px solid var(--color-neutral-stroke-2)",
            paddingTop: 10, marginTop: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-rest)", letterSpacing: "0.04em", marginBottom: 6 }}>
              <Icon name="sparkle" size={11} color="var(--brand-rest)" filled /> AI 반박 초안
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--color-neutral-fg-2)" }}>
              {rebuttal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RebuttalSuggestionTextarea ───────────────────────────────
function RebuttalSuggestionTextarea({ value, onChange }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 14, fontWeight: 700, marginBottom: 8,
        color: "var(--color-neutral-fg-1)",
      }}>
        <Icon name="sparkle" size={15} color="var(--brand-rest)" filled />
        AI가 추천하는 반박 주장 내용
      </label>
      <textarea
        className="textarea"
        rows={6}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ fontFamily: "inherit" }}
      />
      <div className="field-help">
        선택한 반박 항목을 바탕으로 AI가 정리한 초안입니다. 직접 수정하실 수 있어요.
      </div>
    </div>
  );
}

// ── OpponentDocAnalysis ──────────────────────────────────────
window.OpponentDocAnalysis = function OpponentDocAnalysis({ onRebuttalChange }) {
  const [docKind,   setDocKind]   = React.useState("");
  const [file,      setFile]      = React.useState(null);
  const [state,     setState]     = React.useState("idle"); // idle | file-ready | analyzing | done
  const [claims,    setClaims]    = React.useState([]);
  const [checked,   setChecked]   = React.useState({});
  const [suggestion, setSuggestion] = React.useState("");
  const fileRef = React.useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setState("file-ready");
    e.target.value = "";
  };

  const handleAnalyze = () => {
    if (!file) return;
    setState("analyzing");

    // 실제 API 연동 시: POST /api/analyze_opponent
    // 목업: 1.5초 후 샘플 결과 반환
    setTimeout(() => {
      const initialChecked = {};
      MOCK_OPPONENT_CLAIMS.forEach((_, i) => { initialChecked[i] = true; });
      setClaims(MOCK_OPPONENT_CLAIMS);
      setChecked(initialChecked);
      const draft = MOCK_OPPONENT_CLAIMS
        .map(c => c.rebuttal)
        .join("\n\n");
      setSuggestion(draft);
      if (onRebuttalChange) onRebuttalChange(draft);
      setState("done");
    }, 1500);
  };

  const toggleClaim = (i) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    // 선택된 항목만으로 제안 텍스트 재구성
    const draft = claims
      .filter((_, idx) => next[idx])
      .map(c => c.rebuttal)
      .join("\n\n");
    setSuggestion(draft);
    if (onRebuttalChange) onRebuttalChange(draft);
  };

  const handleSuggestionChange = (val) => {
    setSuggestion(val);
    if (onRebuttalChange) onRebuttalChange(val);
  };

  return (
    <div>
      {/* 상대방 문서 업로드 행 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <select
          className="input"
          value={docKind}
          onChange={e => setDocKind(e.target.value)}
          style={{ maxWidth: 200, flexShrink: 0 }}
        >
          <option value="">상대방 문서 종류 선택</option>
          <option value="notice">내용증명</option>
          <option value="complaint">소장</option>
          <option value="brief">준비서면</option>
          <option value="ruling">판결문</option>
          <option value="other">기타</option>
        </select>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, border: "1px dashed var(--color-neutral-stroke-2)",
            borderRadius: 8, padding: "9px 14px",
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", background: "var(--color-neutral-bg-alt)",
            fontSize: 13, color: "var(--color-neutral-fg-2)",
          }}
        >
          <Icon name="attachment" size={15} color="var(--color-neutral-fg-3)" />
          {file ? (
            <span style={{ fontWeight: 600, color: "var(--color-neutral-fg-1)" }}>{file.name}</span>
          ) : (
            <span>상대방 문서 파일 선택 (PDF · 이미지)</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <button
          className={`btn btn-primary${state === "analyzing" ? " btn-loading" : ""}`}
          onClick={handleAnalyze}
          disabled={!file || state === "analyzing"}
          style={{ flexShrink: 0 }}
        >
          {state === "analyzing" ? (
            <>분석 중...</>
          ) : (
            <><Icon name="sparkle" size={14} color="#fff" filled /> 분석하기</>
          )}
        </button>
      </div>

      {/* 분석 중 상태 */}
      {state === "analyzing" && (
        <div style={{
          padding: 20, borderRadius: 10, textAlign: "center",
          background: "var(--brand-light)", color: "var(--brand-rest)",
        }}>
          <Icon name="sparkle" size={20} color="var(--brand-rest)" filled />
          <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>상대방 문서를 분석하고 있습니다...</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>주요 주장을 추출하고 반박 초안을 생성합니다</div>
        </div>
      )}

      {/* 분석 완료 결과 */}
      {state === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, color: "var(--color-status-success-fg)",
          }}>
            <Icon name="checkOnly" size={15} color="var(--color-status-success-fg)" />
            분석 완료 — 반박할 항목을 선택하세요
          </div>

          {claims.map((c, i) => (
            <OpponentClaimItem
              key={i}
              claim={c.claim}
              rebuttal={c.rebuttal}
              riskLevel={c.riskLevel}
              checked={!!checked[i]}
              onToggle={() => toggleClaim(i)}
            />
          ))}

          <hr className="divider" style={{ margin: "4px 0" }} />

          <RebuttalSuggestionTextarea
            value={suggestion}
            onChange={handleSuggestionChange}
          />
        </div>
      )}
    </div>
  );
};
