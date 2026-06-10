// ui/Alert.js — Alert / MessageBar 컴포넌트 (PRD v1.2 / 설계규칙 §Alert)
// 기존 .msgbar 클래스를 승격. 신규 스타일 생성 금지.
//
// Props:
//   type         : 'info'(기본) | 'success' | 'warning' | 'error'
//   title        : string — 굵은 제목 (선택)
//   closable     : bool — 닫기 버튼 표시
//   onClose      : function
//   actionLabel  : string — 우측 액션 버튼 텍스트 (선택)
//   onAction     : function
//   icon         : bool — 아이콘 표시 여부 (기본 true)
//   style        : object
//   children     : ReactNode
//
// 사용 예시:
//   <Alert type="info">AI가 생성한 문서는 참고용 초안입니다.</Alert>
//   <Alert type="error" title="오류" closable onClose={fn}>Claude 호출 실패: ...</Alert>
//   <Alert type="warning" actionLabel="다시 시도" onAction={fn}>연결이 불안정합니다.</Alert>
//   <Alert type="success">임시 저장되었습니다.</Alert>

const ALERT_CONFIG = {
  info:    { cls: "msgbar-info",    icon: "shield",  color: "var(--brand-rest)" },
  success: { cls: "msgbar-success", icon: "check",   color: "var(--color-status-success-fg)" },
  warning: { cls: "msgbar-warn",    icon: "bolt",    color: "var(--color-status-warning-fg)" },
  error:   { cls: "msgbar-danger",  icon: "dismiss", color: "var(--color-status-danger-fg)" },
};

window.Alert = function Alert({
  type         = "info",
  title,
  closable     = false,
  onClose,
  actionLabel,
  onAction,
  icon         = true,
  style,
  children,
  ...rest
}) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;

  const cfg = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const handleClose = () => { setVisible(false); if (onClose) onClose(); };

  return (
    <div
      className={`msgbar ${cfg.cls}`}
      style={{ alignItems: "flex-start", ...style }}
      role={type === "error" ? "alert" : "status"}
      {...rest}
    >
      {icon && (
        <Icon name={cfg.icon} size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: children ? 2 : 0 }}>{title}</div>}
        {children && <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>}
      </div>
      {actionLabel && onAction && (
        <button
          className="btn btn-sm btn-subtle"
          onClick={onAction}
          style={{ flexShrink: 0, color: cfg.color }}
        >
          {actionLabel}
        </button>
      )}
      {closable && (
        <button
          className="icon-btn"
          aria-label="닫기"
          onClick={handleClose}
          style={{ flexShrink: 0 }}
        >
          <Icon name="dismiss" size={14} color="currentColor" />
        </button>
      )}
    </div>
  );
};
