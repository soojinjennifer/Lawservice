"""
건별 결제 API 라우트 (PRD 건별결제 v1.0 §7, FR-25~FR-30)

Phase 1: 실제 Supabase DB 대신 인메모리 딕셔너리로 동작.
  · _PAYMENTS         : payment_id -> payment dict   (payments 테이블 대체)
  · _DOC_ACCESS       : access_id  -> access dict    (document_access 테이블 대체)
  · _ORDERS           : order_id   -> 준비된 주문 (금액 재검증 기준)

Phase 2 전환 시: 아래 _store_* / _query_* 헬퍼만 Supabase 호출로 교체.
인증: 클라이언트가 X-User-Id 헤더 또는 body.user_id 로 사용자 식별 (Supabase JWT
검증은 Phase 2). 미전달 시 'anonymous' 폴백 (개발 편의).
"""

import time
import uuid
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from payment import get_gateway, PaymentGatewayError

payment_bp = Blueprint("payment", __name__)

# ── 문서 종류별 정가 (서버 단일 출처, NFR-PAY-02 금액 재검증 기준) ──
# 클라이언트(PaymentSummaryCard.js / create_screen.js DOC_PRICES)와 동일하게 유지.
DOC_PRICES = {
    "notice":   9900,
    "brief":    49000,
    "rebuttal": 69000,
    # appeal(항소이유서)은 v2.0 예정 — 결제 범위 제외 (M-06)
}

# 영문 docType <-> 한글 라벨 (api.js DOC_TYPE_MAP 과 정합)
DOC_TYPE_KO = {
    "notice":   "내용증명",
    "brief":    "준비서면",
    "rebuttal": "상대방 반박문",
}
DOC_TYPE_EN = {v: k for k, v in DOC_TYPE_KO.items()}

FREE_TRIAL_DOC = "notice"          # 내용증명 첫 1건 무료 (FR-30)
DEFAULT_REVISION_LIMIT = 3
REFUND_WINDOW_DAYS = 7

# ── 인메모리 스토어 (Phase 1) ──────────────────────────────────
_PAYMENTS = {}      # payment_id -> dict
_DOC_ACCESS = {}    # access_id -> dict
_ORDERS = {}        # order_id -> {user_id, doc_type, amount, created_at}


# ── 유틸 ──────────────────────────────────────────────────────
def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _current_user_id():
    """Phase 1: 헤더/바디로 사용자 식별. Phase 2: Supabase JWT 검증으로 교체."""
    uid = request.headers.get("X-User-Id")
    if not uid:
        body = request.get_json(silent=True) or {}
        uid = body.get("user_id")
    return uid or "anonymous"


def _normalize_doc_type(raw):
    """영문 키('notice')·한글('내용증명') 모두 영문 키로 정규화."""
    if not raw:
        return None
    if raw in DOC_PRICES:
        return raw
    return DOC_TYPE_EN.get(raw)


# ── 권한 조회/조작 헬퍼 (Phase 2: Supabase 쿼리로 교체) ──────────
def _active_access(user_id, doc_type_en):
    """유효한(revoked 안 됨) document_access 반환, 없으면 None."""
    for acc in sorted(_DOC_ACCESS.values(), key=lambda a: a["granted_at"], reverse=True):
        if (acc["user_id"] == user_id and acc["doc_type"] == doc_type_en
                and acc["revoked_at"] is None):
            return acc
    return None


def _free_trial_used(user_id, doc_type_en):
    """해당 사용자가 무료체험 access를 이미 발급받았는지."""
    for acc in _DOC_ACCESS.values():
        if (acc["user_id"] == user_id and acc["doc_type"] == doc_type_en
                and acc["access_type"] == "free_trial"):
            return True
    return False


