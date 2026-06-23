"""
내편문서 — 건별 결제 PG 추상화 패키지 (PRD 건별결제 v1.0 §5)

PG사 교체 시 gateway.py 인터페이스만 구현하면 나머지 코드는 무수정.
get_gateway() 팩토리가 환경변수 PG_PROVIDER로 구현체를 주입한다.
"""

from .gateway import (
    PaymentGateway,
    PrepareResult,
    ConfirmResult,
    CancelResult,
    PaymentGatewayError,
)
from .gateway_factory import get_gateway

__all__ = [
    "PaymentGateway",
    "PrepareResult",
    "ConfirmResult",
    "CancelResult",
    "PaymentGatewayError",
    "get_gateway",
]
