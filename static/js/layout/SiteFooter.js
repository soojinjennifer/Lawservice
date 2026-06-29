// layout/SiteFooter.js — 내편문서 전 화면 공통 푸터 (PRD v1.2)
// 소유·운영: 주식회사 더그라운드모여 (TheGroundMOYO Inc.)
// copyright@TheGroundMOYO

window.SiteFooter = function SiteFooter() {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: "서비스",
      links: [
        { label: "문서 생성",          path: "/create/1" },
        { label: "법률 문서 도움말",   path: "/help" },
        { label: "요금제",             path: "/subscription" },
        { label: "사용 사례",          path: "/faq" },
      ],
    },
    {
      title: "고객지원",
      links: [
        { label: "FAQ",              path: "/faq" },
        { label: "문의하기",         href: "mailto:cs@thegroundmoyo.com" },
        { label: "공지사항",         href: "#" },
        { label: "이용 가이드",      path: "/help" },
      ],
    },
    {
      title: "회사",
      links: [
        { label: "회사 소개",          href: "#" },
        { label: "이용약관",           href: "#" },
        { label: "개인정보처리방침",   href: "#" },
        { label: "AI 윤리정책",        href: "#" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
      <div className="site-footer-grid">
        {/* 브랜드 컬럼 */}
        <div className="site-footer-brand">
          <ServiceMark light />
          <p className="site-footer-brand-tagline" style={{ marginTop: 16 }}>
            억울한 일을 법률문서의 언어로 정리해드립니다.<br />
            변호사 상담 전, 내 사건을 가장 잘 아는 내가 직접 준비하는 내편문서 서비스.
          </p>
          {/* <p className="site-footer-brand-company">주식회사 더그라운드모여 (TheGroundMOYO Inc.)</p> */}
        </div>

        {/* 링크 컬럼들 */}
        {cols.map(col => (
          <div key={col.title}>
            <div className="site-footer-col-title">{col.title}</div>
            <div className="site-footer-col-links">
              {col.links.map(link => (
                link.href
                  ? <a key={link.label} href={link.href} target={link.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer">{link.label}</a>
                  : <button key={link.label} type="button" data-nav={link.path}>{link.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="site-footer-bottom">
        <span>© {year} 주식회사 더그라운드모여 · 내편문서가 생성하는 모든 문서는 참고용 초안이며 법적 효력을 보장하지 않습니다.</span>
        <span>copyright@TheGroundMOYO</span>
      </div>
      </div>
    </footer>
  );
};
