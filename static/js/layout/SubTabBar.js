// layout/SubTabBar.js — 마이페이지 서브탭 (PRD v1.2 §4 Tab)
// props: active("mydocs"|"subscription"|"settings"), count(선택, 나의 문서 카운트)

window.SubTabBar = function SubTabBar({ active, count }) {
  const tabs = [
    { key: "mydocs",       label: "나의 문서",  nav: "/mydocs" },
    { key: "subscription", label: "결제 내역",  nav: "/subscription" },
    { key: "settings",     label: "계정 설정",  nav: null },
  ];

  return (
    <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--color-neutral-stroke-2)", marginBottom: 24 }}>
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            className={`gnb-link${isActive ? " is-active" : ""}`}
            {...(!isActive && tab.nav ? { "data-nav": tab.nav } : {})}
            style={{
              borderRadius: 0, height: 40, paddingBottom: 10,
              background: "transparent",
              ...(isActive
                ? { borderBottom: "2px solid var(--brand-rest)", color: "var(--brand-rest)" }
                : { color: "var(--color-neutral-fg-3)" }),
            }}
          >
            {tab.label}
            {tab.key === "mydocs" && count != null && (
              <span className="muted" style={{ fontWeight: 500 }}> {count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
