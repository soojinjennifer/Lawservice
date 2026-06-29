
// subscription_screen.js — 결제 내역 화면 (PRD v1.2 건별 결제 모델)
// 월정액 구독 → 건별 결제 전환. PaymentCardGrid · PaymentSummaryCard 재사용.

// [구조 참조용 목업] 실제 데이터는 GET /api/payment/history(FR-29)에서 로드한다.
// PurchaseTable이 API 응답 items[]를 사용하므로 아래 상수는 직접 렌더에 쓰이지 않으며,
// 서버 _history_item() 응답 스키마의 레퍼런스로만 보존한다.
const PURCHASE_HISTORY = [
  { paymentId: "p-001", docType: "준비서면",      title: "2026가합12345 매매계약 잔금 청구", amount: 49000, status: "DONE",      createdAt: "2026-05-24", receiptUrl: "#", refundable: false, refundableUntil: null },
  { paymentId: "p-002", docType: "내용증명",      title: "임대인 보증금 반환 통지",          amount: 9900,  status: "DONE",      createdAt: "2026-05-20", receiptUrl: "#", refundable: true,  refundableUntil: "2026-05-27" },
  { paymentId: "p-003", docType: "상대방 반박문", title: "손해배상 청구 반박 초안",          amount: 69000, status: "CANCELLED", createdAt: "2026-04-28", receiptUrl: "#", refundable: false, refundableUntil: null },
  { paymentId: "p-004", docType: "내용증명",      title: "(주)미지급상사 물품대금 독촉",      amount: 0,     status: "FREE",      createdAt: "2026-04-02", receiptUrl: null, refundable: false, refundableUntil: null },
];

// 결제 상태 → Badge variant / 라벨 매핑 (PRD §8.3)
const PAY_STATUS_META = {
  DONE:      { variant: "success", label: "완료" },
  FAILED:    { variant: "danger",  label: "실패" },
  CANCELLED: { variant: "neutral", label: "환불됨" },
  PENDING:   { variant: "warning", label: "처리중" },
  FREE:      { variant: "info",    label: "무료" },
};

function formatWon(amount) {
  return amount > 0 ? amount.toLocaleString("ko-KR") + "원" : "무료";
}

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
                ? <>무료 체험 <strong>{credits.trial_notice_remaining}건</strong> / 수정 <strong>{credits.trial_revision_remaining}회</strong> 잔여</>
                : <>무료 체험 1건 / 수정 3회 잔여 · 내용증명 첫 1건 무료(워터마크 포함)</>}
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
      <div className="screen-content" style={{ paddingTop: 0, paddingBottom: 0 }}><LegalNotice /></div>
      <SiteFooter />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PurchaseTable — GET /api/payment/history 연동 (FR-29).
// 로딩/에러/빈 상태는 기존 빈-상태 인라인 패턴을 재사용 (공통 LoadingState/ErrorState
// 컴포넌트가 아직 코드베이스에 없어 디자인 가디언 영역 침범을 피함).
function StatusBox({ icon, title, sub, action }) {
  return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--color-neutral-fg-3)", fontSize: 13 }}>
      <Icon name={icon} size={24} color="currentColor" />
      <div style={{ marginTop: 8, fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
      {action}
    </div>
  );
}

function PurchaseTable() {
  const [state, setState] = React.useState("loading"); // loading | ready | error
  const [rows, setRows] = React.useState([]);

  const load = React.useCallback(() => {
    setState("loading");
    window.LawAPI.payment.history()
      .then((data) => {
        setRows((data && data.items) || []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (state === "loading") {
    return <StatusBox icon="creditCard" title="결제 내역을 불러오는 중..." />;
  }
  if (state === "error") {
    return (
      <StatusBox
        icon="warning"
        title="결제 내역을 불러오지 못했습니다"
        action={
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={load}>
            다시 시도
          </button>
        }
      />
    );
  }
  if (!rows.length) {
    return (
      <StatusBox
        icon="creditCard"
        title="구매 내역이 없습니다"
        sub="첫 문서를 무료로 만들어 보세요"
      />
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
        {rows.map((r) => (
          <PaymentHistoryItem key={r.paymentId} payment={r} onRefunded={load} />
        ))}
      </tbody>
    </table>
  );
}

// ── PaymentHistoryItem (PRD §8.3 신규) ────────────────────────
// 결제 내역 1행. 기존 공통 컴포넌트(DocChip·Badge·Button)만 조합.
// props: payment = { paymentId, docType, title, amount, status, createdAt, receiptUrl, refundable, refundableUntil }
window.PaymentHistoryItem = function PaymentHistoryItem({ payment, onRefunded }) {
  const { paymentId, docType, title, amount, status, createdAt, receiptUrl, refundable } = payment;
  const meta = PAY_STATUS_META[status] || PAY_STATUS_META.PENDING;

  const handleRefund = () => {
    // 환불 API(/api/payment/cancel, FR-28) 실연동. 확인 모달 후 호출.
    window.AppModal.open({
      type: "warning",
      size: "sm",
      title: "환불을 신청하시겠습니까?",
      body: (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--color-neutral-fg-2)" }}>
          환불 시 해당 문서에 대한 접근 권한이 사라집니다.<br />
          결제일로부터 7일 이내, 문서 생성을 시작하지 않은 경우에만 환불할 수 있습니다.
        </p>
      ),
      actions: [
        { label: "취소", variant: "btn-secondary" },
        { label: "환불 신청", variant: "btn-danger", onClick: async () => {
          try {
            await window.LawAPI.payment.cancel(paymentId, "마이페이지 환불 신청");
            if (window.ToastManager) window.ToastManager.show({ type: "success", message: "환불이 완료되었습니다." });
            if (onRefunded) onRefunded();   // 목록 새로고침
          } catch (e) {
            if (window.ToastManager) window.ToastManager.show({ type: "error", message: e.message || "환불에 실패했습니다." });
          }
        } },
      ],
    });
  };

  return (
    <tr className="payment-history-item">
      <td className="muted">{createdAt}</td>
      <td><DocChip type={docType} size="sm" /></td>
      <td style={{ fontWeight: 600 }}>{title}</td>
      <td>{formatWon(amount)}</td>
      <td><Badge variant={meta.variant}>{meta.label}</Badge></td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {refundable && (
          <button className="btn btn-subtle btn-sm" onClick={handleRefund}>
            환불 신청
          </button>
        )}
        {receiptUrl && (
          <a className="btn btn-subtle btn-sm" href={receiptUrl} target="_blank" rel="noreferrer">
            <Icon name="download" size={12} /> 영수증 보기
          </a>
        )}
      </td>
    </tr>
  );
};
