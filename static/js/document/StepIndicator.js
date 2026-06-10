// document/StepIndicator.js — 단계 표시 컴포넌트 (PRD v1.2 / 설계규칙 §StepIndicator)
// 기존 components.js의 Steps + create_screen.js의 ClickableSteps를 통합.
// 기존 .steps CSS 클래스를 그대로 사용.
//
// Props:
//   steps    : [{ eyebrow, label }] — 단계 목록
//             미제공 시 문서 생성 3단계 기본값 사용
//   current  : number (1-based, 기본 1)
//   size     : 'md'(기본) | 'sm' — sm은 대시보드 카드 내부용
//   clickable: bool — true 시 완료된 이전 단계 클릭 복귀 가능
//   onGoTo   : function(n) — clickable=true 시 단계 클릭 핸들러
//
// 사용 예시 (문서 생성):
//   <StepIndicator current={step} clickable onGoTo={n => setStep(n)} />
//
// 사용 예시 (커스텀 단계):
//   <StepIndicator
//     steps={[
//       { eyebrow: "STEP 1", label: "문서 선택" },
//       { eyebrow: "STEP 2", label: "정보 입력" },
//       { eyebrow: "STEP 3", label: "결제" },
//     ]}
//     current={2}
//   />
//
// 사용 예시 (대시보드 카드 내 미니):
//   <StepIndicator current={2} size="sm" />

const DEFAULT_STEPS = [
  { eyebrow: "STEP 1", label: "문서 정보 입력" },
  { eyebrow: "STEP 2", label: "초안 미리보기" },
  { eyebrow: "STEP 3", label: "수정 및 저장" },
];

window.StepIndicator = function StepIndicator({
  steps    = DEFAULT_STEPS,
  current  = 1,
  size     = "md",
  clickable = false,
  onGoTo,
}) {
  const isSm = size === "sm";

  return (
    <div
      className="steps"
      style={isSm ? { gap: 4 } : undefined}
      role="list"
      aria-label="진행 단계"
    >
      {steps.map((it, i) => {
        const n     = i + 1;
        const isDone    = current > n;
        const isCurrent = current === n;
        const stateClass = isCurrent ? "is-current" : isDone ? "is-done" : "";
        const isClickableStep = clickable && isDone && typeof onGoTo === "function";

        return (
          <React.Fragment key={n}>
            <div
              className={`step ${stateClass}`}
              role={isClickableStep ? "button" : "listitem"}
              tabIndex={isClickableStep ? 0 : undefined}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${it.eyebrow}: ${it.label}${isDone ? " (완료)" : isCurrent ? " (현재)" : " (예정)"}`}
              onClick={isClickableStep ? () => onGoTo(n) : undefined}
              onKeyDown={isClickableStep ? (e => { if (e.key === "Enter" || e.key === " ") onGoTo(n); }) : undefined}
              style={isSm ? { padding: "6px 8px" } : undefined}
            >
              <span className="step-num" style={isSm ? { width: 20, height: 20, fontSize: 10 } : undefined}>
                {isDone
                  ? <Icon name="checkOnly" size={isSm ? 11 : 14} color="currentColor" />
                  : n
                }
              </span>
              {!isSm && (
                <div className="step-label-wrap">
                  <span className="step-eyebrow">{it.eyebrow}</span>
                  <span className="step-label">{it.label}</span>
                </div>
              )}
              {isSm && (
                <span className="step-label" style={{ fontSize: 11 }}>{it.label}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className={`step-sep${isDone ? " is-done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
