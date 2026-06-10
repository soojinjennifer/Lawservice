// ui/Modal.js — 내편문서 공통 모달 컴포넌트 (PRD v1.2)
// type: 'confirm' | 'guide' | 'warning' | 'payment'
// size: 'sm' | 'md' | 'lg'
// usage: window.AppModal.open({ type, title, body, actions })

// ── AppModal: 전역 단일 모달 관리 ────────────────────────────
window.AppModal = (() => {
  let _setModal = null;
  return {
    _register(setter) { _setModal = setter; },
    open(config) { if (_setModal) _setModal(config); },
    close()      { if (_setModal) _setModal(null); },
  };
})();

// ── Modal 컴포넌트 ────────────────────────────────────────────
window.AppModalRoot = function AppModalRoot() {
  const [modal, setModal] = React.useState(null);

  React.useEffect(() => {
    window.AppModal._register(setModal);
    return () => window.AppModal._register(null);
  }, []);

  // ESC 닫기
  React.useEffect(() => {
    if (!modal) return;
    const onKey = e => { if (e.key === "Escape") window.AppModal.close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  if (!modal) return null;

  const { type = "confirm", size = "md", title, body, actions, onClose } = modal;
  const sizeClass = `modal-${size}`;

  const handleClose = () => {
    if (onClose) onClose();
    window.AppModal.close();
  };

  const iconMap = { confirm: "check", guide: "help", warning: "bolt", payment: "creditCard" };
  const iconColorMap = {
    confirm: "var(--brand-rest)",
    guide:   "var(--color-neutral-fg-2)",
    warning: "var(--color-status-warning-fg)",
    payment: "var(--brand-rest)",
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: type === "warning" ? "var(--color-status-warning-bg)" : "var(--brand-light)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={iconMap[type] || "check"} size={16} color={iconColorMap[type]} />
            </span>
            <h2 id="modal-title" className="modal-title">{title}</h2>
          </div>
          <button className="icon-btn" aria-label="닫기" onClick={handleClose}>
            <Icon name="dismiss" size={18} />
          </button>
        </div>

        <div className="modal-body">{body}</div>

        {actions && (
          <div className="modal-footer">
            {actions.map((action, i) => (
              <button
                key={i}
                className={`btn btn-lg ${action.variant || (i === actions.length - 1 ? "btn-primary" : "btn-secondary")}`}
                onClick={() => { if (action.onClick) action.onClick(); window.AppModal.close(); }}
                disabled={action.disabled}
              >
                {action.icon && <Icon name={action.icon} size={14} color={i === actions.length - 1 ? "#fff" : "currentColor"} />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── PaymentFlowModal (FR-21) ──────────────────────────────────
// 단계형 결제 플로우: 확인 → 결제수단 선택 → 성공
// 사용: window.openPaymentFlow({ docType, price, priceLabel, onSuccess })
window.openPaymentFlow = function openPaymentFlow({ docType, price, priceLabel, onSuccess }) {
  function PaymentFlow({ closeModal }) {
    const [step, setStep] = React.useState("confirm"); // confirm | pay | success
    const [method, setMethod] = React.useState("card");
    const [loading, setLoading] = React.useState(false);

    const handlePay = () => {
      setLoading(true);
      // 실제 API: POST /api/purchase
      setTimeout(() => {
        setLoading(false);
        setStep("success");
      }, 1400);
    };

    if (step === "success") {
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: 60, height: 60, borderRadius: 999, margin: "0 auto 16px",
            background: "var(--color-status-success-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="checkOnly" size={28} color="var(--color-status-success-fg)" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>결제가 완료되었습니다!</div>
          <div className="muted" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            <b style={{ color: "var(--brand-rest)" }}>{docType}</b> 1건이 구매되었습니다.<br />
            지금 바로 문서 작성을 시작하세요.
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            onClick={() => { closeModal(); if (onSuccess) onSuccess(); window.location.hash = "/create/1"; }}
          >
            <Icon name="arrowR" size={15} color="#fff" /> 문서 만들기 시작
          </button>
        </div>
      );
    }

    if (step === "pay") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-neutral-fg-2)", marginBottom: 4 }}>
            결제 수단 선택
          </div>
          {[
            { id: "card",  label: "신용·체크카드",   icon: "creditCard" },
            { id: "kakao", label: "카카오페이",       icon: "bolt" },
            { id: "naver", label: "네이버페이",       icon: "shield" },
          ].map(m => (
            <div
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                border: `2px solid ${method === m.id ? "var(--brand-rest)" : "var(--color-neutral-stroke-2)"}`,
                background: method === m.id ? "var(--brand-light)" : "#fff",
                transition: "all .15s",
              }}
            >
              <Icon name={m.icon} size={18} color={method === m.id ? "var(--brand-rest)" : "var(--color-neutral-fg-2)"} />
              <span style={{ fontWeight: method === m.id ? 700 : 500, fontSize: 14 }}>{m.label}</span>
              {method === m.id && (
                <Icon name="checkOnly" size={16} color="var(--brand-rest)" style={{ marginLeft: "auto" }} />
              )}
            </div>
          ))}

          <div style={{
            background: "var(--color-neutral-bg-alt)", borderRadius: 8, padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 14, marginTop: 4,
          }}>
            <span className="muted">최종 결제 금액</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: "var(--brand-rest)" }}>{priceLabel}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep("confirm")}>
              이전
            </button>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 2 }}
              onClick={handlePay}
              disabled={loading}
            >
              <Icon name="creditCard" size={15} color="#fff" />
              {loading ? "결제 처리 중..." : `${priceLabel} 결제하기`}
            </button>
          </div>
        </div>
      );
    }

    // step === "confirm"
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {[
              ["문서 종류", docType],
              ["단가",     priceLabel],
              ["구매 수량", "1건"],
              ["결제 금액", <b style={{ color: "var(--brand-rest)" }}>{priceLabel}</b>],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--color-neutral-stroke-2)" }}>
                <td style={{ padding: "10px 0", color: "var(--color-neutral-fg-3)", width: 100 }}>{k}</td>
                <td style={{ padding: "10px 0", fontWeight: 600 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-neutral-fg-3)", lineHeight: 1.6 }}>
          결제 후 7일 이내 미사용 시 전액 환불됩니다.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={closeModal}>취소</button>
          <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep("pay")}>
            <Icon name="arrowR" size={15} color="#fff" /> 결제 수단 선택
          </button>
        </div>
      </div>
    );
  }

  window.AppModal.open({
    type: "payment",
    size: "sm",
    title: "문서 구매",
    body: <PaymentFlow closeModal={() => window.AppModal.close()} />,
  });
};

