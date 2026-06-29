// feedback/EmptyState.js — 공통 빈 상태 (PRD v1.2 §4 EmptyState)
// 아이콘(Icon 세트) + 메시지 + 선택적 액션 버튼(window.Btn 재사용).
// 신규 버튼 스타일 생성 금지 — 공통 Btn 인스턴스만 사용.
//
// Props:
//   context     : 'list'(기본) | 'preview' | 'payment' | 'upload'
//   message     : string | null — 직접 지정 시 기본 메시지 대체
//   actionLabel : string | null — 있을 때만 액션 버튼 렌더
//   onAction    : function       — actionLabel과 함께 제공
//   inline      : bool           — 패딩 축소
//
// 사용 예시:
//   <EmptyState context="list" actionLabel="문서 만들기" onAction={go} />
//   <EmptyState context="preview" />

window.EmptyState = function EmptyState({ context = "list", message, actionLabel, onAction, inline = false }) {
  const DEFAULT = {
    list:    { icon: "document", msg: "아직 문서가 없습니다." },
    preview: { icon: "docEdit",  msg: "초안이 아직 없어요." },
    payment: { icon: "creditCard", msg: "결제 내역이 없습니다." },
    upload:  { icon: "upload",   msg: "아직 업로드된 자료가 없습니다." },
  };
  const cfg = DEFAULT[context] || DEFAULT.list;
  const msg = message || cfg.msg;

  return (
    <div className={`feedback-state${inline ? " feedback-state-inline" : ""}`}>
      <div className="feedback-state-icon">
        <Icon name={cfg.icon} size={28} color="currentColor" />
      </div>
      <div className="feedback-state-msg">{msg}</div>
      {actionLabel && onAction && (
        <div className="feedback-state-action">
          <Btn variant="secondary" size="sm" onClick={onAction}>{actionLabel}</Btn>
        </div>
      )}
    </div>
  );
};
