---
name: component-locations
description: File paths of all common components (window globals) under static/js, grouped by CLAUDE.md folder
metadata:
  type: project
---

All under `C:\Users\sooji\OneDrive\LawService\static\js\`:

- ui/: Button.js (Btn), Card.js (Card/CardFlat), Input.js (TextInput/Textarea/Select), Badge.js (Badge/DocStatusBadge), Alert.js, Modal.js (Modal/openPaymentFlow/openPurchaseConfirm), Toast.js (ToastContainer/ToastManager), EmpathyBubble.js, DocChip.js, Accordion.js, SearchFilterBar.js, YesNoToggle.js, AuthWidgets.js
- document/: StepIndicator.js, FormSection.js (FormSection/TimelineRowEditor), DocumentTypeCard.js (DocumentTypeCard/DocumentTypePicker), DocumentPreview.js, EvidenceUploader.js, OpponentDocAnalysis.js
- payment/: PaymentSummaryCard.js (PaymentSummaryCard/PaymentCardGrid)
- dashboard/: CaseProgressCard
- feedback/: LoadingState.js, EmptyState.js, ErrorState.js, Pagination.js (all window.LoadingState/EmptyState/ErrorState/Pagination; context prop = list|preview|payment|upload; EmptyState/ErrorState reuse window.Btn; ErrorState uses 'bolt' icon since no 'warning' glyph). CSS in styles.css `.feedback-state*` + `.pagination*`. subscription_screen.js StatusBox is an OLDER inline duplicate that can migrate to these.
- layout/: SiteFooter.js, AuthSplitLayout.js
- components.js: TopNav, ServiceMark, LegalNotice, Steps, DocTypeMeta

Note: `DocTypeMeta(docType)` (in components.js) returns {name, icon, ...} for a docType id — used everywhere for doc labels.

create_screen.js still contains INLINE raw markup not yet using all components:
- raw `<input className="input">` / `<textarea className="textarea">` instead of ui/TextInput·Textarea
- StepPreview/StepEdit render `.doc-preview` <pre> inline instead of fully using DocumentPreview component
- chat panel (`.chat-panel`) is inline (no dedicated component — per import guide, componentization deferred)
- RiskResultChatMsg is an inline function (CLAUDE.md spec = document/RiskWarningBox + RiskCheckButton, not yet separate files)

**How to apply:** Reuse these globals before writing new markup. EvidenceUploader supports mode="preview"+readonly for the right-side panel. DocumentPreview supports showHeader/showActions/mode/status.

RadioCard: NO standalone code component exists despite CLAUDE.md §3 listing it. Modal.js implements selectable cards (payment-method picker) with INLINE style, not a shared class. FR-24 "내편 전략 제안" design introduced a new `.radio-card` CSS class (base + .is-selected) intended as the reusable asset to eventually absorb Modal.js's inline picker. If asked to build RadioCard, use `.radio-card` and keep the classname payment-agnostic.

ui/Modal.js `iconMap`/`iconColorMap` have NO `strategy` key — AppModal.open({type:"strategy"}) falls back to "check" icon. Add `strategy:"sparkle"` / `strategy:"var(--brand-rest)"` if a strategy modal is implemented, or use type:"guide".
