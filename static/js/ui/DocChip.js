// ui/DocChip.js — 문서 종류 라벨 칩 (PRD v1.2 §4 DocChip)
// props: type(string), size("md"|"sm"|"ssm"), icon(선택), active(선택)
//   "md"  = CSS 기본값 (height 28, fontSize 12)
//   "sm"  = height 24, fontSize 11  — 목록 행
//   "ssm" = height 20, fontSize 11  — 카드 헤더 등 초소형

window.DocChip = function DocChip({ type, size = "md", icon, active }) {
  const sizeStyle =
    size === "ssm" ? { height: 20, fontSize: 11 } :
    size === "sm"  ? { height: 24, fontSize: 11 } :
    {};

  return (
    <span
      className={`doc-chip${active ? " is-active" : ""}`}
      style={sizeStyle}
    >
      {icon && <Icon name={icon} size={size === "md" ? 14 : 12} />}
      {type}
    </span>
  );
};
