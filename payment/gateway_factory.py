"""
get_gateway() — 환경변수 PG_PROVIDER 기반 게이트웨이 팩토리 (PRD §5.1)

PG_PROVIDER=mock (기본) → MockGateway
PG_PROVIDER=toss        → TossPaymentsGateway (Phase 2)

서버 시작 시 1회 생성해 재사용한다 (싱글턴).
"""

import os

from .gateway import PaymentGateway
from .mock_gateway import MockGateway
from .toss_gateway import TossPaymentsGateway

_gateway_singleton: PaymentGateway = None


def get_gateway() -> PaymentGateway:
    global _gateway_singleton
    if _gateway_singleton is not None:
        return _gateway_singleton

    provider = os.getenv("PG_PROVIDER", "mock").lower()
    client_key = os.getenv("PG_CLIENT_KEY", "test_ck_mock")

    if provider == "toss":
        _gateway_singleton = TossPaymentsGateway(
            client_key=client_key,
            secret_key=os.getenv("PG_SECRET_KEY", ""),
            webhook_secret=os.getenv("PG_WEBHOOK_SECRET", ""),
        )
    else:
        _gateway_singleton = MockGateway(client_key=client_key)

    return _gateway_singleton


def reset_gateway():
    """테스트 용도 — 환경변수 변경 후 싱글턴 재생성 강제."""
    global _gateway_singleton
    _gateway_singleton = None