// ── PurchaseConfirmModal 헬퍼 (FR-21) ─────────────────────────
// 빠른 구매 확인 모달 열기 (단순 confirm용; 전체 플로우는 openPaymentFlow 사용)
window.openPurchaseConfirm = function openPurchaseConfirm({ docType, price, priceLabel, onConfirm }) {
  window.AppModal.open({
    type: "payment",
    size: "sm",
    title: "문서를 구매하시겠습니까?",
    body: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {[
              ["문서 종류", docType],
              ["단가",     priceLabel],
              ["구매 수량", "1건"],
              ["결제 금액", <b style={{ color: "var(--brand-rest)" }}>{priceLabel}</b>],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--color-neutral-stroke-2)" }}>
                <td style={{ padding: "10px 0", color: "var(--color-neutral-fg-3)", width: 100 }}>{k}</td>
                <td style={{ padding: "10px 0", fontWeight: 600 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-neutral-fg-3)", lineHeight: 1.6 }}>
          결제 후 7일 이내 미사용 시 전액 환불됩니다.
          결제 진행 시 <a href="#/faq" style={{ color: "var(--brand-rest)" }}>이용약관</a>에 동의한 것으로 간주합니다.
        </p>
      </div>
    ),
    actions: [
      { label: "취소", variant: "btn-secondary" },
      {
        label: "결제하고 문서 만들기",
        icon: "creditCard",
        variant: "btn-primary",
        onClick: onConfirm,
      },
    ],
  });
};