def check_document_access(user_id, doc_type_en):
    """문서 접근 권한 판정 (PRD FR-30). server.py /api/generate 게이트에서 호출.

    반환: {"allowed": bool, "access_type": str|None, "access_id": str|None, "reason": str|None}
    """
    # 1) 유효한 유료 권한 우선 (BUGFIX: 결제 직후 free_trial 보다 paid 를 먼저 인식).
    #    결제로 paid access 가 생성됐는데도 free_trial 로 판정되어 결제 모달이
    #    반복되던 문제를 방지한다. paid access 는 수정 무제한이므로 항상 우선한다.
    acc = _active_access(user_id, doc_type_en)
    if acc and acc.get("access_type") == "paid":
        return {"allowed": True, "access_type": "paid", "access_id": acc["id"], "reason": None}

    # 2) 무료 체험 (내용증명 한정, 미사용 시)
    if doc_type_en == FREE_TRIAL_DOC and not _free_trial_used(user_id, doc_type_en):
        return {"allowed": True, "access_type": "free_trial", "access_id": None, "reason": None}

    # 3) 그 밖의 유효 권한(무료체험 row 등)
    if acc:
        return {"allowed": True, "access_type": acc.get("access_type", "paid"),
                "access_id": acc["id"], "reason": None}

    # 4) 불가
    return {"allowed": False, "access_type": None, "access_id": None, "reason": "PAYMENT_REQUIRED"}


def _grant_free_trial(user_id, doc_type_en):
    """무료 체험 access 자동 생성 (없을 때만)."""
    if _free_trial_used(user_id, doc_type_en):
        return _active_access(user_id, doc_type_en)
    access_id = f"da_{uuid.uuid4().hex}"
    acc = {
        "id": access_id, "user_id": user_id, "doc_type": doc_type_en,
        "payment_id": None, "access_type": "free_trial",
        "granted_at": _now_iso(), "revoked_at": None,
        "revision_count_used": 0, "revision_count_limit": DEFAULT_REVISION_LIMIT,
        "generate_count_used": 0,
    }
    _DOC_ACCESS[access_id] = acc
    return acc


def record_generate_use(user_id, doc_type_en):
    """/api/generate 성공 시 generate_count_used 증가 (환불 조건 판단용).
    무료체험 권한이 없으면 자동 생성 후 카운트."""
    acc = _active_access(user_id, doc_type_en)
    if acc is None and doc_type_en == FREE_TRIAL_DOC and not _free_trial_used(user_id, doc_type_en):
        acc = _grant_free_trial(user_id, doc_type_en)
    if acc:
        acc["generate_count_used"] += 1
    return acc


def check_and_increment_revision(user_id, doc_type_en):
    """FR-30 수정 횟수 게이트.
    paid: 무제한 (sort 순서에 의존하지 않고 명시적으로 paid 먼저 탐색, FR-30 유료 우선).
    free_trial: DEFAULT_REVISION_LIMIT 적용."""
    paid_acc = None
    free_acc = None
    for acc in _DOC_ACCESS.values():
        if (acc["user_id"] == user_id and acc["doc_type"] == doc_type_en
                and acc["revoked_at"] is None):
            if acc.get("access_type") == "paid" and paid_acc is None:
                paid_acc = acc
            elif acc.get("access_type") == "free_trial" and free_acc is None:
                free_acc = acc
        if paid_acc and free_acc:
            break

    # 1) 유료 결제 우선: 수정 횟수 무제한
    if paid_acc:
        paid_acc["revision_count_used"] = paid_acc.get("revision_count_used", 0) + 1
        return {"allowed": True, "used": paid_acc["revision_count_used"], "limit": None}

    # 2) 무료 체험: 한도 확인
    if free_acc:
        used = free_acc["revision_count_used"]
        limit = free_acc["revision_count_limit"]
        if used >= limit:
            return {"allowed": False, "used": used, "limit": limit}
        free_acc["revision_count_used"] += 1
        return {"allowed": True, "used": used + 1, "limit": limit}

    # 3) 접근 권한 없음 → 허용 (무료 체험 generate 전 revise 엣지케이스)
    return {"allowed": True, "used": 0, "limit": None}


def get_trial_status(user_id):
    """FR-30 §8.2: 내용증명 무료 체험 사용 여부 + 수정 잔여 횟수 반환."""
    free_used = _free_trial_used(user_id, FREE_TRIAL_DOC)
    acc = _active_access(user_id, FREE_TRIAL_DOC)
    revision_remaining = (
        acc["revision_count_limit"] - acc["revision_count_used"]
    ) if acc else DEFAULT_REVISION_LIMIT
    return {
        "doc_type": FREE_TRIAL_DOC,
        "free_trial_used": free_used,
        "revision_remaining": revision_remaining,
    }


