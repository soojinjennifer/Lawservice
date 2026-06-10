// ui/Card.js — Card / CardFlat / CardSubtle 컴포넌트 (PRD v1.2)
// 기존 .card / .card-flat / .card-subtle CSS를 래핑.
//
// ── Card (그림자 있는 기본 카드) ─────────────────────────────
// Props:
//   variant  : 'default'(기본) | 'flat' | 'subtle'
//   padding  : number | string (기본 24)
//   style    : object
//   onClick  : function — 제공 시 role="button" 적용
//   children : ReactNode
//
// 사용 예시:
//   <Card>내용</Card>
//   <Card variant="flat" padding={0}>헤더 없는 카드</Card>
//   <Card variant="subtle" padding={16}>배경 카드</Card>
//   <Card onClick={fn}>클릭 가능한 카드</Card>

window.Card = function Card({
  variant  = "default",
  padding  = 24,
  style,
  onClick,
  className = "",
  children,
  ...rest
}) {
  const clsMap = { default: "card", flat: "card-flat", subtle: "card-subtle" };
  const cls = [clsMap[variant] || "card", className].filter(Boolean).join(" ");
  const isClickable = typeof onClick === "function";

  return (
    <div
      className={cls}
      style={{ padding, ...(isClickable ? { cursor: "pointer" } : {}), ...style }}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e => { if (e.key === "Enter" || e.key === " ") onClick(e); }) : undefined}
      {...rest}
    >
      {children}
    </div>
  );
};

// 편의 alias
window.CardFlat   = (props) => <Card {...props} variant="flat" />;
window.CardSubtle = (props) => <Card {...props} variant="subtle" />;
