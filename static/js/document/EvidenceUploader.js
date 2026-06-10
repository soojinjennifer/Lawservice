// document/EvidenceUploader.js — 증거 드롭존 컴포넌트 (PRD v1.2 FR-17)
// Props:
//   files       : [{ name, extractedDate, status }] — 업로드된 파일 목록
//   onUpload    : (fileList) => void — 파일 추가 핸들러
//   onRemove    : (index) => void — 파일 삭제 핸들러
//   aiExtract   : boolean — AI 날짜 추출 표시 여부 (기본 true)
//   multiple    : boolean — 다중 파일 허용 (기본 true)

window.EvidenceUploader = function EvidenceUploader({
  files = [],
  onUpload,
  onRemove,
  aiExtract = true,
  multiple = true,
}) {
  const inputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    if (onUpload) onUpload(Array.from(fileList));
  };

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const statusIcon = (status) => {
    if (status === "done")  return { name: "checkOnly", color: "var(--color-status-success-fg)" };
    if (status === "error") return { name: "dismiss",   color: "var(--color-status-danger-fg)" };
    return { name: "clock", color: "var(--color-status-warning-fg)" };
  };

  return (
    <div>
      {/* 드롭존 */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--brand-rest)" : "var(--color-neutral-stroke-2)"}`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          background: dragging ? "var(--brand-light)" : "var(--color-neutral-bg-alt)",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <Icon name="upload" size={28} color={dragging ? "var(--brand-rest)" : "var(--color-neutral-fg-3)"} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-neutral-fg-1)", marginBottom: 4 }}>
          클릭하거나 파일을 여기에 끌어다 놓으세요
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          JPG, PNG, PDF 지원 · 파일당 최대 10MB
          {aiExtract && <> · <span style={{ color: "var(--brand-rest)", fontWeight: 600 }}>AI가 날짜·내용을 자동 추출합니다</span></>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          multiple={multiple}
          style={{ display: "none" }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* 업로드된 파일 목록 (FileChip) */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {files.map((f, i) => {
            const icon = statusIcon(f.status);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                border: "1px solid var(--color-neutral-stroke-2)",
                borderRadius: 8,
                background: "#fff",
              }}>
                <Icon name="attachment" size={16} color="var(--color-neutral-fg-2)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 13,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {f.name}
                  </div>
                  {aiExtract && f.extractedDate && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      marginTop: 3, padding: "2px 8px", borderRadius: 999,
                      background: "var(--brand-light)",
                      fontSize: 11, fontWeight: 600, color: "var(--brand-rest)",
                    }}>
                      <Icon name="clock" size={11} color="var(--brand-rest)" /> {f.extractedDate}
                    </div>
                  )}
                  {aiExtract && f.status === "uploading" && (
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>분석 중...</div>
                  )}
                </div>
                <Icon name={icon.name} size={16} color={icon.color} />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: 24, height: 24, flexShrink: 0 }}
                  onClick={() => onRemove && onRemove(i)}
                  aria-label="삭제"
                >
                  <Icon name="dismiss" size={14} color="var(--color-neutral-fg-3)" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