# ── 1. POST /api/payment/prepare (§7.1) ───────────────────────
@payment_bp.route("/api/payment/prepare", methods=["POST"])
def prepare():
    data = request.get_json(force=True, silent=True) or {}
    user_id = _current_user_id()
    if user_id == "anonymous":
        return jsonify({"error": "UNAUTHORIZED", "message": "로그인이 필요합니다."}), 401

    doc_type_en = _normalize_doc_type(data.get("doc_type") or data.get("docType"))
    if not doc_type_en or doc_type_en not in DOC_PRICES:
        return jsonify({"error": "INVALID_DOC_TYPE", "message": "지원하지 않는 문서 종류입니다."}), 400

    amount = DOC_PRICES[doc_type_en]                       # 서버 정가 (클라 입력 무시)
    order_id = f"PAY-{user_id}-{doc_type_en}-{int(time.time() * 1000)}"
    order_name = f"내편문서 {DOC_TYPE_KO[doc_type_en]} 1건"

    gw = get_gateway()
    result = gw.prepare(order_id, amount, order_name, user_id)

    _ORDERS[order_id] = {
        "user_id": user_id, "doc_type": doc_type_en,
        "amount": amount, "created_at": _now_iso(),
    }
    return jsonify({
        "order_id": result.order_id,
        "amount": result.amount,
        "order_name": result.order_name,
        "doc_type": doc_type_en,
        "client_key": result.client_key,        # 공개키만 노출 (NFR-PAY-01)
    })


# ── 2. POST /api/payment/confirm (§7.2) ───────────────────────
@payment_bp.route("/api/payment/confirm", methods=["POST"])
def confirm():
    data = request.get_json(force=True, silent=True) or {}
    user_id = _current_user_id()
    payment_key = data.get("payment_key") or data.get("paymentKey")
    order_id = data.get("order_id") or data.get("orderId")
    amount = data.get("amount")

    order = _ORDERS.get(order_id)
    if not order:
        return jsonify({"error": "ORDER_NOT_FOUND", "message": "주문 정보를 찾을 수 없습니다."}), 400

    # 멱등성 (NFR-PAY-03): 동일 orderId 가 이미 DONE 이면 409
    for p in _PAYMENTS.values():
        if p["pg_order_id"] == order_id and p["status"] == "DONE":
            return jsonify({"error": "ALREADY_CONFIRMED", "message": "이미 처리된 주문입니다."}), 409

    # 금액 재검증 (NFR-PAY-02): 서버 정가 기준
    doc_type_en = order["doc_type"]
    expected = DOC_PRICES[doc_type_en]
    if amount is not None and int(amount) != expected:
        _record_payment(user_id, order_id, doc_type_en, expected, None, "FAILED",
                        payment_key=payment_key, receipt_url=None)
        return jsonify({"error": "AMOUNT_MISMATCH", "message": "결제 금액이 일치하지 않습니다.",
                        "failType": "AMOUNT_MISMATCH"}), 400

    gw = get_gateway()
    # mock 강제 실패 트리거 (PRD §5.3, T-14) — mock 게이트웨이에만 전달
    force_fail = data.get("_mock_force_fail")
    try:
        if force_fail is not None and hasattr(gw, "confirm") and "force_fail" in gw.confirm.__code__.co_varnames:
            cr = gw.confirm(payment_key, order_id, expected, force_fail=force_fail)
        else:
            cr = gw.confirm(payment_key, order_id, expected)
    except PaymentGatewayError as e:
        _record_payment(user_id, order_id, doc_type_en, expected, None, "FAILED",
                        payment_key=payment_key, receipt_url=None)
        return jsonify({"error": e.code, "message": e.message, "failType": e.fail_type}), 400

    # 성공 → payments 저장 + document_access 부여
    payment_id = _record_payment(
        user_id, order_id, doc_type_en, expected, cr.amount, "DONE",
        payment_key=cr.payment_key, receipt_url=cr.receipt_url, method=cr.method,
    )
    access_id = f"da_{uuid.uuid4().hex}"
    _DOC_ACCESS[access_id] = {
        "id": access_id, "user_id": user_id, "doc_type": doc_type_en,
        "payment_id": payment_id, "access_type": "paid",
        "granted_at": _now_iso(), "revoked_at": None,
        "revision_count_used": 0, "revision_count_limit": DEFAULT_REVISION_LIMIT,
        "generate_count_used": 0,
    }
    return jsonify({
        "success": True,
        "payment_id": payment_id,
        "document_access_id": access_id,
        "doc_type": doc_type_en,
        "receipt_url": cr.receipt_url,
    })


