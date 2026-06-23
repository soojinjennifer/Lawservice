---
name: payment-gateway-arch
description: 건별 결제 백엔드 구조 — Phase 1 인메모리 vs Phase 2(Toss) 경계
metadata:
  type: project
---

건별 결제 백엔드는 PG 추상화(`payment/` 패키지) + Flask Blueprint(`payment_routes.py`)로 구성. `get_gateway()`가 `PG_PROVIDER` 환경변수로 MockGateway/TossPaymentsGateway 주입(싱글턴, `reset_gateway()`로 테스트 시 리셋).

**Why:** PRD_건별결제_v1.0이 Phase 1(Mock 완전동작) → Phase 2(Toss 실연동) 단계 전환을 요구. PG사 교체 시 gateway.py 인터페이스만 구현하면 나머지 무수정 설계.

**How to apply (Phase 2 전환 시 바꿀 곳):**
- `payment/toss_gateway.py`: `confirm`/`cancel`의 `raise NotImplementedError` 제거하고 주석 처리된 `requests` 호출 활성화. `requirements.txt`에 `requests` 추가 필요(현재 미추가).
- `.env`: `PG_PROVIDER=toss`, `PG_TEST_MODE=false`(실결제), `PG_SECRET_KEY`/`PG_WEBHOOK_SECRET` 채우기.
- `static/js/ui/Modal.js` `handlePay()`: testMode면 confirm 직접 호출하는 현재 로직을, 실연동 시 TossPayments SDK `requestPayment(팝업)` 후 paymentKey 받아 confirm 호출로 교체.
- **인메모리 경계**: `payment_routes.py`의 `_PAYMENTS`/`_DOC_ACCESS`/`_ORDERS` 딕셔너리가 payments/document_access 테이블 대체. Phase 2에서 `_record_payment`/`_active_access`/`_free_trial_used`/`record_generate_use` 등 헬퍼를 Supabase 쿼리로 교체. 스키마는 `migrations/001_payments.sql`(미실행).
- **사용자 식별**: Phase 1은 `X-User-Id` 헤더(클라 `AuthStore.getUserId()` 동기 캐시). Phase 2는 Supabase JWT 검증으로 교체(`_current_user_id`/`_gate_user_id`).

가격은 [[payment-price-source]].
