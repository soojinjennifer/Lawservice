// create_screen.js — 문서 생성 화면 (3단계: 입력 → 미리보기 → 수정·저장)
// 실제 /api/generate, /api/revise, /api/download_docx 백엔드 연동

// ── RiskResultChatMsg — 채팅 패널 내 위험문장 검사 결과 렌더러 ──
function RiskResultChatMsg({ warnings, msgIndex, onApply, onDismiss }) {
  const visible = warnings.filter(w => !w.dismissed);
  return (
    <div style={{
      background: "var(--color-status-warning-bg, #FFF7ED)",
      border: "1px solid var(--color-status-warning-fg, #D97706)",
      borderRadius: 12,
      padding: "14px 16px",
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: "var(--color-status-warning-fg, #D97706)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="shield" size={14} color="var(--color-status-warning-fg, #D97706)" />
        위험 문장 검사 결과 · {visible.length}건 발견
      </div>
      {warnings.map((w, wi) => {
        if (w.dismissed) return null;
        return (
          <div key={wi} style={{
            background: "#fff",
            border: "1px solid rgba(217,119,6,0.20)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: wi < warnings.length - 1 ? 8 : 0,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-neutral-fg-1)" }}>
              "{w.original}"
            </div>
            <div style={{ color: "#D97706", fontSize: 12, marginBottom: 4 }}>사유: {w.reason}</div>
            <div style={{ color: "var(--brand-rest)", fontSize: 12, marginBottom: w.applied ? 0 : 10 }}>
              제안: {w.suggestion}
            </div>
            {w.applied ? (
              <div style={{ fontSize: 12, color: "var(--color-status-success-fg)", fontWeight: 600 }}>
                ✓ 수정 적용됨
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => onApply(msgIndex, wi)}>
                  제안대로 수정
                </button>
                <button className="btn btn-subtle btn-sm" onClick={() => onDismiss(msgIndex, wi)}>
                  그대로 두기
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 문서 종류별 타임라인 샘플 (입력 힌트용) ─────────────────────
const SAMPLE_TIMELINE = {
  notice:   [{ date: "2025-11-15", event: "물품 납품 계약 체결" },
             { date: "2025-11-28", event: "물품 납품 완료" },
             { date: "2025-12-15", event: "약정 지급기일 경과, 미입금" }],
  appeal:   [{ date: "2025-08-01", event: "1심 판결 선고 (청구 기각)" }],
  brief:    [{ date: "2025-09-12", event: "매매계약 체결" },
             { date: "2026-01-20", event: "잔금 미지급" }],
  appeal:   [{ date: "2025-06-10", event: "1심 변론 종결" },
             { date: "2025-08-22", event: "1심 판결 선고 (청구 기각)" }],
  contract: [],
};

// ── 임시 저장 스토리지 키 ────────────────────────────────────
const DRAFT_STORAGE_KEY = "law_form_draft";

function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)) || null; }
  catch { return null; }
}

// ── STEP 1: 정보 입력 폼 ──────────────────────────────────────
function StepInput({ docType, setDocType, onSubmit }) {
  const saved = loadDraft();

  const [senderName,    setSenderName]    = React.useState(saved?.senderName    ?? "");
  const [senderAddr,    setSenderAddr]    = React.useState(saved?.senderAddr    ?? "");
  const [senderPhone,   setSenderPhone]   = React.useState(saved?.senderPhone   ?? "");
  const [receiverName,  setReceiverName]  = React.useState(saved?.receiverName  ?? "");
  const [receiverAddr,  setReceiverAddr]  = React.useState(saved?.receiverAddr  ?? "");
  const [receiverPhone, setReceiverPhone] = React.useState(saved?.receiverPhone ?? "");
  const [court,         setCourt]         = React.useState(saved?.court         ?? "");
  const [caseNum,       setCaseNum]       = React.useState(saved?.caseNum       ?? "");
  const [caseName,      setCaseName]      = React.useState(saved?.caseName      ?? "");
  const [timeline,      setTimeline]      = React.useState(
    saved?.timeline ?? SAMPLE_TIMELINE[docType] ?? []
  );
  const [facts,         setFacts]         = React.useState(saved?.facts   ?? "");
  const [request,       setRequest]       = React.useState(saved?.request ?? "");
  const [error,         setError]         = React.useState("");
  const [evidenceFiles, setEvidenceFiles] = React.useState([]);
  const [rebuttalDraft, setRebuttalDraft] = React.useState("");

  // 저장된 데이터가 있으면 docType도 복원
  React.useEffect(() => {
    if (saved?.docType && saved.docType !== docType) {
      setDocType(saved.docType);
    }
  }, []);

  // docType이 바뀌었을 때: 저장된 타임라인이 같은 docType이면 유지, 아니면 샘플로 교체
  const prevDocTypeRef = React.useRef(docType);
  React.useEffect(() => {
    if (prevDocTypeRef.current === docType) return;
    prevDocTypeRef.current = docType;
    const cur = loadDraft();
    if (cur?.docType === docType && cur?.timeline) {
      setTimeline(cur.timeline);
    } else {
      setTimeline(SAMPLE_TIMELINE[docType] || []);
    }
  }, [docType]);

  const addRow    = () => setTimeline(tl => [...tl, { date: "", event: "" }]);
  const removeRow = (i) => setTimeline(tl => tl.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setTimeline(tl => tl.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // 증거 파일 업로드 핸들러 (FR-17)
  const handleEvidenceUpload = (fileList) => {
    const newFiles = fileList.map(f => ({ name: f.name, status: "uploading", extractedDate: null }));
    setEvidenceFiles(prev => {
      const next = [...prev, ...newFiles];
      // 실제 API: POST /api/upload_evidence
      // 목업: 1초 후 "done" 상태 + 샘플 날짜 추출
      const startIdx = prev.length;
      setTimeout(() => {
        setEvidenceFiles(cur => cur.map((ef, i) => {
          if (i >= startIdx && ef.status === "uploading") {
            return { ...ef, status: "done", extractedDate: "2026-05-15" };
          }
          return ef;
        }));
      }, 1000);
      return next;
    });
  };
  const handleEvidenceRemove = (i) => setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i));

  // 임시 저장 핸들러 — Toast 컴포넌트로 알림
  const handleTempSave = () => {
    const data = {
      docType, senderName, senderAddr, senderPhone,
      receiverName, receiverAddr, receiverPhone,
      court, caseNum, caseName, timeline, facts, request,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    if (window.ToastManager) {
      window.ToastManager.show({
        type: "success",
        message: "입력 내용이 임시 저장되었습니다. (브라우저 닫기 전까지 유지)",
        duration: 2500,
      });
    }
  };

  const handleSubmit = () => {
    if (!facts.trim()) {
      setError("사건 경위·핵심 내용은 필수입니다.");
      return;
    }
    setError("");
    const sender   = [senderName, senderAddr, senderPhone].filter(Boolean).join(" / ");
    const receiver = [receiverName, receiverAddr, receiverPhone].filter(Boolean).join(" / ");
    const caseInfo = [court, caseNum, caseName].filter(Boolean).join(" ");
    onSubmit({
      docType, sender, receiver, caseInfo,
      timelineEvents: timeline.filter(r => r.date || r.event).map(r => ({ time: r.date, content: r.event })),
      facts, request,
    });
  };

  const needsCase = docType === "brief" || docType === "appeal";
  const meta = DocTypeMeta(docType);

  return (
    <div className="create-pane-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 className="section-title">문서 정보 입력</h2>
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
            아래 항목을 채우면 AI가 형식에 맞춰 초안을 만들어 드립니다.
            필수 항목은 <span style={{ color: "var(--color-status-danger-fg)" }}>*</span>로 표시되어 있어요.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loadDraft() && (
            <span style={{ fontSize: 12, color: "var(--color-neutral-fg-3)" }}>
              <Icon name="clock" size={13} color="var(--color-neutral-fg-3)" /> 임시 저장 복원됨
            </span>
          )}
          <button className="btn btn-secondary" onClick={handleTempSave}>
            <Icon name="save" size={14} /> 임시 저장
          </button>
        </div>
      </div>

      {/* ① 문서 종류 */}
      <section style={{ marginBottom: 32 }}>
        <div className="field-label" style={{ fontSize: 14, marginBottom: 12 }}>
          ① 어떤 문서를 만들까요? <span className="req">*</span>
        </div>
        <DocTypePicker value={docType} onChange={setDocType} withPrice={true} />
      </section>

      <hr className="divider" style={{ margin: "0 0 24px" }} />

      {/* ② 발신인 / ③ 수신인 */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>②</span>
            발신인 정보 <span className="req">*</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label className="field-label">성명 / 법인명</label>
              <input className="input" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="홍길동 / (주)○○○" />
            </div>
            <div className="field">
              <label className="field-label">주소</label>
              <input className="input" value={senderAddr} onChange={e => setSenderAddr(e.target.value)} placeholder="서울특별시 ○○구 ○○로 ○○" />
            </div>
            <div className="field">
              <label className="field-label">연락처</label>
              <input className="input" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>③</span>
            수신인 정보 <span className="req">*</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label className="field-label">성명 / 법인명</label>
              <input className="input" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="(주)○○○ 대표이사 ○○○" />
            </div>
            <div className="field">
              <label className="field-label">주소</label>
              <input className="input" value={receiverAddr} onChange={e => setReceiverAddr(e.target.value)} placeholder="서울특별시 ○○구 ○○로 ○○" />
            </div>
            <div className="field">
              <label className="field-label">연락처 (선택)</label>
              <input className="input" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="02-0000-0000" />
            </div>
          </div>
        </div>
      </section>

      {/* ④ 사건 표시 (소견서/준비서면/항소이유서) */}
      {needsCase && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>④</span>
            사건 표시
          </h3>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="field">
              <label className="field-label">법원</label>
              <input className="input" value={court} onChange={e => setCourt(e.target.value)} placeholder="서울중앙지방법원" />
            </div>
            <div className="field">
              <label className="field-label">사건번호</label>
              <input className="input" value={caseNum} onChange={e => setCaseNum(e.target.value)} placeholder="2025가합12345" />
            </div>
            <div className="field">
              <label className="field-label">사건명</label>
              <input className="input" value={caseName} onChange={e => setCaseName(e.target.value)} placeholder="손해배상 청구의 소" />
            </div>
          </div>
        </section>
      )}

      {/* 시간순 사건 경위 */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="timeline" size={14} />
            </span>
            시간순 사건 경위
          </h3>
          <span className="muted" style={{ fontSize: 12 }}>AI가 사실관계 섹션에 시간 순서대로 통합하여 서술합니다.</span>
        </div>
        <div className="timeline-rows">
          <div className="timeline-row" style={{ fontSize: 11, fontWeight: 600, color: "var(--color-neutral-fg-3)" }}>
            <div>날짜</div><div>사건 내용</div><div />
          </div>
          {timeline.map((row, i) => (
            <div key={i} className="timeline-row">
              <input className="input" value={row.date} onChange={e => updateRow(i, "date", e.target.value)} placeholder="2025-01-01" />
              <input className="input" value={row.event} onChange={e => updateRow(i, "event", e.target.value)} placeholder="사건 내용" />
              <button className="icon-btn" aria-label="삭제" onClick={() => removeRow(i)}>
                <Icon name="trash" size={16} color="var(--color-neutral-fg-3)" />
              </button>
            </div>
          ))}
          <button className="btn btn-outline btn-sm" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={addRow}>
            <Icon name="plus" size={14} color="currentColor" /> 행 추가
          </button>
        </div>
      </section>

      {/* 증거 업로드 (FR-17) — 모든 문서 종류 공통 */}
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
            <Icon name="attachment" size={14} />
          </span>
          증거 자료 업로드
          <span className="muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>(선택)</span>
        </h3>
        <EvidenceUploader
          files={evidenceFiles}
          onUpload={handleEvidenceUpload}
          onRemove={handleEvidenceRemove}
          aiExtract={true}
          multiple={true}
        />
      </section>

      {/* 상대방 문서 분석 (FR-18, 19) — 반박문 전용 */}
      {docType === "rebuttal" && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
              <Icon name="sparkle" size={14} />
            </span>
            상대방 문서 분석 · 반박 생성
          </h3>
          <p className="muted" style={{ fontSize: 12, margin: "0 0 12px" }}>
            상대방 문서를 업로드하면 AI가 주장을 추출하고 반박 초안을 자동 생성합니다.
          </p>
          <OpponentDocAnalysis onRebuttalChange={setRebuttalDraft} />
        </section>
      )}

      {/* ⑤ 사건 경위 / ⑥ 요구사항 */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
        <div className="field">
          <label className="field-label" style={{ fontSize: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, marginRight: 6 }}>⑤</span>
            사건 경위·핵심 내용 <span className="req">*</span>
          </label>
          <textarea className="textarea" rows={6} value={facts}
            onChange={e => setFacts(e.target.value)}
            placeholder="사건의 경위, 계약 내용, 상대방의 위반 행위 등을 자세히 입력해 주세요." />
          <div className="field-help">AI가 본문 서술에 활용합니다. 자세할수록 좋아요.</div>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand-light)", color: "var(--brand-rest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, marginRight: 6 }}>⑥</span>
            요구사항 · 주장하려는 결론
          </label>
          <textarea className="textarea" rows={6} value={request}
            onChange={e => setRequest(e.target.value)}
            placeholder="상대방에게 요구할 사항, 기한, 미이행 시 조치 등을 명확히 입력해 주세요." />
          <div className="field-help">상대방에게 요구할 사항·기한을 명확히 입력해 주세요.</div>
        </div>
      </section>

      <hr className="divider" style={{ margin: "0 0 20px" }} />

      {error && (
        <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-secondary btn-lg" onClick={handleTempSave}>
          <Icon name="save" size={14} /> 임시 저장
        </button>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
          <Icon name="sparkle" size={16} color="#fff" filled /> 초안 생성하기
        </button>
      </div>
    </div>
  );
}

// ── STEP 2: 초안 미리보기 ─────────────────────────────────────
function StepPreview({ docType, draftText, generating, genError, onBack, onNext, onRegenerate, onDownload }) {
  const meta = DocTypeMeta(docType);
  const lines = (draftText || "").split("\n");

  return (
    <div className="create-pane-preview" style={{ minHeight: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h2 className="section-title">초안 미리보기</h2>
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
            <Icon name="document" size={14} color="var(--color-neutral-fg-3)" /> {meta.name} · 제목은 맑은 고딕(굵게), 본문은 바탕체로 출력됩니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onRegenerate} disabled={generating}>
            <Icon name="refresh" size={14} /> 다시 생성
          </button>
          {draftText && (
            <button className="btn btn-secondary" onClick={onDownload} disabled={generating}>
              <Icon name="download" size={14} /> .docx 받기
            </button>
          )}
        </div>
      </div>

      {generating ? (
        <div className="card" style={{ minHeight: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>초안을 작성하고 있어요</div>
            <div className="muted" style={{ fontSize: 13 }}>형식에 맞춰 사건 경위를 정리하는 중입니다 · 약 30초</div>
          </div>
          <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            <div className="skel-bar" style={{ width: "60%" }} />
            <div className="skel-bar" />
            <div className="skel-bar" style={{ width: "85%" }} />
            <div className="skel-bar" style={{ width: "92%" }} />
          </div>
        </div>
      ) : genError ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ maxWidth: 500, margin: "0 auto 20px" }}>
            <Alert type="error">{genError}</Alert>
          </div>
          <button className="btn btn-primary" onClick={onBack}>← 입력 화면으로 돌아가기</button>
        </div>
      ) : (
        <>
          <div className="doc-preview" style={{ maxWidth: 800, margin: "0 auto" }}>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0, fontSize: 14, lineHeight: 1.9 }}>
              {draftText}
            </pre>
            <div className="doc-footer-note" style={{ marginTop: 32 }}>
              ※ 본 문서는 AI(Claude)가 사용자의 입력을 기반으로 자동 생성한 <b>참고용 초안</b>입니다.
              법적 효력이나 정확성을 보장하지 않으며, 실제 발송·제출 전 변호사 검토를 권고합니다.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 800, margin: "20px auto 0" }}>
            <button className="btn btn-subtle" onClick={onBack}>
              <Icon name="chevronL" size={14} /> 이전 (정보 수정)
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={onDownload}>
                <Icon name="download" size={14} /> .docx 받기
              </button>
              <button className="btn btn-primary" onClick={onNext}>
                다음 (수정·저장) <Icon name="chevronR" size={14} color="#fff" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── STEP 3: 대화형 수정 및 저장 ──────────────────────────────
function StepEdit({ docType, draftText, setDraftText, onBack, onDownload }) {
  const [messages, setMessages] = React.useState([
    { role: "ai", text: "초안이 완성되었어요. 자연어로 자유롭게 수정 요청을 보내주세요.\n내용을 더 강하게/부드럽게 바꾸거나, 특정 문구를 추가/삭제할 수 있어요." }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [riskChecking, setRiskChecking] = React.useState(false);
  const [currentDraft, setCurrentDraft] = React.useState(draftText);
  const chatBodyRef = React.useRef(null);
  const meta = DocTypeMeta(docType);

  const QUICK_SUGGESTIONS = ["더 강한 어조로", "더 정중한 표현으로", "법조항 인용 추가", "단락 요약"];

  const scrollToBottom = () => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  };
  React.useEffect(scrollToBottom, [messages]);

  const sendRevision = async (text) => {
    if (!text.trim() || loading || riskChecking) return;

    // 수정 크레딧 확인
    const { data: credits } = await AuthStore.getCredits().catch(() => ({ data: null }));
    if (credits && credits.trial_revision_remaining <= 0) {
      // 크레딧 소진 → 채팅에 안내 메시지 + 결제 모달
      const DOC_PRICES = { notice: 9900, brief: 49000, rebuttal: 69000 };
      const price = DOC_PRICES[docType] || 9900;
      setMessages(m => [...m, {
        role: "ai",
        text: "무료 수정 횟수(3회)를 모두 사용했습니다.\n계속 수정하려면 해당 문서를 구매해 주세요.",
      }]);
      window.openPaymentFlow({
        docType: meta.name,
        price: price,
        priceLabel: price.toLocaleString() + "원",
        onSuccess: () => {},
      });
      return;
    }

    const userMsg = text.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const revised = await window.LawAPI.revise({ draft: currentDraft, revisionRequest: userMsg });
      setCurrentDraft(revised);
      setDraftText(revised);
      setMessages(m => [...m, { role: "ai", text: "수정이 완료되었습니다. 왼쪽 미리보기에서 변경 내용을 확인해 주세요." }]);
      // 성공 시 크레딧 차감 (실패해도 UI는 진행)
      AuthStore.deductTrialRevision().catch(() => {});
    } catch (e) {
      setMessages(m => [...m, { role: "ai", text: `오류가 발생했습니다: ${e.message}` }]);
    }
    setLoading(false);
  };

  const handleRiskCheck = () => {
    if (!currentDraft?.trim() || loading || riskChecking) return;
    setRiskChecking(true);
    // 실제 API 연동 시: POST /api/check_risk
    setTimeout(() => {
      const warnings = [
        { original: "즉각 법적 조치를 취할 것", reason: "위협적 표현으로 오해 소지", suggestion: "법적 절차를 검토할 예정입니다", applied: false, dismissed: false },
        { original: "귀사의 과실이 명백하므로", reason: "단정적 표현 — 법적 다툼 여지", suggestion: "귀사의 행위로 인해 손해가 발생하였으므로", applied: false, dismissed: false },
      ];
      setMessages(m => [...m, { role: "risk-result", warnings }]);
      setRiskChecking(false);
    }, 1000);
  };

  const handleApplySuggestion = (msgIndex, warnIndex) => {
    const w = messages[msgIndex].warnings[warnIndex];
    setCurrentDraft(d => d.replace(w.original, w.suggestion));
    setDraftText(prev => prev.replace(w.original, w.suggestion));
    setMessages(msgs => msgs.map((m, mi) => {
      if (mi !== msgIndex) return m;
      return { ...m, warnings: m.warnings.map((w2, wi) => wi === warnIndex ? { ...w2, applied: true } : w2) };
    }));
  };

  const handleDismissWarning = (msgIndex, warnIndex) => {
    setMessages(msgs => msgs.map((m, mi) => {
      if (mi !== msgIndex) return m;
      return { ...m, warnings: m.warnings.map((w2, wi) => wi === warnIndex ? { ...w2, dismissed: true } : w2) };
    }));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", minHeight: 760, background: "#fff" }}>
      {/* 왼쪽: 문서 미리보기 */}
      <div style={{ padding: "24px 40px", background: "var(--color-neutral-bg-alt)", overflowY: "auto", borderRight: "1px solid var(--color-neutral-stroke-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-subtle btn-sm" onClick={onBack}>
              <Icon name="chevronL" size={14} /> 이전 단계
            </button>
            <DocChip type={meta.name} icon={meta.icon} active />
            {(loading || riskChecking) && <span className="badge badge-warning">수정 중</span>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={onDownload}>
              <Icon name="download" size={14} /> .docx 저장
            </button>
          </div>
        </div>
        <div className="doc-preview" style={{ padding: "48px 56px", maxWidth: 760, margin: "0 auto" }}>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0, fontSize: 14, lineHeight: 1.9 }}>
            {currentDraft}
          </pre>
          <div className="doc-footer-note" style={{ marginTop: 32 }}>
            ※ 본 문서는 AI가 자동 생성한 참고용 초안입니다. 법적 효력이나 정확성을 보장하지 않습니다.
          </div>
        </div>
      </div>

      {/* 오른쪽: 채팅 패널 */}
      <div className="chat-panel">
        <div className="chat-header">
          <div className="chat-title">
            <span className="chat-sparkle"><Icon name="sparkle" size={14} color="#fff" filled /></span>
            AI 어시스턴트
          </div>
        </div>
        <div className="chat-body" ref={chatBodyRef}>
          {messages.map((msg, i) => {
            if (msg.role === "risk-result") {
              return (
                <div key={i} className="chat-msg chat-msg-ai">
                  <span className="chat-msg-avatar">
                    <Icon name="shield" size={12} color="#fff" />
                  </span>
                  <RiskResultChatMsg
                    warnings={msg.warnings}
                    msgIndex={i}
                    onApply={handleApplySuggestion}
                    onDismiss={handleDismissWarning}
                  />
                </div>
              );
            }
            return (
              <div key={i} className={`chat-msg ${msg.role === "ai" ? "chat-msg-ai" : "chat-msg-user"}`}
                style={msg.role === "user" ? { flexDirection: "row-reverse" } : {}}>
                <span className="chat-msg-avatar">
                  {msg.role === "ai"
                    ? <Icon name="sparkle" size={12} color="#fff" filled />
                    : "나"}
                </span>
                <div className="chat-bubble" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
              </div>
            );
          })}
          {(loading || riskChecking) && (
            <div className="chat-msg chat-msg-ai">
              <span className="chat-msg-avatar"><Icon name="sparkle" size={12} color="#fff" filled /></span>
              <div className="chat-bubble">
                <div className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            </div>
          )}
        </div>
        <div className="chat-composer">
          <div className="chat-quick">
            {QUICK_SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-sm" onClick={() => sendRevision(s)} disabled={loading || riskChecking}>{s}</button>
            ))}
            <button
              className="btn btn-sm"
              onClick={handleRiskCheck}
              disabled={loading || riskChecking}
              style={{ color: "var(--color-status-warning-fg, #D97706)", borderColor: "var(--color-status-warning-fg, #D97706)" }}
            >
              <Icon name="shield" size={12} color="var(--color-status-warning-fg, #D97706)" />
              {riskChecking ? "검사 중..." : "위험문장 검사"}
            </button>
          </div>
          <div className="chat-composer-box">
            <textarea rows={2}
              placeholder="어떤 부분을 수정할까요? (예: 4번 항목을 더 정중하게 바꿔줘)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendRevision(input); } }}
            />
            <button className="btn btn-primary btn-sm" style={{ width: 36, height: 32, padding: 0, borderRadius: 8 }}
              onClick={() => sendRevision(input)} disabled={loading || riskChecking || !input.trim()}>
              <Icon name="arrowUp" size={16} color="#fff" />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-neutral-fg-3)", textAlign: "center" }}>
            Shift+Enter로 줄바꿈, Enter로 전송
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 단계 인디케이터 — StepIndicator 공통 컴포넌트 래핑 ─────────
const CREATE_STEPS = [
  { eyebrow: "STEP 1", label: "문서 정보 입력" },
  { eyebrow: "STEP 2", label: "초안 미리보기" },
  { eyebrow: "STEP 3", label: "수정 및 저장" },
];

function ClickableSteps({ current, onGoTo }) {
  return (
    <StepIndicator
      steps={CREATE_STEPS}
      current={current}
      size="md"
      clickable={true}
      onGoTo={onGoTo}
    />
  );
}

// ── 메인 CreateScreen ─────────────────────────────────────────
window.CreateScreen = function CreateScreen({ initialStep = 1, initialDocType = "notice" }) {
  const [step, setStep]           = React.useState(initialStep);
  const [docType, setDocType]     = React.useState(initialDocType);
  const [formData, setFormData]   = React.useState(null);
  const [draftText, setDraftText] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError]   = React.useState("");

  const docTypeKorMap = { notice: "내용증명", brief: "준비서면", rebuttal: "상대방 반박문", appeal: "항소이유서", contract: "계약서" };
  const meta = DocTypeMeta(docType);

  // 실제 API 호출 (크레딧 확인 후 호출)
  const _executeGenerate = async (data, deductNotice = false) => {
    setFormData(data);
    setGenError("");
    setGenerating(true);
    setStep(2);
    try {
      const draft = await window.LawAPI.generate(data);
      setDraftText(draft);
      if (deductNotice) {
        AuthStore.deductTrialNotice().catch(() => {}); // 차감 실패 시 UI는 진행
      }
    } catch (e) {
      setGenError(e.message);
    }
    setGenerating(false);
  };

  // 문서 종류별 유료 가격 (내용증명은 무료 체험 후 결제, 나머지는 항상 결제 선행)
  const DOC_PRICES = {
    notice:   { name: "내용증명",       price: 9900,  label: "9,900원" },
    brief:    { name: "준비서면",       price: 49000, label: "49,000원" },
    rebuttal: { name: "상대방 반박문",  price: 69000, label: "69,000원" },
  };

  const generate = async (data) => {
    if (docType === "notice") {
      // 내용증명: 무료 체험 크레딧 확인 후 생성
      const { data: credits } = await AuthStore.getCredits().catch(() => ({ data: null }));
      if (credits && credits.trial_notice_remaining <= 0) {
        // 크레딧 소진 → 결제 먼저
        const p = DOC_PRICES.notice;
        window.openPaymentFlow({
          docType: p.name,
          price: p.price,
          priceLabel: p.label,
          onSuccess: () => _executeGenerate(data, false),
        });
        return;
      }
      // 크레딧 있음(또는 조회 실패 시 허용) → 생성 후 차감
      await _executeGenerate(data, credits !== null);
    } else {
      // 유료 문서 → 결제 확인 후 생성
      const p = DOC_PRICES[docType];
      if (p) {
        window.openPaymentFlow({
          docType: p.name,
          price: p.price,
          priceLabel: p.label,
          onSuccess: () => _executeGenerate(data, false),
        });
      } else {
        await _executeGenerate(data, false);
      }
    }
  };

  const handleDownload = async () => {
    if (!draftText) return;
    try {
      await window.LawAPI.downloadDocx({ text: draftText, title: docTypeKorMap[docType] || docType });
    } catch (e) {
      alert("다운로드 오류: " + e.message);
    }
  };

  return (
    <div className="screen" style={{ minHeight: 900 }}>
      <TopNav active="create" />
      <div className="screen-content" style={{ padding: "24px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-neutral-fg-3)" }}>
              <Icon name="home" size={14} color="var(--color-neutral-fg-3)" />
              <a href="#/" style={{ color: "inherit" }}>홈</a>
              <Icon name="chevronR" size={12} color="var(--color-neutral-fg-3)" />
              <span>문서 생성</span>
              <Icon name="chevronR" size={12} color="var(--color-neutral-fg-3)" />
              <span style={{ color: "var(--color-neutral-fg-1)", fontWeight: 600 }}>{meta.name}</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
              새 {meta.name} 만들기
            </h1>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <ClickableSteps current={step} onGoTo={n => { if (n === 1) setStep(1); }} />
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--color-neutral-stroke-2)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
          {step === 1 && (
            <StepInput
              docType={docType}
              setDocType={setDocType}
              onSubmit={generate}
            />
          )}
          {step === 2 && (
            <StepPreview
              docType={docType}
              draftText={draftText}
              generating={generating}
              genError={genError}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onRegenerate={() => formData && generate(formData)}
              onDownload={handleDownload}
            />
          )}
          {step === 3 && (
            <StepEdit
              docType={docType}
              draftText={draftText}
              setDraftText={setDraftText}
              onBack={() => setStep(2)}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>
      <LegalNotice />
      <SiteFooter />
    </div>
  );
};
