// document/DocumentTypeCard.js — 문서 종류 카드 단일 컴포넌트 (PRD v1.2 / 설계규칙 §DocumentTypeCard)
// 기존 DocTypePicker 내부의 카드 로직을 단일 컴포넌트로 분리.
// 기존 .doctype-card CSS 클래스 사용.
//
// Props:
//   docType   : DOC_TYPES 항목 객체 { id, name, short, icon, availability, price, priceLabel, freeTrialNote }
//             또는 id 문자열 → DOC_TYPES에서 자동 조회
//   selected  : bool
//   onChange  : function(id) — 클릭 핸들러
//   withPrice : bool — 가격 표시 여부 (기본 false)
//
// availability 별 상태:
//   'active'      → 선택 가능 (selected / default)
//   'v2-planned'  → disabled + "v2.0 예정" 배지
//   'coming-soon' → disabled + "오픈 예정" 배지
//
// 사용 예시:
//   // DOC_TYPES 배열 이용 (전체 그리드)
//   {DOC_TYPES.map(dt => (
//     <DocumentTypeCard key={dt.id} docType={dt} selected={value===dt.id} onChange={setDocType} withPrice />
//   ))}
//
//   // id로 단일 카드
//   <DocumentTypeCard docType="notice" selected onChange={setDocType} />

window.DocumentTypeCard = function DocumentTypeCard({
  docType,
  selected   = false,
  onChange,
  withPrice  = false,
  style,
}) {
  // id 문자열이면 DOC_TYPES에서 조회
  const dt = typeof docType === "string"
    ? (window.DOC_TYPES || []).find(t => t.id === docType) || {}
    : docType;

  const { id, name, short, icon, availability, priceLabel, freeTrialNote } = dt;
  const isComingSoon = availability === "coming-soon";
  const isV2         = availability === "v2-planned";
  const isDisabled   = isComingSoon || isV2;
  const isActive     = !isDisabled && selected;

  const cls = [
    "doctype-card",
    isActive     ? "is-active"  : "",
    isV2         ? "is-locked"  : "",
    isComingSoon ? "is-coming"  : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={cls}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-pressed={isActive}
      style={style}
      onClick={() => !isDisabled && id && onChange && onChange(id)}
    >
      {isComingSoon && <span className="doctype-coming-badge">오픈 예정</span>}
      {isV2 && (
        <span
          className="doctype-coming-badge"
          style={{
            background: "var(--color-neutral-bg-subtle-2)",
            color: "var(--color-neutral-fg-3)",
            borderColor: "var(--color-neutral-stroke-1)",
          }}
        >
          v2.0 예정
        </span>
      )}

      {icon && (
        <span className="doctype-icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="doctype-name">{name}</span>
      <span className="doctype-desc">{short}</span>

      {withPrice && priceLabel && (
        <span
          className="doctype-desc"
          style={{ color: "var(--brand-rest)", fontWeight: 700, marginTop: "auto", fontSize: 11 }}
        >
          {priceLabel}
          {freeTrialNote && (
            <span style={{ display: "block", fontWeight: 400, color: "var(--color-neutral-fg-3)", fontSize: 10 }}>
              {freeTrialNote}
            </span>
          )}
        </span>
      )}
    </button>
  );
};

// ── DocumentTypePicker: 전체 그리드 (DocTypePicker 대체 가능) ─
// 기존 DocTypePicker와 동일 역할, DocumentTypeCard 인스턴스 사용
window.DocumentTypePicker = function DocumentTypePicker({ value, onChange, withPrice = false }) {
  return (
    <div className="doctype-grid">
      {(window.DOC_TYPES || []).map(dt => (
        <DocumentTypeCard
          key={dt.id}
          docType={dt}
          selected={value === dt.id}
          onChange={onChange}
          withPrice={withPrice}
        />
      ))}
    </div>
  );
};
