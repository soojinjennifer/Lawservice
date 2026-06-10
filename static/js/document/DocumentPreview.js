// document/DocumentPreview.js — 초안 미리보기 컴포넌트 (PRD v1.2 / 설계규칙 §DocumentPreview)
// 기존 .doc-preview CSS를 래핑. create_screen.js의 StepPreview/StepEdit 미리보기 통합.
//
// Props:
//   documentType : 'notice' | 'rebuttal' | 'brief' | 'opinion' | 'appeal'
//   mode         : 'preview'(기본) | 'edit' | 'readonly'
//   status       : 'loading' | 'generated' | 'edited' | 'empty' | 'error'
//   content      : string — 문서 초안 텍스트
//   errorMessage : string — status='error' 시 표시
//   maxWidth     : number | string (기본 800)
//   padding      : string (기본 '0')
//   onRegenerate : function — "다시 생성" 핸들러
//   onDownload   : function — ".docx 받기" 핸들러
//   onBack       : function — "이전" 핸들러 (preview 모드)
//   onNext       : function — "다음" 핸들러 (preview 모드)
//   showActions  : bool — 하단 액션 버튼 표시 여부 (기본 false)
//   showHeader   : bool — 상단 메타 + 재생성 버튼 (기본 false)
//
// 사용 예시 (Step2 미리보기):
//   <DocumentPreview
//     documentType={docType}
//     status={generating ? "loading" : genError ? "error" : "generated"}
//     content={draftText}
//     errorMessage={genError}
//     showHeader showActions
//     onRegenerate={onRegenerate}
//     onDownload={onDownload}
//     onBack={onBack}
//     onNext={onNext}
//   />
//
// 사용 예시 (Step3 수정 영역 좌측):
//   <DocumentPreview documentType={docType} status="edited" content={currentDraft} mode="edit" />
//
// 사용 예시 (마이페이지 readonly):
//   <DocumentPreview documentType="notice" status="generated" content={doc.text} mode="readonly" />

const LOADING_SKELETON = () => (
  <div className="card" style={{
    minHeight: 480, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 20, padding: 40,
  }}>
    <div className="spinner" style={{ width: 36, height: 36 }} />
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>초안을 작성하고 있어요</div>
      <div className="muted" style={{ fontSize: 13 }}>
        형식에 맞춰 사건 경위를 정리하는 중입니다 · 약 30초
      </div>
    </div>
    <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
      {[60, 100, 85, 92].map((w, i) => (
        <div key={i} className="skel-bar" style={{ width: `${w}%` }} />
      ))}
    </div>
  </div>
);

const EMPTY_STATE = ({ documentType }) => (
  <div style={{
    minHeight: 320, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 16,
    color: "var(--color-neutral-fg-3)",
  }}>
    <Icon name="document" size={40} color="var(--color-neutral-fg-disabled)" />
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>초안이 아직 없어요</div>
      <div style={{ fontSize: 13 }}>정보를 입력하고 초안을 생성해 보세요.</div>
    </div>
  </div>
);

const ERROR_STATE = ({ message, onBack }) => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <Alert type="error" title="생성 오류" style={{ maxWidth: 500, margin: "0 auto 20px" }}>
      {message || "초안 생성에 실패했습니다. 다시 시도해 주세요."}
    </Alert>
    {onBack && (
      <Btn variant="primary" onClick={onBack} icon="chevronL">
        입력 화면으로 돌아가기
      </Btn>
    )}
  </div>
);

window.DocumentPreview = function DocumentPreview({
  documentType,
  mode         = "preview",
  status       = "generated",
  content      = "",
  errorMessage,
  maxWidth     = 800,
  padding      = "0",
  onRegenerate,
  onDownload,
  onBack,
  onNext,
  showHeader   = false,
  showActions  = false,
  style,
}) {
  const meta = window.DocTypeMeta ? window.DocTypeMeta(documentType) : { name: "문서" };

  return (
    <div style={style}>
      {/* 상단 헤더 (showHeader=true 시) */}
      {showHeader && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <h2 className="section-title">초안 미리보기</h2>
            <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
              <Icon name="document" size={14} color="var(--color-neutral-fg-3)" />
              {" "}{meta.name} · 제목은 맑은 고딕(굵게), 본문은 바탕체로 출력됩니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onRegenerate && (
              <Btn variant="secondary" icon="refresh"
                onClick={onRegenerate}
                disabled={status === "loading"}>
                다시 생성
              </Btn>
            )}
            {onDownload && content && (
              <Btn variant="secondary" icon="download"
                onClick={onDownload}
                disabled={status === "loading"}>
                .docx 받기
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* 본문 영역 */}
      {status === "loading" && <LOADING_SKELETON />}
      {status === "error"   && <ERROR_STATE message={errorMessage} onBack={onBack} />}
      {status === "empty"   && <EMPTY_STATE documentType={documentType} />}

      {(status === "generated" || status === "edited") && content && (
        <div className="doc-preview" style={{ maxWidth, margin: "0 auto", padding }}>
          <pre style={{
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "inherit", margin: 0,
            fontSize: 14, lineHeight: 1.9,
          }}>
            {content}
          </pre>
          <div className="doc-footer-note" style={{ marginTop: 32 }}>
            ※ 본 문서는 AI(Claude)가 자동 생성한 <b>참고용 초안</b>입니다.
            법적 효력이나 정확성을 보장하지 않으며, 실제 제출 전 변호사 검토를 권고합니다.
          </div>
        </div>
      )}

      {/* 하단 액션 버튼 (showActions=true, preview 모드) */}
      {showActions && mode === "preview" && (status === "generated" || status === "edited") && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          maxWidth, margin: "20px auto 0",
        }}>
          {onBack && (
            <Btn variant="ghost" icon="chevronL" onClick={onBack}>
              이전 (정보 수정)
            </Btn>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {onDownload && (
              <Btn variant="secondary" icon="download" onClick={onDownload}>
                .docx 받기
              </Btn>
            )}
            {onNext && (
              <Btn variant="primary" icon="chevronR" iconPos="right" onClick={onNext}>
                다음 (수정·저장)
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
