"""
MockGateway — 실 PG 호출 없이 결제 플로우 전체를 검증하는 개발용 구현 (PRD §5.3)

PG_PROVIDER=mock 일 때 주입된다.
- confirm(): 항상 status=DONE 반환 (단, force_fail 시 PaymentGatewayError)
- verify_webhook(): 항상 True (서명 검증 스킵)
"""

import uuid
from datetime import datetime, timezone

from .gateway import (
    PaymentGateway,
    PrepareResult,
    ConfirmResult,
    CancelResult,
    PaymentGatewayError,
)


class MockGateway(PaymentGateway):
    def __init__(self, client_key: str = "test_ck_mock"):
        self._client_key = client_key

    def prepare(self, order_id, amount, order_name, user_id) -> PrepareResult:
        return PrepareResult(
            order_id=order_id,
            amount=amount,
            order_name=order_name,
            client_key=self._client_key,
        )

    def confirm(self, payment_key, order_id, amount, force_fail=None) -> ConfirmResult:
        # 개발용 강제 실패 (PRD §5.3 _mock_force_fail / T-14)
        if force_fail:
            fail_type = force_fail if isinstance(force_fail, str) else "NETWORK_ERROR"
            raise PaymentGatewayError(
                "Mock 강제 실패", fail_type=fail_type, code="MOCK_FORCED_FAIL"
            )
        return ConfirmResult(
            payment_key=payment_key or f"mock_pk_{uuid.uuid4().hex[:16]}",
            order_id=order_id,
            amount=amount,
            status="DONE",
            method="카드",
            receipt_url=f"https://mock.tosspayments.local/receipt/{order_id}",
            pg_transaction_id=f"mock_txn_{uuid.uuid4().hex[:12]}",
        )

    def cancel(self, payment_key, cancel_reason, cancel_amount=None) -> CancelResult:
        return CancelResult(
            cancel_amount=cancel_amount or 0,
            cancel_reason=cancel_reason,
            canceled_at=datetime.now(timezone.utc).isoformat(),
        )

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        # Mock: 서명 검증 스킵 — 항상 통과
        return True
