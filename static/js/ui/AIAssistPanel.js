// ui/AIAssistPanel.js — AI 어시스턴트 우측 slide-in drawer (PRD v1.2)
// 기존 .chat-* CSS 클래스 재사용. 신규 스타일 생성 금지.
//
// Props:
//   messages          : [{ role:'ai'|'user'|'risk-result', text?, warnings? }]
//   onSend            : (text) => void
//   loading           : bool
//   riskChecking      : bool
//   onRiskCheck       : () => void
//   onApplySuggestion : (msgIndex, warnIndex) => void
//   onDismissWarning  : (msgIndex, warnIndex) => void
//   quickSuggestions  : string[]
//   disabled          : bool — true 시 채팅 입력 비활성(Step2 미리보기 용)

// ── 위험문장 검사 결과 카드 (AIAssistPanel 내부 전용) ──────────
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
                <Btn variant="primary" size="sm" onClick={() => onApply(msgIndex, wi)}>제안대로 수정</Btn>
                <Btn variant="ghost" size="sm" onClick={() => onDismiss(msgIndex, wi)}>그대로 두기</Btn>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

window.AIAssistPanel = function AIAssistPanel({
  messages = [],
  onSend,
  loading = false,
  riskChecking = false,
  onRiskCheck,
  onApplySuggestion,
  onDismissWarning,
  quickSuggestions = [],
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const chatBodyRef = React.useRef(null);

  React.useEffect(() => {
    if (open && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim() || loading || riskChecking || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FAB 버튼 — 항상 표시 (position:fixed는 CSS 처리) */}
      <button
        className={`create-fab${open ? " is-active" : ""}`}
        onClick={() => setOpen(o => !o)}
        type="button"
        aria-label={open ? "AI 어시스턴트 닫기" : "AI 어시스턴트 열기"}
      >
        <Icon name={open ? "dismiss" : "sparkle"} size={22} color="#fff" filled />
      </button>

      {/* 스크림 (drawer 열렸을 때) */}
      {open && (
        <div className="ai-assist-scrim" onClick={() => setOpen(false)} />
      )}

      {/* Drawer 본체 */}
      <div className={`ai-assist-drawer${open ? " is-open" : ""}`}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-neutral-stroke-1)" }} />
        </div>
        {/* 헤더 */}
        <div className="chat-header" style={{ justifyContent: "space-between" }}>
          <div className="chat-title">
            <span className="chat-sparkle">
              <Icon name="sparkle" size={14} color="#fff" filled />
            </span>
            AI 어시스턴트
          </div>
          <Btn variant="icon" icon="dismiss" aria-label="닫기" onClick={() => setOpen(false)} />
        </div>

        {/* 채팅 본문 */}
        <div className="chat-body" ref={chatBodyRef}>
          {disabled && messages.length === 0 && (
            <div className="chat-msg chat-msg-ai">
              <span className="chat-msg-avatar">
                <Icon name="sparkle" size={12} color="#fff" filled />
              </span>
              <div className="chat-bubble">
                완료된 초안 문서를 다운로드 해주세요.
              </div>
            </div>
          )}
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
                    onApply={onApplySuggestion}
                    onDismiss={onDismissWarning}
                  />
                </div>
              );
            }
            return (
              <div
                key={i}
                className={`chat-msg ${msg.role === "ai" ? "chat-msg-ai" : "chat-msg-user"}`}
                style={msg.role === "user" ? { flexDirection: "row-reverse" } : {}}
              >
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
              <span className="chat-msg-avatar">
                <Icon name="sparkle" size={12} color="#fff" filled />
              </span>
              <div className="chat-bubble">
                <div className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            </div>
          )}
        </div>

        {/* 컴포저 */}
        <div className="chat-composer">
          {!disabled && (
            <div className="chat-quick">
              {quickSuggestions.map(s => (
                <Btn
                  key={s}
                  variant="ghost"
                  size="sm"
                  disabled={loading || riskChecking}
                  onClick={() => onSend(s)}
                >
                  {s}
                </Btn>
              ))}
              <Btn
                variant="ghost"
                size="sm"
                icon="shield"
                iconColor="var(--color-status-warning-fg, #D97706)"
                disabled={loading || riskChecking}
                onClick={onRiskCheck}
                style={{ color: "var(--color-status-warning-fg, #D97706)", borderColor: "var(--color-status-warning-fg, #D97706)" }}
              >
                {riskChecking ? "검사 중..." : "위험문장 검사"}
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                icon="sparkle"
                disabled={loading || riskChecking}
                style={{ color: "var(--brand-rest)", borderColor: "var(--brand-rest)" }}
              >
                내편 전략 제안
              </Btn>
            </div>
          )}
          <div className="chat-composer-box" style={disabled ? { opacity: 0.5, pointerEvents: "none" } : {}}>
            <textarea
              rows={2}
              placeholder={disabled ? "다음 단계에서 수정을 요청할 수 있어요" : "어떤 부분을 수정할까요? (예: 4번 항목을 더 정중하게 바꿔줘)"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
            <Btn
              variant="primary"
              size="sm"
              style={{ width: 36, height: 32, padding: 0, borderRadius: 8, flexShrink: 0 }}
              onClick={handleSend}
              disabled={loading || riskChecking || !input.trim() || disabled}
            >
              <Icon name="arrowUp" size={16} color="#fff" />
            </Btn>
          </div>
          {!disabled && (
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-neutral-fg-3)", textAlign: "center" }}>
              Shift+Enter로 줄바꿈, Enter로 전송
            </p>
          )}
        </div>
      </div>
    </>
  );
};
