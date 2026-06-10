// ui/YesNoToggle.js — 예/아니오 2분할 세그먼트 토글 (PRD v1.2 §4 YesNoToggle)
// props: value("예"|"아니오"|null), onChange(v => void)

window.YesNoToggle = function YesNoToggle({ value, onChange }) {
  return (
    <div style={{
      display: "inline-flex", borderRadius: 8,
      border: "1px solid var(--color-neutral-stroke-2)",
      overflow: "hidden", background: "#fff", flexShrink: 0,
    }}>
      {["예", "아니오"].map(opt => {
        const isActive = value === opt;
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: "6px 18px", border: "none",
            borderRight: opt === "예" ? "1px solid var(--color-neutral-stroke-2)" : "none",
            background: isActive ? "var(--brand-rest)" : "transparent",
            color: isActive ? "#fff" : "var(--color-neutral-fg-2)",
            fontWeight: isActive ? 700 : 500, fontSize: 13,
            cursor: "pointer", transition: "all .15s",
          }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
};
