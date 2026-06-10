
// subscription_screen.js — 결제 내역 화면 (PRD v1.2 건별 결제 모델)
// 월정액 구독 → 건별 결제 전환. PaymentCardGrid · PaymentSummaryCard 재사용.

// 샘플 구매 내역 (실제 API 연동 전 목업)
const PURCHASE_HISTORY = [
  { d: "2026-05-24", type: "준비서면",       title: "2026가합12345 매매계약 잔금 청구",   price: "49,000원", status: "완료" },
  { d: "2026-05-20", type: "내용증명",        title: "임대인 보증금 반환 통지",             price: "9,900원",  status: "완료" },
  { d: "2026-04-28", type: "상대방 반박문",   title: "손해배상 청구 반박 초안",            price: "69,000원", status: "완료" },
  { d: "2026-04-02", type: "내용증명",        title: "(주)미지급상사 물품대금 독촉",        price: "무료",     status: "무료" },
];

window.SubscriptionScreen = function SubscriptionScreen() {
  const { credits } = (typeof window.useCredits === "function")
    ? window.useCredits()
    : { credits: null };

  return (
    <div className="screen">
      <TopNav active="mypage" />

      <div className="screen-content">
        {/* 페이지 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-neutral-fg-3)" }}>
              <span>마이페이지</span>
              <Icon name="chevronR" size={12} color="var(--color-neutral-fg-3)" />
              <span style={{ color: "var(--color-neutral-fg-1)", fontWeight: 600 }}>결제 내역</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 0" }}>결제 내역</h1>
          </div>
        </div>

        {/* 서브 탭 */}
        <SubTabBar active="subscription" />

        {/* 무료 체험 배너 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #EDF3FF 0%, #E6F0FF 100%)",
          border: "1px solid #C3D4F8",
          borderRadius: 12,
          padding: "18px 24px",
          marginBottom: 32,
          gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--brand-rest)", display: "inline-flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name="sparkle" size={20} color="#fff" filled />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-neutral-fg-1)" }}>
                무료 체험 혜택이 남아있어요
              </div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-fg-2)", marginTop: 3 }}>
                {credits
                ? <>내용증명 <strong>{credits.trial_notice_remaining}건</strong> · 대화형 수정 <strong>{credits.trial_revision_remaining}회</strong> 잔여</>
                : <>내용증명 첫 1건 무료(워터마크 포함) · 대화형 수정 <strong>3회</strong> 잔여</>}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            data-nav="/create/1"
            style={{ flexShrink: 0 }}
          >
            <Icon name="sparkle" size={14} color="#fff" filled /> 무료로 시작하기
          </button>
        </div>

        {/* 문서 종류별 요금 */}
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          문서 종류별 요금
        </h2>
        <PaymentCardGrid />

        {/* 구매 내역 */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 36 }}>
          <div className="card-flat" style={{ padding: 0 }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-neutral-stroke-2)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>구매 내역</h3>
            </div>
            <PurchaseTable />
          </div>

          {/* 결제 수단 */}
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>결제 수단</h3>
            <div style={{
              border: "1px solid var(--color-neutral-stroke-2)", borderRadius: 8,
              padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
              marginBottom: 12, background: "var(--color-neutral-bg-alt)",
            }}>
              <div style={{
                width: 40, height: 28, borderRadius: 4,
                background: "linear-gradient(135deg, #1A1F71, #0F65BD)",
                color: "#fff", display: "inline-flex", alignItems: "center",
                justifyContent: "center", fontSize: 9, fontWeight: 700, letterSpacing: 1,
              }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>•••• •••• •••• 4242</div>
                <div className="muted" style={{ fontSize: 12 }}>만료 09/28 · 기본 결제 수단</div>
              </div>
              <button className="icon-btn"><Icon name="more" size={16} /></button>
            </div>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              <Icon name="plus" size={14} /> 결제 수단 추가
            </button>

            <hr className="divider" style={{ margin: "20px 0" }} />

            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>영수증 안내</h4>
            <p className="muted" style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              구매 완료 후 가입하신 이메일로 영수증이 자동 발송됩니다.<br />
              위 구매 내역에서도 건별로 다운로드하실 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <LegalNotice />
      <SiteFooter />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
function PurchaseTable() {
  if (!PURCHASE_HISTORY.length) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--color-neutral-fg-3)", fontSize: 13 }}>
        <Icon name="creditCard" size={24} color="currentColor" />
        <div style={{ marginTop: 8, fontWeight: 600 }}>구매 내역이 없습니다</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>첫 문서를 무료로 만들어 보세요</div>
      </div>
    );
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>일시</th>
          <th>문서 종류</th>
          <th>제목</th>
          <th>금액</th>
          <th>상태</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {PURCHASE_HISTORY.map((r, i) => (
          <tr key={i}>
            <td className="muted">{r.d}</td>
            <td>
              <DocChip type={r.type} size="sm" />
            </td>
            <td style={{ fontWeight: 600 }}>{r.title}</td>
            <td>{r.price}</td>
            <td>
              <Badge variant={r.status === "무료" ? "info" : "success"}>{r.status}</Badge>
            </td>
            <td style={{ textAlign: "right" }}>
              {r.status !== "무료" && (
                <button className="btn btn-subtle btn-sm">
                  <Icon name="download" size={12} /> 영수증
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
