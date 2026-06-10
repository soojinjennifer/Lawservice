// ui/Button.js — 내편문서 공통 버튼 컴포넌트 (PRD v1.2 / 설계규칙 §Button)
// 기존 .btn CSS 클래스를 래핑. 신규 버튼 스타일 생성 금지.
//
// Props:
//   variant : 'primary' | 'secondary' | 'ghost' | 'danger' | 'text' | 'outline' | 'icon'
//   size    : 'sm' | 'md'(기본) | 'lg' | 'xl'
//   icon    : Icon name (string) | null  — iconPos='left'(기본) | 'right'
//   iconPos : 'left' | 'right'
//   loading : bool — 로딩 스피너 표시, 클릭 비활성
//   disabled: bool
//   width   : 'hug'(기본) | 'fill' — fill 시 width:100%
//   onClick : function
//   href    : string — 제공 시 <a> 태그로 렌더
//   dataNav : string — data-nav 속성 (SPA 라우터)
//   type    : 'button'(기본) | 'submit' | 'reset'
//   children: ReactNode
//
// 사용 예시:
//   <Btn variant="primary" size="lg" icon="sparkle">초안 생성하기</Btn>
//   <Btn variant="secondary" icon="download" iconPos="left">docx 받기</Btn>
//   <Btn variant="icon" icon="dismiss" aria-label="닫기" />
//   <Btn variant="primary" loading>처리 중...</Btn>
//   <Btn variant="ghost" width="fill" onClick={fn}>취소</Btn>

window.Btn = function Btn({
  variant   = "secondary",
  size      = "md",
  icon      = null,
  iconPos   = "left",
  iconColor: iconColorProp = null,
  loading   = false,
  disabled  = false,
  width     = "hug",
  onClick,
  href,
  dataNav,
  type      = "button",
  style,
  className = "",
  children,
  ...rest
}) {
  // CSS class 조합
  const variantMap = {
    primary:   "btn-primary",
    secondary: "btn-secondary",
    ghost:     "btn-subtle",
    danger:    "btn-danger",
    text:      "btn-subtle",
    outline:   "btn-outline",
    icon:      "",           // icon-only: icon-btn 클래스 사용
  };
  const sizeMap = { sm: "btn-sm", md: "", lg: "btn-lg", xl: "btn-xl" };

  const isIconOnly = variant === "icon";
  const baseClass   = isIconOnly ? "icon-btn" : "btn";
  const cls = [
    baseClass,
    !isIconOnly && variantMap[variant],
    !isIconOnly && sizeMap[size],
    className,
  ].filter(Boolean).join(" ");

  const isDisabled = disabled || loading;
  const iconColor  = iconColorProp || (variant === "primary" ? "#fff" : "currentColor");
  const iconSize   = size === "sm" ? 12 : size === "lg" || size === "xl" ? 16 : 14;

  const iconEl = icon ? (
    <Icon name={loading ? "refresh" : icon} size={iconSize} color={iconColor} />
  ) : null;

  const inner = loading ? (
    <>
      <span className="spinner" style={{ width: 14, height: 14 }} />
      {children}
    </>
  ) : (
    <>
      {iconEl && iconPos === "left"  && iconEl}
      {!isIconOnly && children}
      {iconEl && iconPos === "right" && iconEl}
      {isIconOnly && iconEl}
    </>
  );

  const commonProps = {
    className: cls,
    disabled: isDisabled,
    style: { ...(width === "fill" ? { width: "100%" } : {}), ...style },
    "data-nav": dataNav,
    "aria-busy": loading || undefined,
    ...rest,
  };

  if (href) {
    return <a href={href} {...commonProps}>{inner}</a>;
  }
  return (
    <button type={type} onClick={!isDisabled ? onClick : undefined} {...commonProps}>
      {inner}
    </button>
  );
};