def _record_payment(user_id, order_id, doc_type_en, amount_req, amount_conf, status,
                    payment_key=None, receipt_url=None, method=None):
    payment_id = str(uuid.uuid4())
    import os
    _PAYMENTS[payment_id] = {
        "payment_id": payment_id, "user_id": user_id,
        "pg_provider": os.getenv("PG_PROVIDER", "mock"),
        "pg_transaction_id": payment_key, "pg_order_id": order_id,
        "pg_method": method, "doc_type": doc_type_en,
        "amount_requested": amount_req, "amount_confirmed": amount_conf,
        "status": status, "idempotency_key": order_id,
        "receipt_url": receipt_url, "webhook_received_at": None,
        "refunded_at": None, "refund_reason": None,
        "created_at": _now_iso(), "updated_at": _now_iso(),
    }
    return payment_id


# ── 3. POST /api/payment/webhook (§7.3, FR-26) ────────────────
@payment_bp.route("/api/payment/webhook", methods=["POST"])
def webhook():
    payload = request.get_data()  # raw bytes (서명 검증용)
    signature = request.headers.get("TossPayments-Signature", "")

    gw = get_gateway()
    if not gw.verify_webhook(payload, signature):
        return jsonify({"error": "INVALID_SIGNATURE"}), 400

    data = request.get_json(force=True, silent=True) or {}
    event_data = data.get("data", {})
    order_id = event_data.get("orderId")
    new_status = event_data.get("status")

    # 멱등성: 동일 orderId 가 이미 DONE 이면 무시 (FR-26)
    target = None
    for p in _PAYMENTS.values():
        if p["pg_order_id"] == order_id:
            target = p
            break
    if target:
        if target["status"] == "DONE" and new_status == "DONE":
            return jsonify({"received": True}), 200
        if new_status:
            target["status"] = new_status
            target["webhook_received_at"] = _now_iso()
            target["updated_at"] = _now_iso()
    return jsonify({"received": True}), 200


# ── 4. POST /api/payment/cancel (§7.4, FR-28 환불) ─────────────
@payment_bp.route("/api/payment/cancel", methods=["POST"])
def cancel():
    data = request.get_json(force=True, silent=True) or {}
    user_id = _current_user_id()
    payment_id = data.get("payment_id") or data.get("paymentId")
    reason = data.get("cancel_reason") or data.get("reason") or "사용자 환불 요청"

    p = _PAYMENTS.get(payment_id)
    if not p or p["user_id"] != user_id:
        return jsonify({"error": "PAYMENT_NOT_FOUND", "message": "결제 정보를 찾을 수 없습니다."}), 400
    if p["status"] != "DONE":
        return jsonify({"error": "REFUND_NOT_ELIGIBLE", "reason": "INVALID_STATUS",
                        "message": "환불 가능한 결제 상태가 아닙니다."}), 400

    # 7일 이내 확인
    created = datetime.fromisoformat(p["created_at"])
    if datetime.now(timezone.utc) - created > timedelta(days=REFUND_WINDOW_DAYS):
        return jsonify({"error": "REFUND_NOT_ELIGIBLE", "reason": "EXPIRED_WINDOW",
                        "message": "환불 가능 기간(7일)이 지났습니다."}), 400

    # 미사용 확인 (generate 0회)
    acc = None
    for a in _DOC_ACCESS.values():
        if a["payment_id"] == payment_id:
            acc = a
            break
    if acc and acc["generate_count_used"] > 0:
        return jsonify({"error": "REFUND_NOT_ELIGIBLE", "reason": "ALREADY_USED",
                        "message": "이미 문서 생성이 시작된 결제는 환불이 불가합니다."}), 400

    gw = get_gateway()
    try:
        cr = gw.cancel(p["pg_transaction_id"], reason, cancel_amount=p["amount_confirmed"])
    except PaymentGatewayError as e:
        return jsonify({"error": e.code, "message": e.message}), 400

    p["status"] = "CANCELLED"
    p["refunded_at"] = _now_iso()
    p["refund_reason"] = reason
    p["updated_at"] = _now_iso()
    if acc:
        acc["revoked_at"] = _now_iso()

    return jsonify({
        "success": True,
        "cancel_amount": p["amount_confirmed"],
        "canceled_at": cr.canceled_at,
    })


