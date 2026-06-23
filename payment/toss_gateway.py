"""
TossPaymentsGateway — Phase 2 실연동 스텁 (PRD §5.4)

현재는 HTTP 호출 구조(URL/헤더/인증)만 TossPayments 공식 명세대로 잡아두고
실제 호출부는 NotImplementedError로 막아둔다. Phase 2에서 실제 키 주입 +
requests 호출 활성화 시 동작하도록 설계.

TossPayments API 참조:
  - Confirm: POST https://api.tosspayments.com/v1/payments/confirm
  - Cancel : POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
  - Auth   : Basic base64(SECRET_KEY + ":")
  - Webhook: HMAC-SHA256(payload, WEBHOOK_SECRET)
"""

import base64
import hashlib
import hmac
from datetime import datetime, timezone

from .gateway import (
    PaymentGateway,
    PrepareResult,
    ConfirmResult,
    CancelResult,
    PaymentGatewayError,
)

TOSS_API_BASE = "https://api.tosspayments.com/v1"
TOSS_TIMEOUT = 10  # NFR-PAY-04: 10초 타임아웃


class TossPaymentsGateway(PaymentGateway):
    def __init__(self, client_key: str, secret_key: str, webhook_secret: str):
        self._client_key = client_key
        self._secret_key = secret_key
        self._webhook_secret = webhook_secret

    def _auth_header(self) -> str:
        """Basic 인증 헤더 — base64(secret_key + ':')."""
        token = base64.b64encode(f"{self._secret_key}:".encode()).decode()
        return f"Basic {token}"

    def prepare(self, order_id, amount, order_name, user_id) -> PrepareResult:
        # 준비 단계는 서버 내부 처리만 필요 (TossPayments는 클라이언트 SDK가 직접 호출).
        # client_key를 클라이언트에 전달해 requestPayment 팝업을 띄운다.
        return PrepareResult(
            order_id=order_id,
            amount=amount,
            order_name=order_name,
            client_key=self._client_key,
        )

    def confirm(self, payment_key, order_id, amount) -> ConfirmResult:
        # Phase 2: 실제 호출 활성화
        #   import requests
        #   resp = requests.post(
        #       f"{TOSS_API_BASE}/payments/confirm",
        #       headers={"Authorization": self._auth_header(), "Content-Type": "application/json"},
        #       json={"paymentKey": payment_key, "orderId": order_id, "amount": amount},
        #       timeout=TOSS_TIMEOUT,
        #   )
        #   if resp.status_code != 200:
        #       err = resp.json()
        #       raise PaymentGatewayError(err.get("message", "결제 확인 실패"),
        #                                 fail_type="CARD_ERROR", code=err.get("code", "TOSS_ERROR"))
        #   d = resp.json()
        #   return ConfirmResult(payment_key=d["paymentKey"], order_id=d["orderId"],
        #       amount=d["totalAmount"], status=d["status"], method=d.get("method", ""),
        #       receipt_url=(d.get("receipt") or {}).get("url"), pg_transaction_id=d["paymentKey"])
        raise NotImplementedError("Phase 2: TossPayments 연동 필요")

    def cancel(self, payment_key, cancel_reason, cancel_amount=None) -> CancelResult:
        # Phase 2: POST /payments/{paymentKey}/cancel  body={"cancelReason": ...}
        raise NotImplementedError("Phase 2: TossPayments 연동 필요")

    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        # HMAC-SHA256 서명 검증 (PRD FR-26). 구조는 완성, Phase 2에서 검증 활성화.
        if not self._webhook_secret or not signature:
            return False
        expected = hmac.new(
            self._webhook_secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        # TossPayments-Signature 형식: "v1=<hex>"
        provided = signature.split("=", 1)[-1].strip()
        return hmac.compare_digest(expected, provided)
