// ui/Badge.js — Badge 컴포넌트 (PRD v1.2 / 설계규칙 §Badge)
// 기존 .badge CSS를 래핑. 문서 상태, 플랜 표시, v2.0 예정 등에 사용.
//
// Props:
//   variant  : 'info'(기본) | 'success' | 'warning' | 'danger' | 'neutral' | 'v2'
//   icon     : Icon name (선택)
//   children : ReactNode
//
// 문서 상태 → variant 매핑:
//   작성중         → neutral
//   초안생성됨      → info
//   수정중         → warning
//   저장완료        → success
//   발송완료        → success
//   삭제됨         → danger
//   v2.0 예정      → v2
//   오픈 예정       → neutral
//
// 사용 예시:
//   <Badge variant="success">저장완료</Badge>
//   <Badge variant="warning">수정중</Badge>
//   <Badge variant="v2">v2.0 예정</Badge>
//   <Badge variant="info" icon="document">초안생성됨</Badge>

const BADGE_VARIANT_MAP = {
  info:    "badge-info",
  success: "badge-success",
  warning: "badge-warning",
  danger:  "badge-danger",
  neutral: "badge-neutral",
  v2:      "badge-v2",       // .badge-v2 (styles.css에서 정의)
};

// 문서 상태 문자열 → variant 자동 변환
const DOC_STATUS_VARIANT = {
  "작성중":    "neutral",
  "초안생성됨": "info",
  "수정중":    "warning",
  "저장완료":  "success",
  "발송완료":  "success",
  "분석중":    "info",
  "삭제됨":   "danger",
};

window.Badge = function Badge({
  variant  = "info",
  icon,
  children,
  style,
  ...rest
}) {
  const cls = ["badge", BADGE_VARIANT_MAP[variant] || "badge-info"].join(" ");
  return (
    <span className={cls} style={style} {...rest}>
      {icon && <Icon name={icon} size={10} color="currentColor" style={{ marginRight: 4, verticalAlign: "middle" }} />}
      {children}
    </span>
  );
};

// 문서 상태 자동 변환 헬퍼
window.DocStatusBadge = function DocStatusBadge({ status, ...rest }) {
  const variant = DOC_STATUS_VARIANT[status] || "neutral";
  return <Badge variant={variant} {...rest}>{status}</Badge>;
};
