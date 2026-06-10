// payment/PaymentSummaryCard.js — 건별 결제 카드 컴포넌트 (PRD v1.2 FR-21)
// onBuy: 결제 버튼 클릭 핸들러 (PurchaseConfirmModal 트리거)

// ── 상품 정의 (PRD v1.2 확정가) ──────────────────────────────
const PAYMENT_PRODUCTS = [
  {
    id: "notice",
    name: "내용증명",
    desc: "독촉·해지·통지 등 의사표시를 우체국이 공적으로 증명하는 문서 초안",
    price: 9900,
    priceLabel: "9,900원",
    unit: "/ 1건",
    features: [
      { text: "AI 초안 생성", ok: true },
      { text: ".docx 다운로드", ok: true },
      { text: "대화형 수정 3회", ok: true },
      { text: "첫 1건 무료 (워터마크 포함)", ok: true, highlight: true },
    ],
    isFeatured: false,
    freeTrialNote: "첫 1건 무료로 시작하세요",
  },
  {
    id: "brief",
    name: "준비서면",
    desc: "소송 중 나의 주장과 증거를 법원에 제출하는 서면 초안",
    price: 49000,
    priceLabel: "49,000원",
    unit: "/ 1건",
    features: [
      { text: "AI 초안 생성", ok: true },
      { text: ".docx 다운로드", ok: true },
      { text: "대화형 수정 3회", ok: true },
      { text: "사건 타임라인 자동 정리", ok: true },
    ],
    isFeatured: true,
    freeTrialNote: null,
  },
  {
    id: "rebuttal",
    name: "상대방 반박문",
    desc: "상대방 문서 분석 + 핵심 주장 추출 + 반박 목록 + 반박 초안",
    price: 69000,
    priceLabel: "69,000원",
    unit: "/ 1건",
    features: [
      { text: "상대방 주장 AI 분석", ok: true },
      { text: "반박 목록 자동 생성", ok: true },
      { text: "반박 초안 + .docx", ok: true },
      { text: "위험 문장 검사", ok: true },
    ],
    isFeatured: false,
    freeTrialNote: null,
  },
  {
    id: "appeal",
    name: "항소이유서",
    desc: "1심 판결에 불복하여 항소한 자가 제출하는 서면 초안",
    price: 99000,
    priceLabel: "99,000원",
    unit: "/ 1건",
    features: [
      { text: "AI 초안 생성", ok: true },
      { text: ".docx 다운로드", ok: true },
      { text: "v2.0 출시 예정", ok: false },
    ],
    isFeatured: false,
    freeTrialNote: null,
    comingSoon: true,
  },
];

window.PaymentSummaryCard = function PaymentSummaryCard({ product, onBuy }) {
  const {
    name, desc, price, priceLabel, unit,
    features, isFeatured, freeTrialNote, comingSoon,
  } = product;

  const handleBuy = () => {
    if (comingSoon) return;
    if (onBuy) {
      onBuy({ name, price, priceLabel });
    } else {
      window.openPaymentFlow({
        docType: name,
        price,
        priceLabel,
        onSuccess: () => { window.location.hash = "/create/1"; },
      });
    }
  };

  return (
    <div className={`payment-card${isFeatured ? " is-featured" : ""}`}>
      {isFeatured && (
        <span style={{
          display: "inline-block", marginBottom: 8,
          background: "var(--brand-rest)", color: "#fff",
          fontSize: 11, fontWeight: 700, padding: "3px 10px",
          borderRadius: 999,
        }}>추천</span>
      )}
      {comingSoon && (
        <span className="badge-v2" style={{ display: "inline-block", marginBottom: 8 }}>v2.0 예정</span>
      )}

      <div>
        <div className="payment-card-name">{name}</div>
        <p className="payment-card-desc" style={{ marginTop: 6 }}>{desc}</p>
      </div>

      <div>
        <div className="payment-card-price">
          {priceLabel}
          <span>{unit}</span>
        </div>
        {freeTrialNote && (
          <div className="payment-card-free-trial" style={{ marginTop: 8 }}>
            <Icon name="sparkle" size={12} color="currentColor" filled /> {freeTrialNote}
          </div>
        )}
      </div>

      <ul className="payment-card-features">
        {features.map((f, i) => (
          <li key={i}>
            <Icon
              name={f.ok ? "checkOnly" : "dismiss"}
              size={14}
              color={f.ok ? "var(--color-status-success-fg)" : "var(--color-neutral-fg-disabled)"}
            />
            <span style={{
              color: f.ok ? "var(--color-neutral-fg-1)" : "var(--color-neutral-fg-3)",
              fontWeight: f.highlight ? 600 : 400,
            }}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        className={`btn btn-lg${isFeatured ? " btn-primary" : " btn-secondary"}`}
        style={{ width: "100%" }}
        onClick={handleBuy}
        disabled={comingSoon}
      >
        {comingSoon
          ? "출시 예정"
          : freeTrialNote
            ? <><Icon name="sparkle" size={14} color={isFeatured ? "#fff" : "currentColor"} filled /> 무료로 시작하기</>
            : <><Icon name="creditCard" size={14} color={isFeatured ? "#fff" : "currentColor"} /> 문서 구매하기</>
        }
      </button>
    </div>
  );
};

// ── PaymentCardGrid: 전 상품 그리드 ─────────────────────────
window.PaymentCardGrid = function PaymentCardGrid({ onBuy }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 20,
    }}>
      {PAYMENT_PRODUCTS.map(p => (
        <PaymentSummaryCard key={p.id} product={p} onBuy={onBuy} />
      ))}
    </div>
  );
};

window.PAYMENT_PRODUCTS = PAYMENT_PRODUCTS;
