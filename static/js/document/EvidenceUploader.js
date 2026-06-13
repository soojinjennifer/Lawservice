// document/EvidenceUploader.js — 증거 드롭존 컴포넌트 (PRD v1.2 FR-17)
// Props:
//   files            : [{ name, extractedDate, status }] — 업로드된 파일 목록(input 모드)
//   onUpload         : (fileList) => void — 파일 추가 핸들러
//   onRemove         : (index) => void — 파일 삭제 핸들러
//   aiExtract        : boolean — AI 날짜 추출 표시 여부 (기본 true)
//   multiple         : boolean — 다중 파일 허용 (기본 true)
//   mode             : 'input'(기본) | 'preview' — preview는 읽기 전용 증거 패널
//   readonly         : boolean — preview와 동일하게 읽기 전용 처리
//   showDownloadButton : boolean — preview에서 증거별 다운로드 버튼 표시
//   evidenceList     : 미리보기 증거 목록(없으면 files 사용)

window.EvidenceUploader = function EvidenceUploader({
  files = [],
  onUpload,
  onRemove,
  aiExtract = true,
  multiple = true,
  mode = "input",
  readonly = false,
  showDownloadButton = false,
  evidenceList = [],
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

  // ── preview / readonly 모드: 읽기 전용 증거 패널 (드롭존·삭제·안내 숨김) ──
  if (mode === "preview" || readonly) {
    const items = (evidenceList && evidenceList.length ? evidenceList : files) || [];
    if (!items.length) {
      return (
        <CardFlat padding={16}>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            아직 업로드된 증거 자료가 없습니다.<br />
            문서 정보 입력 단계에서 증거 파일을 업로드하면 이곳에 표시됩니다.
          </div>
        </CardFlat>
      );
    }
    return (
      <>
      <div className="evidence-list">
        {items.map((item, i) => {
          const evidenceNo = item.evidenceNo || item.evidence_no || item.evidence_no_text || "";
          const filename = item.savedFilename || item.saved_filename || item.originalName || item.original_name || item.name || "증거자료";
          const summary = item.summary || item.description || item.purpose || "";
          const date = item.date || item.extractedDate || item.extracted_date || "";
          const savedName = item.savedFilename || item.saved_filename || "";
          let downloadUrl = item.downloadUrl || item.download_url || "";
          if (!downloadUrl && savedName && window.LawAPI && window.LawAPI.evidenceDownloadUrl) {
            downloadUrl = window.LawAPI.evidenceDownloadUrl(savedName);
          }
          return (
            <div key={item.id || i} className="evidence-preview-item">
              {evidenceNo && <Badge variant="info">{evidenceNo}</Badge>}
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, wordBreak: "break-all" }}>
                {filename}
              </div>
              {summary && (
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>입증취지: {summary}</div>
              )}
              {date && (
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>날짜: {date}</div>
              )}
              {showDownloadButton && (
                <div className="evidence-preview-actions">
                  {downloadUrl
                    ? <Btn variant="secondary" size="sm" icon="download" href={downloadUrl} download>다운로드</Btn>
                    : <Btn variant="secondary" size="sm" disabled>다운로드 불가</Btn>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
        증거 파일은 임시로 보관되며 서버에 저장되지 않습니다.
      </p>
      </>
    );
  }

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
                    {/* 증거번호 배지 (백엔드 반환) */}
                    {f.evidenceNo && (
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        marginRight: 6, padding: "1px 7px", borderRadius: 6,
                        background: "var(--brand-rest)", color: "#fff",
                        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                      }}>
                        {f.evidenceNo}
                      </span>
                    )}
                    {f.savedFilename || f.name}
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
                  {f.status === "error" && (
                    <div style={{ fontSize: 11, marginTop: 2, color: "var(--color-status-danger-fg)" }}>
                      {f.error || "증거 파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요."}
                    </div>
                  )}
                </div>
                {/* 다운로드 링크 (백엔드가 downloadUrl 반환 시) */}
                {f.downloadUrl && f.status === "done" && (
                  <a
                    href={f.downloadUrl}
                    download
                    className="icon-btn"
                    style={{ width: 24, height: 24, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="증거 파일 다운로드"
                    onClick={e => e.stopPropagation()}
                  >
                    <Icon name="download" size={14} color="var(--color-neutral-fg-2)" />
                  </a>
                )}
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
          <p className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            증거 파일은 임시로 보관되며 서버에 저장되지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
};