# ── 5. GET /api/payment/history (§7.5, FR-29) ──────────────────
@payment_bp.route("/api/payment/history", methods=["GET"])
def history():
    user_id = _current_user_id()
    status_filter = request.args.get("status")
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = max(1, int(request.args.get("per_page", 10)))
    except ValueError:
        page, per_page = 1, 10

    rows = [p for p in _PAYMENTS.values() if p["user_id"] == user_id]
    if status_filter:
        rows = [p for p in rows if p["status"] == status_filter]
    rows.sort(key=lambda p: p["created_at"], reverse=True)

    total = len(rows)
    start = (page - 1) * per_page
    page_rows = rows[start:start + per_page]

    items = [_history_item(p) for p in page_rows]
    return jsonify({"total": total, "page": page, "per_page": per_page, "items": items})


def _history_item(p):
    """payments dict -> 클라이언트(PaymentHistoryItem) 구조 (§7.5)."""
    refundable, refundable_until = _refund_status(p)
    ko = DOC_TYPE_KO.get(p["doc_type"], p["doc_type"])
    return {
        "paymentId": p["payment_id"],
        "docType": ko,
        "title": f"{ko} 1건",            # 문서 제목 미저장 → 라벨 폴백 (Phase 2: 실제 제목 연동)
        "amount": p["amount_confirmed"] if p["amount_confirmed"] is not None else p["amount_requested"],
        "status": p["status"],
        "createdAt": p["created_at"][:10],
        "receiptUrl": p["receipt_url"],
        "refundable": refundable,
        "refundableUntil": refundable_until,
    }


def _refund_status(p):
    if p["status"] != "DONE":
        return False, None
    created = datetime.fromisoformat(p["created_at"])
    until = created + timedelta(days=REFUND_WINDOW_DAYS)
    within = datetime.now(timezone.utc) <= until
    used = False
    for a in _DOC_ACCESS.values():
        if a["payment_id"] == p["payment_id"] and a["generate_count_used"] > 0:
            used = True
            break
    return (within and not used), (until.date().isoformat() if within else None)


# ── 6. GET /api/payment/access-check (FR-30) ───────────────────
@payment_bp.route("/api/payment/access-check", methods=["GET"])
def access_check():
    user_id = _current_user_id()
    doc_type_en = _normalize_doc_type(request.args.get("docType") or request.args.get("doc_type"))
    if not doc_type_en or doc_type_en not in DOC_PRICES:
        return jsonify({"error": "INVALID_DOC_TYPE"}), 400

    res = check_document_access(user_id, doc_type_en)
    is_free_eligible = (doc_type_en == FREE_TRIAL_DOC
                        and not _free_trial_used(user_id, doc_type_en))
    acc = _active_access(user_id, doc_type_en)
    if acc and acc.get("access_type") == "paid":
        revisions_remaining = None  # 유료 결제: 무제한
    elif acc:
        revisions_remaining = acc["revision_count_limit"] - acc["revision_count_used"]
    else:
        revisions_remaining = DEFAULT_REVISION_LIMIT

    return jsonify({
        "hasAccess": res["allowed"],
        "accessType": res["access_type"],
        "isFreeTrialEligible": is_free_eligible,
        "revisionsRemaining": revisions_remaining,
    })


# ── DEV ONLY: POST /api/dev/reset ────────────────────────────────
@payment_bp.route("/api/dev/reset", methods=["POST"])
def dev_reset():
    """개발/테스트용 — 인메모리 결제·권한·수정횟수 데이터 전체 초기화.
    프로덕션 환경(FLASK_ENV=production)에서는 비활성화."""
    import os
    if os.getenv("FLASK_ENV") == "production":
        return jsonify({"error": "FORBIDDEN"}), 403

    _PAYMENTS.clear()
    _DOC_ACCESS.clear()
    _ORDERS.clear()
    return jsonify({
        "ok": True,
        "message": "인메모리 결제/권한/수정횟수 데이터가 초기화됐습니다.",
        "cleared": ["_PAYMENTS", "_DOC_ACCESS", "_ORDERS"],
    })
