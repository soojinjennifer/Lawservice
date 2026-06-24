// feedback/LoadingState.js — 공통 로딩 상태 (PRD v1.2 §4 LoadingState)
// 브랜드 토큰(.spinner = --brand-rest) 재사용. 신규 색상 hex 금지.
//
// Props:
//   context : 'list'(기본) | 'preview' | 'payment' | 'upload' — 상황별 기본 메시지
//   message : string | null — 직접 지정 시 기본 메시지 대체
//   inline  : bool — true면 패딩 축소(행/카드 내부용)
//
// 사용 예시:
//   <LoadingState context="payment" />
//   <LoadingState context="list" message="문서를 불러오는 중..." />

window.LoadingState = function LoadingState({ context = "list", message, inline = false }) {
  const DEFAULT_MSG = {
    list:    "목록을 불러오는 중...",
    preview: "초안을 생성하는 중...",
    payment: "결제 정보를 불러오는 중...",
    upload:  "파일을 업로드하는 중...",
  };
  const msg = message || DEFAULT_MSG[context] || DEFAULT_MSG.list;

  return (
    <div className={`feedback-state${inline ? " feedback-state-inline" : ""}`} role="status" aria-live="polite">
      <span className="spinner" />
      <div className="feedback-state-msg">{msg}</div>
    </div>
  );
};
