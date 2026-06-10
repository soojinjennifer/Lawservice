// ui/Input.js — TextInput / Textarea / Select 통합 (PRD v1.2 / 설계규칙 §Input)
// 기존 .input / .textarea / .select CSS를 래핑.
//
// ── TextInput ────────────────────────────────────────────────
// Props:
//   type        : 'text'(기본) | 'email' | 'phone' | 'date' | 'number' | 'password'
//   size        : 'sm' | 'md'(기본) | 'lg'
//   state       : 'default' | 'error' | 'disabled' | 'readonly'
//   label       : string — 필드 레이블
//   required    : bool
//   helperText  : string — 하단 도움말
//   errorText   : string — 에러 메시지 (state=error 시)
//   leadingIcon : Icon name — 입력창 좌측 아이콘
//   showToggle  : bool — type=password 일 때 보기/숨기기 버튼 표시 (로그인·가입에 사용)
//   placeholder : string
//   value / onChange / ...rest
//
// 사용 예시:
//   <TextInput label="성명 / 법인명" required placeholder="홍길동" value={v} onChange={e=>setV(e.target.value)} />
//   <TextInput label="비밀번호" type="password" showToggle leadingIcon="lock" required />
//   <TextInput label="법원" state="error" errorText="법원명을 입력해 주세요" />

window.TextInput = function TextInput({
  type        = "text",
  size        = "md",
  state       = "default",
  label,
  required    = false,
  helperText,
  errorText,
  leadingIcon,
  showToggle  = false,
  style,
  className   = "",
  id,
  ...rest
}) {
  const [visible, setVisible] = React.useState(false);
  const uid = id || (label ? label.replace(/\s/g, "_") + "_" + Math.random().toString(36).slice(2,6) : undefined);
  const sizeClass = size === "lg" ? " input-lg" : size === "sm" ? " input-sm" : "";
  const cls = ["input", sizeClass, className].filter(Boolean).join(" ");
  const isError    = state === "error";
  const isDisabled = state === "disabled";
  const isReadonly = state === "readonly";
  const resolvedType = (type === "password" && showToggle && visible) ? "text" : type;

  return (
    <div className="field" style={style}>
      {label && (
        <label className="field-label" htmlFor={uid}>
          {label}
          {required && <span className="req" aria-hidden="true"> *</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {leadingIcon && (
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }}>
            <Icon name={leadingIcon} size={16} color="var(--color-neutral-fg-3)" />
          </span>
        )}
        <input
          id={uid}
          type={resolvedType}
          className={cls}
          disabled={isDisabled}
          readOnly={isReadonly}
          aria-invalid={isError || undefined}
          aria-describedby={helperText || errorText ? `${uid}_help` : undefined}
          style={{
            paddingLeft:  leadingIcon  ? 34 : undefined,
            paddingRight: showToggle   ? 40 : undefined,
            borderColor:  isError ? "var(--color-status-danger-fg)" : undefined,
          }}
          {...rest}
        />
        {/* 비밀번호 보기/숨기기 토글 */}
        {showToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: "var(--color-neutral-fg-3)", display: "flex", alignItems: "center",
            }}
          >
            <Icon name={visible ? "eyeOff" : "eye"} size={16} color="currentColor" />
          </button>
        )}
      </div>
      {(helperText || (isError && errorText)) && (
        <div
          id={`${uid}_help`}
          className="field-help"
          style={{ color: isError ? "var(--color-status-danger-fg)" : undefined }}
        >
          {isError && errorText ? errorText : helperText}
        </div>
      )}
    </div>
  );
};

// ── Textarea ─────────────────────────────────────────────────
// Props: label, required, helperText, errorText, state, rows, ...rest
//
// 사용 예시:
//   <Textarea label="사건 경위·핵심 내용" required rows={6}
//     helperText="AI가 본문 서술에 활용합니다. 자세할수록 좋아요."
//     value={facts} onChange={e=>setFacts(e.target.value)} />

window.Textarea = function Textarea({
  state       = "default",
  label,
  required    = false,
  helperText,
  errorText,
  rows        = 4,
  style,
  className   = "",
  id,
  ...rest
}) {
  const uid = id || (label ? label.replace(/\s/g, "_") + "_" + Math.random().toString(36).slice(2,6) : undefined);
  const isError    = state === "error";
  const isDisabled = state === "disabled";
  const cls = ["textarea", className].filter(Boolean).join(" ");

  return (
    <div className="field" style={style}>
      {label && (
        <label className="field-label" htmlFor={uid}>
          {label}
          {required && <span className="req" aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        id={uid}
        rows={rows}
        className={cls}
        disabled={isDisabled}
        aria-invalid={isError || undefined}
        style={{ borderColor: isError ? "var(--color-status-danger-fg)" : undefined }}
        {...rest}
      />
      {(helperText || (isError && errorText)) && (
        <div className="field-help" style={{ color: isError ? "var(--color-status-danger-fg)" : undefined }}>
          {isError && errorText ? errorText : helperText}
        </div>
      )}
    </div>
  );
};

// ── Select ───────────────────────────────────────────────────
// Props: label, required, helperText, errorText, state, options, placeholder, ...rest
// options: [{ value, label }] | string[]
//
// 사용 예시:
//   <Select label="상대방 문서 종류" required
//     options={[{value:'notice', label:'내용증명 수신'}, ...]}
//     value={v} onChange={e=>setV(e.target.value)} />

window.Select = function Select({
  state       = "default",
  label,
  required    = false,
  helperText,
  errorText,
  options     = [],
  placeholder,
  style,
  className   = "",
  id,
  ...rest
}) {
  const uid = id || (label ? label.replace(/\s/g, "_") + "_" + Math.random().toString(36).slice(2,6) : undefined);
  const isError    = state === "error";
  const isDisabled = state === "disabled";
  const cls = ["select", className].filter(Boolean).join(" ");

  return (
    <div className="field" style={style}>
      {label && (
        <label className="field-label" htmlFor={uid}>
          {label}
          {required && <span className="req" aria-hidden="true"> *</span>}
        </label>
      )}
      <select
        id={uid}
        className={cls}
        disabled={isDisabled}
        aria-invalid={isError || undefined}
        style={{ borderColor: isError ? "var(--color-status-danger-fg)" : undefined }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => {
          const val   = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
      {(helperText || (isError && errorText)) && (
        <div className="field-help" style={{ color: isError ? "var(--color-status-danger-fg)" : undefined }}>
          {isError && errorText ? errorText : helperText}
        </div>
      )}
    </div>
  );
};
