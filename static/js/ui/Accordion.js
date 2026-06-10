// ui/Accordion.js — FAQ·도움말 공용 아코디언 (PRD v1.2 §4 Tab)
// props: q(string), a(string|ReactNode), defaultOpen(boolean, 기본 false)

window.AccordionItem = function AccordionItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div className="card-flat" style={{ padding: 0, overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: "100%", border: 0, background: open ? "var(--brand-light)" : "#fff",
        padding: "18px 20px", display: "flex", alignItems: "center", gap: 12,
        textAlign: "left", cursor: "pointer",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          background: "var(--brand-rest)", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 13, flex: "none",
        }}>Q</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "var(--color-neutral-fg-1)" }}>{q}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
          <Icon name="chevronD" size={18} color="var(--color-neutral-fg-2)" />
        </span>
      </button>
      {open && (
        <div style={{
          padding: "16px 20px 20px 60px", fontSize: 14, lineHeight: 1.7,
          color: "var(--color-neutral-fg-2)",
          borderTop: "1px solid var(--brand-light-2)", background: "#fff",
        }}>
          {a}
        </div>
      )}
    </div>
  );
};
