// ui/SearchFilterBar.js — 검색 + 필터 툴바 (PRD v1.2 §4)
// props: placeholder, searchValue, onSearchChange,
//        filterValue, onFilterChange, filterOptions
// 필터 버튼 3개(전체 종류·상태·최근 30일)는 현재 스텁 — 향후 filterOptions 연결 예정

window.SearchFilterBar = function SearchFilterBar({
  placeholder = "문서 제목으로 검색",
  searchValue,
  onSearchChange,
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-neutral-stroke-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 10, top: 9 }}>
            <Icon name="search" size={16} color="var(--color-neutral-fg-3)" />
          </span>
          <input
            className="input"
            placeholder={placeholder}
            style={{ paddingLeft: 32 }}
            value={searchValue}
            onChange={onSearchChange}
          />
        </div>
        <button className="btn btn-secondary btn-sm">전체 종류 <Icon name="chevronD" size={12} /></button>
        <button className="btn btn-secondary btn-sm">전체 상태 <Icon name="chevronD" size={12} /></button>
        <button className="btn btn-secondary btn-sm">최근 30일 <Icon name="chevronD" size={12} /></button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>최신순</span>
        <button className="icon-btn"><Icon name="more" size={16} /></button>
      </div>
    </div>
  );
};
