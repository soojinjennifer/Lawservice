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
window.openPaymentFlow = function openPaymentFlow({ docType, price, priceLabel, onSuccess, context }) {
  context = context || 'purchase'; // 'purchase' | 'revision'
  function PaymentFlow({ closeModal }) {
    const [step, setStep] = React.useState("confirm"); // confirm | pay | success | fail
    const [method, setMethod] = React.useState("card");
    const [loading, setLoading] = React.useState(false);
    const [failType, setFailType] = React.useState(null); // FR-27 실패 유형

    const isTestMode = !!(window.PAYMENT_CONFIG && window.PAYMENT_CONFIG.testMode);

    const handlePay = async () => {
      // 결제 전 로그인 확인 (getUserId는 동기 캐시; 없으면 async 세션 재확인)
      let userId = window.AuthStore && window.AuthStore.getUserId && window.AuthStore.getUserId();
      if (!userId) {
        try {
          const sr = await (window.AuthStore && window.AuthStore.getSession
            ? window.AuthStore.getSession() : Promise.resolve({}));
          const s = sr && sr.data && sr.data.session;
          userId = s && s.user && s.user.id;
        } catch (_) {}
      }
      if (!userId) {
        setFailType("UNAUTHORIZED");
        setStep("fail");
        return;
      }
      setLoading(true);
      const forced = window.PAYMENT_CONFIG && window.PAYMENT_CONFIG._mockForceFail;
      try {
        // 1) 결제 준비 — 서버가 orderId·정가 발급 (FR-25)
        const prep = await window.LawAPI.payment.prepare(docType);

        // 2) 결제 승인.
        //   · testMode/mock: TossPayments 팝업 없이 confirm API 직접 호출
        //   · Phase 2 실연동: 여기서 TossPayments.requestPayment(팝업) 후 paymentKey 수령
        const res = await window.LawAPI.payment.confirm({
          paymentKey: prep.payment_key || null,
          orderId: prep.order_id,
          amount: prep.amount,
          mockForceFail: forced || undefined,   // PRD §5.3 강제 실패 (개발용)
        });

        setLoading(false);
        // 서버 confirm 성공 계약: { success: true, ... } (payment_routes.py confirm)
        if (res && res.success) {
          setStep("success");
        } else {
          setFailType("NETWORK_ERROR");
          setStep("fail");
        }
      } catch (e) {
        setLoading(false);
        // 멱등성(NFR-PAY-03): 동일 orderId 가 이미 DONE 이면 409 ALREADY_CONFIRMED.
        // 이는 결제가 이미 성공한 상태이므로 실패가 아니라 성공으로 처리한다.
        // (onSuccess 재호출 등으로 confirm 이 중복 진입한 케이스)
        if (e.status === 409 || e.code === "ALREADY_CONFIRMED") {
          console.log("[payment] confirm 중복(409) — 이미 결제 완료 상태로 간주, success 처리");
          setStep("success");
          return;
        }
        // 서버가 failType을 내려주면 그대로 사용하고, 없으면 에러 코드 기반으로 매핑한다 (FR-27).
        // status code 단독 추정(401→USER_CANCEL)은 오판 소지가 있어 보조 수단으로만 사용.
        const ft = (e.body && e.body.failType)
          || (e.code === "AMOUNT_MISMATCH" ? "AMOUNT_MISMATCH" : null)
          || (e.code === "MOCK_FORCED_FAIL" ? "NETWORK_ERROR" : null)
          || (e.status === 401 ? "UNAUTHORIZED" : "NETWORK_ERROR");
        setFailType(ft);
        setStep("fail");
      }
    };

    // FR-27 실패 유형별 안내 문구
    const FAIL_MESSAGES = {
      USER_CANCEL:     "결제가 취소되었습니다.",
      UNAUTHORIZED:    "로그인이 필요합니다. 로그인 후 다시 시도해주세요.",
      LIMIT_EXCEEDED:  "결제 한도가 초과되었습니다. 다른 카드를 사용해주세요.",
      CARD_ERROR:      "카드 정보를 확인해주세요.",
      NETWORK_ERROR:   "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      AMOUNT_MISMATCH: "결제 정보에 오류가 발생했습니다. 고객센터에 문의해주세요.",
    };

    if (step === "fail") {
      // 미로그인: 로그인 유도 / 금액불일치: 닫기만 / 그 외: 재시도
      const isUnauth = failType === "UNAUTHORIZED";
      const canRetry = !isUnauth && failType !== "AMOUNT_MISMATCH";
      return (
        <div className="payment-fail-step">
          <div className="payment-fail-icon">
            <Icon name="dismiss" size={28} color="var(--color-status-danger-fg)" />
          </div>
          <div className="payment-fail-title">결제가 완료되지 않았습니다</div>
          <div className="payment-fail-message">
            {FAIL_MESSAGES[failType] || FAIL_MESSAGES.NETWORK_ERROR}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {isUnauth && (
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
                onClick={() => { closeModal(); window.location.hash = "/login"; }}
              >
                <Icon name="arrowR" size={15} color="#fff" /> 로그인하러 가기
              </button>
            )}
            {canRetry && (
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
                onClick={() => { setFailType(null); setStep("confirm"); }}
              >
                <Icon name="arrowR" size={15} color="#fff" /> 다시 시도
              </button>
            )}
            <button
              className="btn btn-subtle btn-lg"
              style={{ flex: 1 }}
              onClick={closeModal}
            >
              닫기
            </button>
          </div>
        </div>
      );
    }

    if (step === "success") {
      const isRevision = context === 'revision';
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: 60, height: 60, borderRadius: 999, margin: "0 auto 16px",
            background: "var(--color-status-success-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="checkOnly" size={28} color="var(--color-status-success-fg)" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>결제가 처리되었습니다.</div>
          <div className="muted" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {isRevision
              ? "이제 문서 수정이 가능합니다."
              : <><b style={{ color: "var(--brand-rest)" }}>{docType}</b> 1건이 구매되었습니다.<br />지금 바로 문서 작성을 시작하세요.</>
            }
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            onClick={() => {
              closeModal();
              if (onSuccess) onSuccess();
              if (!isRevision) window.location.hash = "/create/1";
            }}
          >
            <Icon name="arrowR" size={15} color="#fff" /> {isRevision ? "확인" : "문서 만들기 시작"}
          </button>
        </div>
      );
    }

    if (step === "pay") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isTestMode && (
            <div className="payment-test-banner">
              <Icon name="bolt" size={14} color="var(--color-status-warning-fg)" filled />
              <span>테스트 모드 — 실제 결제가 발생하지 않습니다</span>
            </div>
          )}
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
