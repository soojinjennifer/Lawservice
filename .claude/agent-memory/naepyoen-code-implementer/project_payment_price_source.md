---
name: payment-price-source
description: 건별 결제 정가의 단일 출처와 PRD-코드 가격 불일치 처리 결정
metadata:
  type: project
---

서버 결제 정가의 단일 출처는 `payment_routes.py`의 `DOC_PRICES`이며 값은 내용증명 9,900 / 준비서면 49,000 / 상대방반박문 69,000.

**Why:** PRD 문서마다 가격이 불일치한다 — CLAUDE.md DocumentTypeCard는 내용증명 19,900, PRD_건별결제 §7.1은 반박문 예시 69,000, 클라이언트 코드(PaymentSummaryCard.js / create_screen.js DOC_PRICES)는 내용증명 9,900. 클라이언트가 이미 9,900으로 동작 중이라 정합성 우선으로 9,900에 맞췄다.

**How to apply:** 가격을 바꿀 일이 생기면 서버 `DOC_PRICES`(NFR-PAY-02 재검증 기준)와 클라이언트 `PaymentSummaryCard.js`/`create_screen.js`를 **반드시 동시에** 수정해야 금액 불일치(AMOUNT_MISMATCH) 거부가 안 난다. 항소이유서(appeal)는 결제 범위 제외(M-06)라 DOC_PRICES에 없음. 만약 사용자가 19,900을 정답이라 확정하면 세 곳 모두 변경. 관련 게이트웨이 추상화는 [[payment-gateway-arch]].
