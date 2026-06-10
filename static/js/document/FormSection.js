// document/FormSection.js — 문서 작성 폼 섹션 래퍼 (PRD v1.2 / 설계규칙 §DocumentFormSection)
// create_screen.js에서 반복되는 <section> + 제목 + 번호 패턴을 컴포넌트로 추출.
//
// Props:
//   stepNum     : string | number — 섹션 번호 라벨 (예: "①", "②", "⑤", null=미표시)
//   title       : string — 섹션 제목
//   required    : bool — 필수 표시 (*)
//   description : string — 부제목/설명
//   layout      : 'vertical'(기본) | '2col' | '3col' — 내부 필드 레이아웃
//   gap         : number (기본 32) — 컬럼 간격
//   collapsible : bool — 접기/펼치기 기능
//   children    : ReactNode
//
// 사용 예시:
//   <FormSection stepNum="②" title="발신인 정보" required layout="vertical">
//     <TextInput label="성명 / 법인명" ... />
//     <TextInput label="주소" ... />
//   </FormSection>
//
//   <FormSection stepNum="⑤" title="사건 경위·핵심 내용" required
//     description="AI가 본문 서술에 활용합니다." layout="2col">
//     <Textarea ... />
//     <Textarea ... />
//   </FormSection>
//
//   <FormSection title="사건 표시" layout="3col">
//     <TextInput label="법원" ... />
//     <TextInput label="사건번호" ... />
//     <TextInput label="사건명" ... />
//   </FormSection>

window.FormSection = function FormSection({
  stepNum,
  title,
  required    = false,
  description,
  layout      = "vertical",
  gap         = 32,
  collapsible = false,
  style,
  children,
}) {
  const [open, setOpen] = React.useState(true);

  const gridStyle = (() => {
    if (layout === "2col") return { display: "grid", gridTemplateColumns: "1fr 1fr", gap };
    if (layout === "3col") return { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap };
    return { display: "flex", flexDirection: "column", gap: 12 };
  })();

  return (
    <section style={{ marginBottom: 32, ...style }}>
      {/* 섹션 헤더 */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 12,
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, margin: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {stepNum && (
            <span style={{
              width: 24, height: 24, borderRadius: 6,
              background: "var(--brand-light)", color: "var(--brand-rest)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {stepNum}
            </span>
          )}
          {title}
          {required && (
            <span className="req" aria-label="필수" style={{ color: "var(--color-status-danger-fg)", fontWeight: 400, fontSize: 12 }}>
              *
            </span>
          )}
        </h3>

        {description && !collapsible && (
          <span className="muted" style={{ fontSize: 12 }}>{description}</span>
        )}

        {collapsible && (
          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <Icon name="chevronD" size={14} color="currentColor"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
            {open ? "접기" : "펼치기"}
          </button>
        )}
      </div>

      {description && collapsible && (
        <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>{description}</p>
      )}

      {/* 섹션 본문 */}
      {open && (
        <div style={gridStyle}>
          {children}
        </div>
      )}
    </section>
  );
};

// ── TimelineRowEditor: 시간순 사건 경위 입력 (create_screen 내 반복 패턴 추출) ──
// Props:
//   rows     : [{ date, event }]
//   onChange : function(rows)
//
// 사용 예시:
//   <TimelineRowEditor rows={timeline} onChange={setTimeline} />

window.TimelineRowEditor = function TimelineRowEditor({ rows = [], onChange }) {
  const addRow    = () => onChange([...rows, { date: "", event: "" }]);
  const removeRow = i  => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  return (
    <div className="timeline-rows">
      <div
        className="timeline-row"
        style={{ fontSize: 11, fontWeight: 600, color: "var(--color-neutral-fg-3)" }}
      >
        <div>날짜</div>
        <div>사건 내용</div>
        <div />
      </div>

      {rows.map((row, i) => (
        <div key={i} className="timeline-row">
          <input
            className="input"
            value={row.date}
            onChange={e => updateRow(i, "date", e.target.value)}
            placeholder="2025-01-01"
            type="text"
            aria-label={`${i + 1}번 사건 날짜`}
          />
          <input
            className="input"
            value={row.event}
            onChange={e => updateRow(i, "event", e.target.value)}
            placeholder="사건 내용"
            aria-label={`${i + 1}번 사건 내용`}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label={`${i + 1}번 행 삭제`}
            onClick={() => removeRow(i)}
          >
            <Icon name="trash" size={16} color="var(--color-neutral-fg-3)" />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ alignSelf: "flex-start", marginTop: 4 }}
        onClick={addRow}
      >
        <Icon name="plus" size={14} color="currentColor" /> 행 추가
      </button>
    </div>
  );
};
