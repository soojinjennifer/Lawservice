"""
PaymentGateway ABC — 결제 게이트웨이 추상 인터페이스 (PRD 건별결제 v1.0 §5.2)

모든 PG 구현체(MockGateway, TossPaymentsGateway)는 이 인터페이스를 따른다.
서버 라우트는 구체 구현이 아닌 이 추상 타입에만 의존한다.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


class PaymentGatewayError(Exception):
    """결제 처리 실패 시 발생. failType으로 클라이언트 fail step 분기에 사용.

    failType: USER_CANCEL | CARD_ERROR | LIMIT_EXCEEDED | NETWORK_ERROR | AMOUNT_MISMATCH
    """

    def __init__(self, message: str, fail_type: str = "NETWORK_ERROR", code: str = "PAYMENT_FAILED"):
        super().__init__(message)
        self.message = message
        self.fail_type = fail_type
        self.code = code


@dataclass
class PrepareResult:
    """결제 준비 결과. 클라이언트로 전달되어 PG 팝업 호출에 사용."""
    order_id: str
    amount: int
    order_name: str
    client_key: str          # 브라우저 노출 허용 공개키 (SECRET 아님)


@dataclass
class ConfirmResult:
    """결제 확인 결과. payments 테이블 저장에 사용."""
    payment_key: str
    order_id: str
    amount: int
    status: str              # DONE | CANCELED | ABORTED | EXPIRED
    method: str              # 카드 | 간편결제 | 가상계좌
    receipt_url: Optional[str]
    pg_transaction_id: str


@dataclass
class CancelResult:
    """환불(취소) 결과."""
    cancel_amount: int
    cancel_reason: str
    canceled_at: str         # ISO8601


class PaymentGateway(ABC):
    """결제 게이트웨이 추상 인터페이스 (PRD §5.2)."""

    @abstractmethod
    def prepare(self, order_id: str, amount: int, order_name: str, user_id: str) -> PrepareResult:
        """주문 생성. orderId는 라우트에서 생성해 전달, PG는 준비 응답만 반환."""
        ...

    @abstractmethod
    def confirm(self, payment_key: str, order_id: str, amount: int) -> ConfirmResult:
        """결제 확인. PG Confirm API 호출. 실패 시 PaymentGatewayError."""
        ...

    @abstractmethod
    def cancel(self, payment_key: str, cancel_reason: str, cancel_amount: Optional[int] = None) -> CancelResult:
        """환불(취소). 부분 환불 미지원 — cancel_amount None이면 전액."""
        ...

    @abstractmethod
    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Webhook HMAC-SHA256 서명 검증."""
        ...
