const BETA_SKIP_KEY = "naepyeon_beta_skip_date";

window.betaSkippedToday = function betaSkippedToday() {
  const stored = localStorage.getItem(BETA_SKIP_KEY);
  if (!stored) return false;
  return stored === new Date().toISOString().slice(0, 10);
};

window.BetaPopup = function BetaPopup({ onClose }) {
  const END_DATE = "8월 15일(토)";
  const [skipToday, setSkipToday] = React.useState(false);

  function handleClose() {
    if (skipToday) {
      localStorage.setItem(BETA_SKIP_KEY, new Date().toISOString().slice(0, 10));
    }
    onClose();
  }

  function handleSignup() { onClose(); window.location.hash = "#/signup"; }
  function handleExplore() { onClose(); }

  return (
    <div
      className="beta-popup-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="beta-popup" role="dialog" aria-modal="true">

        {/* ── 다크 섹션: 그라데이션 배경 + 타이틀 + 3 카드 ── */}
        <div className="beta-popup-dark">

          {/* X 닫기 버튼 (absolute, top-right) */}
          <button className="beta-popup-close" onClick={handleClose} aria-label="닫기">✕</button>

          {/* 배지 + 부제목 행 */}
          <div className="beta-popup-toprow">
            <span className="beta-popup-badge">BETA OPEN</span>
            <span className="beta-popup-announce">내편문서 베타 서비스 안내</span>
          </div>

          {/* 메인 타이틀 */}
          <div className="beta-popup-title-wrap">
            <p className="beta-popup-title">
              내편문서 <span className="beta-popup-title-accent">베타 서비스</span>가<br />
              문을 열었습니다
            </p>
          </div>

          {/* 서브 타이틀 */}
          <p className="beta-popup-subtitle">
            지금 베타 서비스 대상자를 모집하고 있어요.<br />
            베타 기간에는 모든 서비스를 무료로 이용하실 수 있습니다.
          </p>

          {/* 3개 카드 (full-width 오버레이 영역) */}
          <div className="beta-popup-cards">

            {/* 카드 1: 다크 파란 테두리, rotate -1.2deg */}
            <div className="beta-popup-card-row beta-popup-card--dark">
              <div className="beta-popup-card-inner">
                <span className="beta-popup-card-label">베타 대상자 모집 중</span>
                <span className="beta-popup-card-sub">선착순</span>
              </div>
            </div>

            {/* 카드 2: 반투명 화이트, rotate 0.8deg */}
            <div className="beta-popup-card-row beta-popup-card-row--sm beta-popup-card--white">
              <div className="beta-popup-card-inner">
                <span className="beta-popup-card-label">
                  <span style={{ color: "#2A4FA8", fontWeight: 700 }}>{END_DATE}</span>
                  <span style={{ color: "#16255C", fontWeight: 700 }}>까지 진행</span>
                </span>
                <span className="beta-popup-card-sub">D-DAY 한정</span>
              </div>
            </div>

            {/* 카드 3: 옐로우 그라데이션, rotate -0.8deg */}
            <div className="beta-popup-card-row beta-popup-card--yellow" style={{ paddingTop: 1 }}>
              <div className="beta-popup-card-inner">
                <span className="beta-popup-card-label">기간 내 모든 서비스 무료</span>
                <span className="beta-popup-card-sub">FREE</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 화이트 섹션: 정보 테이블 + 버튼 ── */}
        <div className="beta-popup-body">

          {/* 정보 테이블 */}
          <div className="beta-popup-table">
            <div className="beta-popup-trow">
              <span className="beta-popup-trow-label">모집 대상</span>
              <span className="beta-popup-trow-value">내편문서 베타 서비스 참여자 (선착순 모집)</span>
            </div>
            <div className="beta-popup-trow-divider" />
            <div className="beta-popup-trow">
              <span className="beta-popup-trow-label">기간</span>
              <span className="beta-popup-trow-value">
                지금부터 <strong style={{ color: "#1F3C88" }}>{END_DATE}</strong>까지
              </span>
            </div>
            <div className="beta-popup-trow-divider" />
            <div className="beta-popup-trow">
              <span className="beta-popup-trow-label">혜택</span>
              <span className="beta-popup-trow-value">
                내용증명·준비서면 등{" "}
                <strong style={{ color: "#1F3C88" }}>모든 문서 서비스 무료</strong>
              </span>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="beta-popup-actions">
            <button className="beta-popup-btn-primary" onClick={handleSignup}>
              베타 서비스 회원가입하기
            </button>
            <button className="beta-popup-btn-secondary" onClick={handleExplore}>
              서비스 둘러보기
            </button>
          </div>

        </div>

        {/* ── 푸터: 체크박스 + 닫기 ── */}
        <div className="beta-popup-footer">
          <label className="beta-popup-skip-label">
            <input
              type="checkbox"
              className="beta-popup-skip-checkbox"
              checked={skipToday}
              onChange={e => setSkipToday(e.target.checked)}
            />
            <span className="beta-popup-skip-text">오늘 하루 보지 않기</span>
          </label>
          <button className="beta-popup-dismiss" onClick={handleClose}>닫기</button>
        </div>

      </div>
    </div>
  );
};
