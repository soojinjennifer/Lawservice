// ui/DatePickerInput.js — 날짜 입력 + 커스텀 캘린더 팝업 (PRD v1.2 / TimelineRowEditor)
//
// Props:
//   value       : string — YYYY-MM-DD 형식
//   onChange    : (val: string) => void — YYYY-MM-DD 문자열 전달
//   placeholder : string — 기본 "YYYY-MM-DD"
//   size        : 'sm' | 'md'(기본) | 'lg'
//   state       : 'default' | 'error' | 'disabled'
//   label       : string — 필드 레이블 (선택)
//   required    : bool
//   helperText  : string
//   errorText   : string
//   id          : string
//
// 사용 예시:
//   <DatePickerInput value={date} onChange={val => setDate(val)} />
//   <DatePickerInput label="날짜" required state="error" errorText="날짜를 선택해 주세요" value={v} onChange={setV} />

window.DatePickerInput = function DatePickerInput({
  value        = "",
  onChange,
  placeholder  = "YYYY-MM-DD",
  size         = "md",
  state        = "default",
  label,
  required     = false,
  helperText,
  errorText,
  id,
  style,
}) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth();    // 0-indexed
  const todayDay   = today.getDate();

  // value → { year, month(0-idx), day } 파싱
  const parseValue = (v) => {
    if (!v || v.length < 10) return null;
    const y = parseInt(v.slice(0, 4), 10);
    const m = parseInt(v.slice(5, 7), 10) - 1;
    const d = parseInt(v.slice(8, 10), 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return { year: y, month: m, day: d };
  };

  const parsed = parseValue(value);

  const [viewYear,  setViewYear]  = React.useState(parsed?.year  ?? todayYear);
  const [viewMonth, setViewMonth] = React.useState(parsed?.month ?? todayMonth);

  // 팝업이 열릴 때 선택된 날짜(없으면 오늘)로 달력 뷰를 맞춤
  React.useEffect(() => {
    if (!open) return;
    const p = parseValue(value);
    if (p) { setViewYear(p.year); setViewMonth(p.month); }
    else   { setViewYear(todayYear); setViewMonth(todayMonth); }
  }, [open]);

  // 바깥 클릭 시 닫기
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isError    = state === "error";
  const isDisabled = state === "disabled";
  const sizeClass  = size === "lg" ? " input-lg" : size === "sm" ? " input-sm" : "";
  const stateClass = isError ? " input-error" : "";
  const uid = id || (label
    ? label.replace(/\s/g, "_") + "_dp_" + Math.random().toString(36).slice(2, 6)
    : undefined);

  // 날짜 선택 → 값 반영 후 팝업 닫기
  const handleSelect = (year, month, day) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange && onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleToday = () => handleSelect(todayYear, todayMonth, todayDay);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // 달력 셀 생성 (최대 6주 × 7일)
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday  = new Date(viewYear, viewMonth, 1).getDay(); // 0=일요일
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const MONTHS   = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const WEEKDAYS = ["일","월","화","수","목","금","토"];

  return (
    <div className="date-picker-wrap" ref={wrapperRef} style={style}>
      {label && (
        <label className="field-label" htmlFor={uid}>
          {label}{required && <span className="req" aria-hidden="true"> *</span>}
        </label>
      )}

      {/* 입력 필드 + 캘린더 아이콘 */}
      <div className="date-picker-field">
        <input
          id={uid}
          type="text"
          className={"input" + sizeClass + stateClass}
          placeholder={placeholder}
          value={value}
          maxLength={10}
          disabled={isDisabled}
          onChange={e => onChange && onChange(e.target.value)}
          aria-invalid={isError || undefined}
        />
        <button
          type="button"
          className="date-picker-btn"
          onClick={() => !isDisabled && setOpen(v => !v)}
          aria-label="날짜 선택"
          disabled={isDisabled}
          tabIndex={-1}
        >
          <Icon name="calendar" size={15} color="currentColor" />
        </button>
      </div>

      {/* 커스텀 캘린더 팝업 */}
      {open && (
        <div className="dpp" role="dialog" aria-label="날짜 선택">

          {/* 월 이동 헤더 */}
          <div className="dpp-header">
            <button type="button" className="dpp-nav" onClick={prevMonth} aria-label="이전 달">
              <Icon name="chevronL" size={16} />
            </button>
            <span className="dpp-title">{viewYear}년 {MONTHS[viewMonth]}</span>
            <button type="button" className="dpp-nav" onClick={nextMonth} aria-label="다음 달">
              <Icon name="chevronR" size={16} />
            </button>
          </div>

          {/* 날짜 그리드 */}
          <div className="dpp-grid">
            {WEEKDAYS.map(w => (
              <div key={w} className={"dpp-wday" + (w === "일" ? " dpp-sun" : w === "토" ? " dpp-sat" : "")}>{w}</div>
            ))}
            {cells.map((day, idx) => {
              if (!day) return <div key={"_" + idx} />;
              const col = idx % 7;
              const isSel   = parsed && day === parsed.day && viewMonth === parsed.month && viewYear === parsed.year;
              const isToday = day === todayDay && viewMonth === todayMonth && viewYear === todayYear;
              let cls = "dpp-day";
              if (isSel)        cls += " dpp-day--selected";
              else if (isToday) cls += " dpp-day--today";
              if (!isSel && col === 0) cls += " dpp-day--sun";
              if (!isSel && col === 6) cls += " dpp-day--sat";
              return (
                <button key={idx} type="button" className={cls}
                  onClick={() => handleSelect(viewYear, viewMonth, day)}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* 푸터: 오늘 링크 + 닫기 */}
          <div className="dpp-footer">
            <button type="button" className="dpp-today" onClick={handleToday}>오늘</button>
            <button type="button" className="dpp-close" onClick={() => setOpen(false)}>닫기</button>
          </div>
        </div>
      )}

      {isError && errorText ? (
        <span className="field-helper field-helper--error">{errorText}</span>
      ) : helperText ? (
        <span className="field-helper">{helperText}</span>
      ) : null}
    </div>
  );
};
