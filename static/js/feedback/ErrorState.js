// feedback/ErrorState.js — 공통 에러 상태 (PRD v1.2 §4 ErrorState, action: retry)
// 에러 아이콘 + 메시지 + 재시도 버튼(onRetry 있을 때만, window.Btn 재사용).
// Icon 세트에 'warning' 글리프 없음 → 'bolt' 사용(메모: component-conventions).
//
// Props:
//   context : 'list'(기본) | 'preview' | 'payment' | 'upload'
//   message : string | null — 직접 지정 시 기본 메시지 대체
//   onRetry : function | null — 있을 때만 [다시 시도] 버튼 렌더
//   inline  : bool
//
// 사용 예시:
//   <ErrorState context="payment" onRetry={load} />
//   <ErrorState context="list" message="목록을 불러오지 못했습니다" onRetry={reload} />

window.ErrorState = function ErrorState({ context = "list", message, onRetry, inline = false }) {
  const DEFAULT_MSG = {
    list:    "목록을 불러오지 못했습니다.",
    preview: "초안을 불러오지 못했습니다.",
    payment: "결제 정보를 불러오지 못했습니다.",
    upload:  "파일을 처리하지 못했습니다.",
  };
  const msg = message || DEFAULT_MSG[context] || DEFAULT_MSG.list;

  return (
    <div className={`feedback-state feedback-state-error${inline ? " feedback-state-inline" : ""}`} role="alert">
      <div className="feedback-state-icon">
        <Icon name="bolt" size={28} color="currentColor" />
      </div>
      <div className="feedback-state-msg">{msg}</div>
      {onRetry && (
        <div className="feedback-state-action">
          <Btn variant="secondary" size="sm" icon="refresh" onClick={onRetry}>다시 시도</Btn>
        </div>
      )}
    </div>
  );
};
