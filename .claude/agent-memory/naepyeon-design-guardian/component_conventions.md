---
name: component-conventions
description: Non-obvious UI conventions — Toast API name, Button variant→CSS class mapping, missing btn CSS, Icon set has no "warning" glyph
metadata:
  type: project
---

Verified 2026-06-21 while implementing 건별결제 UI.

**Toast**: global API is `window.ToastManager.show({ type, message, duration })`. There is NO `window.showToast`. PRD pseudocode says `showToast(...)` but the real call is `ToastManager.show`. Container component is `window.ToastContainer`.
**Why:** PRD examples use a different name than the actual code.
**How to apply:** Always call `window.ToastManager.show(...)` for toasts.

**Button variant → CSS class** (static/js/ui/Button.js variantMap): primary→btn-primary, secondary→btn-secondary, ghost→**btn-subtle**, text→btn-subtle, danger→btn-danger, outline→btn-outline, icon→icon-btn. There is NO `.btn-ghost` class. Use `btn-subtle` for ghost-style buttons in raw className usage.

**Missing CSS:** `.btn-danger` had NO CSS until I added it (styles.css after .btn-subtle, uses --color-status-danger-fg bg). `danger` was a declared Button variant but unstyled.

**Icon set (static/js/icons.js):** has NO `warning` icon — passing name="warning" renders a fallback dot. Modal.js historically maps warning type → `bolt` icon. For error/fail glyphs use `dismiss` (X) or `bolt`. Available: home, document, docEdit, help, person, bell, settings, search, chevronD/R/L, arrowR, add, dismiss, more, check, checkOnly, sparkle, send, download, upload, save, mail, chat, creditCard, bolt, refresh, eye, lock, shield, clock, gavel, etc.

**Modal system:** `window.AppModal.open({type,size,title,body,actions})`. types: confirm|guide|warning|payment. Stepped payment flow = `window.openPaymentFlow({docType,price,priceLabel,onSuccess})` in Modal.js; quick confirm = `window.openPurchaseConfirm(...)`.

**PaymentModal step:fail (FR-27)** added to openPaymentFlow: steps confirm|pay|success|fail. failType ∈ USER_CANCEL|LIMIT_EXCEEDED|CARD_ERROR|NETWORK_ERROR|AMOUNT_MISMATCH. AMOUNT_MISMATCH shows [닫기] only. Test-mode banner shows when `window.PAYMENT_CONFIG.testMode===true`; `_mockForceFail` triggers fail in mock.
