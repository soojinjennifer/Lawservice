# 내편문서 — 건별 결제 구현 PRD v1.0

> 작성일: 2026-06-21
> 작성자: Senior PM
> 버전: 1.0
> 기준 문서: 내편문서_PRD_v2.0.md (FR-21 포함)
> 문서 목적: TossPayments 건별 결제 실구현을 위한 상세 기술 명세

---

## 0. 문서 이력

| 버전 | 날짜 | 주요 내용 |
|---|---|---|
| v1.0 | 2026-06-21 | 최초 작성 — TossPayments 팝업 결제, FR-25~FR-30 신규 정의, DB 모델, API 명세 |

---

## 1. 개요

### 1.1 목적

내편문서 v2.0 PRD에서 FR-21(건별 결제 플로우)은 UI(PaymentModal, PurchaseConfirmModal) 까지만 구현된 상태이며, 실제 PG 연동이 이루어지지 않았다. 본 문서는 TossPayments를 사용하여 실결제를 구현하기 위한 백엔드 API, DB 설계, 클라이언트 연동 방식, 테스트 전략을 명세한다.

### 1.2 범위

**포함 (In Scope)**
- TossPayments 팝업(popup) 방식 결제 연동
- 결제 준비(orderId 발급) · 결제 확인(금액 재검증) · Webhook 처리
- 결제 실패/취소 시 사용자 흐름 및 UI
- 자동 환불 처리 (TossPayments 취소 API)
- 결제 내역 DB 저장 및 마이페이지 조회
- 문서 접근 권한 게이트 (미결제 시 차단)
- 무료 체험 잔여 횟수 관리 (`document_access` 테이블 기반)
- 내용증명 워터마크 서버 사이드 삽입 (.docx 생성 시)

**제외 (Out of Scope)**
- 항소이유서 결제 (v2.0 예정, UI 비활성 유지)
- 구독·월정액 플랜
- 해외 결제 수단
- 영수증 자동 발송 이메일 (TossPayments 영수증 URL 링크 제공으로 대체)
- 부분 환불

### 1.3 배경 및 문제 정의

현재 FR-21은 다음 두 가지 문제를 가진다.

1. **PG 미연동**: `PaymentModal`의 결제 버튼 클릭 시 실제 과금이 발생하지 않음. 결제 성공 분기는 항상 성공으로 처리됨.
2. **접근 권한 미구현**: 결제 여부와 무관하게 문서 생성 API(`/api/generate`)에 접근 가능. `FR-12`의 "플랜별 한도 체크"가 클라이언트 단에만 존재하며 서버 검증 없음.

이 두 문제를 해결하여 실결제가 가능한 수익화 구조를 완성한다.

### 1.4 미결정 사항 확정값 (의사결정 완료)

| # | 항목 | 결정값 | 결정 근거 |
|---|---|---|---|
| M-01 | PG사 | TossPayments | 국내 카드/간편결제 지원, 문서 우수 |
| M-02 | 결제창 방식 | 팝업(popup) | 모바일 리다이렉트 UX 이슈 회피 |
| M-03 | DB | Supabase 기존 DB에 `payments`, `document_access` 테이블 추가 | 기존 Supabase Auth와 일관성 유지 |
| M-04 | 무료 체험 잔여 횟수 관리 | `document_access` 테이블 기반 | 서버 검증 단일화 |
| M-05 | 환불 | 자동 환불 (TossPayments 취소 API) | 7일 이내 미사용 문서에 한해 자동 처리 |
| M-06 | 항소이유서 | 결제 연동 범위 제외, UI 비활성 유지 | v2.0 예정 기능, 빠른 실결제 구현 우선 |
| M-07 | 영수증 | TossPayments 영수증 URL 링크 제공 | 개발 공수 최소화 |
| M-08 | 워터마크 | 서버에서 .docx 생성 시 실제 워터마크 삽입 | 클라이언트 우회 방지 |

---

## 2. 변경 요약

### 2.1 기존 FR 상태 정정

| FR | 기존 상태 | 정정 상태 | 사유 |
|---|---|---|---|
| FR-21 (건별 결제) | 구현 완료 | **부분 구현** (UI 완료 / PG 미연동) | TossPayments 실결제 미연동 상태 |
| FR-12 (한도 체크) | 구현 완료 | **부분 구현** (클라이언트 체크만 / 서버 검증 없음) | `document_access` 기반 서버 검증 필요 |

### 2.2 신규 FR 목록

| ID | 요구사항 | 우선순위 | 의존성 |
|---|---|---|---|
| FR-25 | TossPayments 결제 연동 (팝업 방식) | P0 | FR-21 UI, M-01~M-02 |
| FR-26 | Webhook 처리 (서명 검증 포함) | P0 | FR-25 |
| FR-27 | 결제 실패/취소 처리 (PaymentModal step:fail 추가) | P0 | FR-25 |
| FR-28 | 환불 처리 (7일 이내 미사용, TossPayments 취소 API) | P1 | FR-25, FR-26 |
| FR-29 | 결제 내역 DB 연동 (Supabase `payments` 테이블) | P0 | FR-25, FR-26 |
| FR-30 | 문서 접근 권한 게이트 (미결제 시 403) | P0 | FR-29 |

---

## 3. 기능 요구사항 (FR-25 ~ FR-30)

### FR-25: TossPayments 결제 연동 (팝업 방식)

- **우선순위**: P0
- **의존성**: FR-21 기존 PaymentModal UI, TossPayments 계정·키 발급

**설명**

사용자가 `PurchaseConfirmModal`에서 "결제하고 문서 만들기"를 클릭하면 다음 흐름으로 실결제가 진행된다.

```
[클라이언트]
  1. POST /api/payment/prepare → { orderId, amount, orderName } 수령
  2. TossPayments.requestPayment(팝업) 호출
  3a. 성공: { paymentKey, orderId, amount } 를 서버로 전송
  3b. 실패/취소: FR-27 실패 흐름 진입

[서버]
  4. POST /api/payment/confirm 수신
  5. amount 재검증 (DB orderId 기준 금액과 비교)
  6. TossPayments Confirm API 호출
  7. 성공 시 payments 테이블 저장 + document_access 행 생성
  8. 응답: { success: true, documentAccessId }
```

**비즈니스 규칙**

- `orderId`는 결제 준비 단계에서 서버가 생성 (UUID v4 기반, 중복 불가)
- `amount`는 반드시 서버에서 문서 종류별 정가로 재검증 (클라이언트 변조 방지)
- 팝업창이 사용자에 의해 닫힌 경우 `FR-27` 취소 흐름으로 처리
- `PG_TEST_MODE=true`일 때 TossPayments 테스트 키 사용, `false`일 때 실결제 키 사용
- `PG_PROVIDER=mock`일 때 실제 PG 호출 없이 항상 성공 반환 (개발 환경)

**수용 기준 (Acceptance Criteria)**

- [ ] "결제하고 문서 만들기" 클릭 시 TossPayments 팝업이 열린다
- [ ] 팝업에서 카드 정보 입력 후 결제 성공 시 `PaymentModal step:success`로 전환된다
- [ ] 결제 성공 후 해당 문서 생성 화면(1단계)으로 이동한다
- [ ] 서버는 클라이언트에서 전달된 amount를 DB 기준값과 재검증하며, 불일치 시 결제를 거부한다
- [ ] `PG_PROVIDER=mock` 환경에서 결제 팝업 없이 즉시 성공 처리된다
- [ ] `PG_TEST_MODE=true` 환경에서 TossPayments 테스트 카드로 결제 테스트가 가능하다

---

### FR-26: Webhook 처리

- **우선순위**: P0
- **의존성**: FR-25

**설명**

TossPayments가 서버에 비동기로 결제 상태를 전달한다. 네트워크 지연·팝업 강제 종료 등의 엣지 케이스에서 결제 상태의 최종 정합성을 보장하기 위해 Webhook을 처리한다.

**비즈니스 규칙**

- Webhook 수신 엔드포인트: `POST /api/payment/webhook`
- `HMAC-SHA256` 서명 검증 필수 (`PG_WEBHOOK_SECRET` 환경변수 사용)
- 서명 불일치 시 `400 Bad Request` 반환 및 처리 중단
- Webhook 이벤트 타입:
  - `PAYMENT_STATUS_CHANGED` → `payments.status` 업데이트
  - `CANCEL_STATUS_CHANGED` → 환불 상태 업데이트
- Webhook은 멱등성(idempotency) 보장: 동일 `orderId`의 중복 수신 시 이미 완료 상태이면 무시하고 `200 OK` 반환
- Webhook 처리 결과는 별도 로그로 기록 (디버깅 용이성)

**수용 기준**

- [ ] 유효한 서명의 Webhook 수신 시 `payments` 테이블 상태가 업데이트된다
- [ ] 서명 불일치 Webhook은 400을 반환하며 DB를 변경하지 않는다
- [ ] 동일 orderId 중복 Webhook은 무시되고 200을 반환한다

---

### FR-27: 결제 실패/취소 처리

- **우선순위**: P0
- **의존성**: FR-25

**설명**

결제 팝업에서 취소하거나 오류가 발생한 경우 사용자에게 명확한 피드백을 제공하고, 재시도 또는 취소 선택을 안내한다.

**PaymentModal 신규 step 추가**

기존 PaymentModal의 step 값에 `fail`을 추가한다.

| step | 기존 여부 | 설명 |
|---|---|---|
| select | 기존 | 문서 종류 및 금액 확인 |
| pay | 기존 | 결제 수단 선택 및 진행 |
| success | 기존 | 결제 완료 및 문서 생성 안내 |
| **fail** | **신규** | 결제 실패/취소 안내 및 재시도 |

**실패 유형별 처리**

| 실패 유형 | 메시지 | 액션 |
|---|---|---|
| 사용자 취소 (팝업 닫기) | "결제가 취소되었습니다." | [다시 시도] / [닫기] |
| 카드 한도 초과 | "결제 한도가 초과되었습니다. 다른 카드를 사용해주세요." | [다시 시도] / [닫기] |
| 카드 정보 오류 | "카드 정보를 확인해주세요." | [다시 시도] / [닫기] |
| 네트워크 오류 | "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." | [다시 시도] / [닫기] |
| 금액 불일치 (서버 검증 실패) | "결제 정보에 오류가 발생했습니다. 고객센터에 문의해주세요." | [닫기] |

**비즈니스 규칙**

- 결제 실패 시 `payments` 테이블에 `status: FAILED` 행 기록
- 실패 후 재시도 시 새로운 `orderId` 발급 (기존 실패 orderId 재사용 금지)
- 팝업 강제 종료 시 결제 상태 미확정 → Webhook 수신 후 최종 상태 업데이트

**수용 기준**

- [ ] 팝업 취소 시 `PaymentModal step:fail`이 표시된다
- [ ] fail step에서 "다시 시도" 클릭 시 새로운 orderId로 결제가 재시작된다
- [ ] fail step에서 "닫기" 클릭 시 모달이 닫히고 사용자가 기존 화면에 머문다
- [ ] 실패 기록이 `payments` 테이블에 `status: FAILED`로 저장된다

---

### FR-28: 환불 처리

- **우선순위**: P1
- **의존성**: FR-25, FR-26

**설명**

결제 완료 후 7일 이내, 문서 생성을 시작하지 않은 경우 환불 요청이 가능하다. TossPayments 취소 API를 자동 호출하여 환불을 처리한다.

**환불 정책**

| 항목 | 내용 |
|---|---|
| 환불 가능 기간 | 결제일로부터 7일 이내 |
| 환불 가능 조건 | 해당 결제로 문서 생성(`/api/generate`)을 한 번도 호출하지 않은 경우 |
| 환불 불가 | 문서 생성 API 1회 이상 호출된 경우 (문서 접근 사용 시작으로 간주) |
| 환불 방법 | 원결제 수단으로 자동 환불 (부분 환불 없음) |
| 환불 소요 시간 | 카드사 영업일 기준 3~5일 (TossPayments 정책 준수) |

**환불 요청 흐름**

```
마이페이지 > 결제 내역 > 환불 신청
  → 환불 조건 확인 (서버)
  → 환불 가능: TossPayments 취소 API 호출
    → 성공: payments.status = CANCELLED, document_access.revoked_at = NOW()
    → 실패: 오류 메시지 + 고객센터 안내
  → 환불 불가: 사유 안내 ("이미 문서 생성이 시작된 결제는 환불이 불가합니다")
```

**수용 기준**

- [ ] 마이페이지 결제 내역에서 환불 가능 결제에 "환불 신청" 버튼이 표시된다
- [ ] 환불 신청 클릭 시 확인 모달 ("환불 시 해당 문서에 대한 접근 권한이 사라집니다") 이 표시된다
- [ ] 환불 성공 시 `payments.status`가 `CANCELLED`로 업데이트되고 `document_access.revoked_at`이 기록된다
- [ ] 문서 생성이 1회라도 사용된 결제는 환불 불가 상태로 표시된다
- [ ] 환불 완료 후 해당 문서 생성 재시도 시 결제 화면으로 유도된다

---

### FR-29: 결제 내역 DB 연동

- **우선순위**: P0
- **의존성**: FR-25, Supabase 기존 DB

**설명**

모든 결제 시도(성공·실패·취소·환불)를 `payments` 테이블에 기록하고, 마이페이지 결제 내역 화면에서 조회한다.

**마이페이지 결제 내역 화면 요구사항**

| 항목 | 내용 |
|---|---|
| 조회 기간 | 최근 1년, 기간 필터 제공 |
| 정렬 | 최신순 기본 |
| 표시 항목 | 문서 종류, 금액, 결제일시, 상태(성공/실패/취소/환불), 영수증 링크, 환불 신청 버튼 |
| 영수증 | TossPayments 영수증 URL 링크 ("영수증 보기" 텍스트 버튼) |
| 페이지네이션 | 10건/페이지, Pagination 공통 컴포넌트 사용 |

**수용 기준**

- [ ] 결제 성공/실패/취소/환불 모든 이벤트가 `payments` 테이블에 기록된다
- [ ] 마이페이지 결제 내역에서 결제 이력을 최신순으로 조회할 수 있다
- [ ] 성공 결제 건에 영수증 URL 링크가 표시된다
- [ ] 환불 가능 조건을 충족한 성공 결제 건에 "환불 신청" 버튼이 표시된다

---

### FR-30: 문서 접근 권한 게이트

- **우선순위**: P0
- **의존성**: FR-29

**설명**

`/api/generate`, `/api/revise`, `/api/download_docx` 호출 전 서버에서 문서 접근 권한을 검증한다. 미결제 또는 접근 권한 만료 시 `403 Forbidden`을 반환하고, 클라이언트는 결제 모달을 표시한다.

**접근 권한 체크 로직**

```python
def check_document_access(user_id: str, doc_type: str) -> AccessResult:
    # 1. 무료 체험 가능 여부 확인
    if doc_type == "내용증명":
        used_free = query_free_trial_used(user_id, doc_type)
        if not used_free:
            return AccessResult(allowed=True, access_type="free_trial")

    # 2. 유효한 document_access 존재 여부 확인
    access = query_document_access(user_id, doc_type, active_only=True)
    if access:
        return AccessResult(allowed=True, access_type="paid", access_id=access.id)

    # 3. 접근 불가
    return AccessResult(allowed=False, reason="PAYMENT_REQUIRED")
```

**수정 횟수 제한**

- **유료 결제(`access_type=paid`)**: 수정 횟수 **무제한**. `/api/revise` 횟수 게이트 미적용.
- **무료 체험(`access_type=free_trial`)**: `revision_count_limit`(기본값: 3)에 도달하면 `/api/revise` 접근 차단
  - 차단 시 응답: `{ "error": "REVISION_LIMIT_EXCEEDED", "used": 3, "limit": 3 }`
  - 클라이언트: "대화형 수정 횟수(3회)를 모두 사용하셨습니다" Toast 표시

**무료 체험 워터마크 처리**

- `access_type == "free_trial"`인 경우 `/api/download_docx` 서버 사이드에서 .docx에 워터마크 삽입
- 워터마크 내용: "본 문서는 내편문서 무료 체험 초안입니다."
- 워터마크 위치: 문서 전체 배경 (watermark 형식) 또는 문서 하단 footer 고정 텍스트

**수용 기준**

- [ ] 미결제 사용자가 `/api/generate` 호출 시 `403`과 `{ "error": "PAYMENT_REQUIRED" }`를 받는다
- [ ] 클라이언트는 403 수신 시 `PaymentModal`을 자동으로 표시한다
- [ ] 수정 횟수 초과 시 `/api/revise`가 차단되고 Toast가 표시된다
- [ ] 무료 체험 문서 다운로드 시 .docx에 워터마크가 삽입된다
- [ ] 유료 결제 문서 다운로드 시 워터마크 없이 깔끔한 문서가 제공된다

---

## 4. 비기능 요구사항 (NFR-PAY)

| ID | 구분 | 요구사항 |
|---|---|---|
| NFR-PAY-01 | 보안 | `PG_SECRET_KEY`, `PG_WEBHOOK_SECRET`은 서버 환경변수에만 존재하며, 절대 클라이언트(브라우저)에 노출하지 않는다 |
| NFR-PAY-02 | 금액 무결성 | 결제 확인 단계에서 클라이언트가 전달한 `amount`를 DB 기준 정가와 서버에서 재검증한다. 불일치 시 결제 즉시 거부 |
| NFR-PAY-03 | 멱등성 | Webhook, 결제 확인 API는 동일 `orderId` 중복 요청에 멱등하게 동작해야 한다 (`idempotency_key` 활용) |
| NFR-PAY-04 | 가용성 | TossPayments API 호출 타임아웃: 10초. 타임아웃 발생 시 사용자에게 오류 안내 및 재시도 유도, 내부적으로 Webhook으로 최종 상태 정합 |
| NFR-PAY-05 | 감사 로그 | 모든 결제 이벤트(준비, 확인, Webhook, 환불)는 타임스탬프·사용자ID·금액과 함께 서버 로그 기록 |

---

## 5. PG 추상화 설계

### 5.1 아키텍처 개요

```
payment/
  gateway.py          ← PaymentGateway ABC (추상 인터페이스)
  mock_gateway.py     ← MockGateway (PG_PROVIDER=mock, 개발/테스트)
  toss_gateway.py     ← TossPaymentsGateway (PG_PROVIDER=toss)
  gateway_factory.py  ← get_gateway() 팩토리 함수
```

PG사를 바꾸더라도 `gateway.py` 인터페이스만 구현하면 나머지 코드를 수정하지 않아도 된다.

### 5.2 PaymentGateway 인터페이스 정의

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class PrepareResult:
    order_id: str
    amount: int
    order_name: str
    client_key: str         # 클라이언트에 전달할 PG 공개키

@dataclass
class ConfirmResult:
    payment_key: str
    order_id: str
    amount: int
    status: str             # DONE | CANCELED | PARTIAL_CANCELED | ABORTED | EXPIRED
    method: str             # 카드 | 가상계좌 | 간편결제
    receipt_url: Optional[str]
    pg_transaction_id: str

@dataclass
class CancelResult:
    cancel_amount: int
    cancel_reason: str
    canceled_at: str

class PaymentGateway(ABC):

    @abstractmethod
    def prepare(self, doc_type: str, user_id: str) -> PrepareResult:
        """주문 생성 및 orderId 반환"""
        ...

    @abstractmethod
    def confirm(self, payment_key: str, order_id: str, amount: int) -> ConfirmResult:
        """결제 금액 재검증 및 TossPayments Confirm API 호출"""
        ...

    @abstractmethod
    def cancel(self, payment_key: str, cancel_reason: str) -> CancelResult:
        """환불(취소) 처리"""
        ...

    @abstractmethod
    def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Webhook 서명 검증"""
        ...
```

### 5.3 MockGateway 동작 방식

`PG_PROVIDER=mock`으로 설정 시 `MockGateway`가 주입된다.

- `prepare()`: UUID 기반 orderId 생성, DB에 pending 상태로 저장
- `confirm()`: 항상 `status: DONE` 반환 (실제 TossPayments 호출 없음)
- `cancel()`: 항상 성공 반환
- `verify_webhook()`: 항상 `True` 반환

개발 환경에서는 결제 팝업 없이 즉시 성공/실패 시나리오를 재현할 수 있다.

**Mock 강제 실패 트리거 (개발용)**

요청 body에 `"_mock_force_fail": true`를 포함하면 `confirm()`이 `PaymentGatewayError`를 발생시킨다.

### 5.4 TossPayments 팝업 플로우 (클라이언트-서버 시퀀스)

```
클라이언트                                서버                         TossPayments
     |                                      |                               |
     |-- POST /api/payment/prepare -------->|                               |
     |                                      |-- 주문 생성, orderId 발급      |
     |<----- { orderId, amount, ... } ------|                               |
     |                                      |                               |
     |-- TossPayments.requestPayment() ---->|                               |
     |   (팝업 열림)                         |                               |
     |<-- 사용자 카드 입력, 결제 완료 <-----  |<----- 결제 처리 --------------|
     |   { paymentKey, orderId, amount }    |                               |
     |                                      |                               |
     |-- POST /api/payment/confirm -------->|                               |
     |                                      |-- 금액 재검증                  |
     |                                      |-- POST /confirm API --------->|
     |                                      |<----- 결제 확인 응답 ----------|
     |                                      |-- payments 테이블 저장         |
     |                                      |-- document_access 생성         |
     |<----- { success: true, ... } --------|                               |
     |                                      |                               |
     |   (비동기, 독립 경로)                  |<----- Webhook 이벤트 ---------|
     |                                      |-- 서명 검증                    |
     |                                      |-- 상태 업데이트                |
```

### 5.5 환경변수 명세

| 변수명 | 설명 | 예시값 | 필수 |
|---|---|---|---|
| `PG_PROVIDER` | PG 제공자 선택 | `mock` \| `toss` | 필수 |
| `PG_TEST_MODE` | TossPayments 테스트 모드 여부 | `true` \| `false` | 필수 |
| `PG_CLIENT_KEY` | TossPayments 클라이언트 키 (브라우저 노출 허용) | `test_ck_...` | toss 환경 |
| `PG_SECRET_KEY` | TossPayments 시크릿 키 (서버 전용) | `test_sk_...` | toss 환경 |
| `PG_WEBHOOK_SECRET` | Webhook 서명 검증 키 | `whsec_...` | toss 환경 |

**주의**: `PG_CLIENT_KEY`는 클라이언트 HTML에 포함 가능(TossPayments 설계상 공개키). `PG_SECRET_KEY`와 `PG_WEBHOOK_SECRET`은 절대 클라이언트에 노출 금지.

---

## 6. 데이터 모델

### 6.1 `payments` 테이블

```sql
CREATE TABLE payments (
  payment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pg_provider         VARCHAR(20) NOT NULL DEFAULT 'toss',   -- 'toss' | 'mock'
  pg_transaction_id   VARCHAR(200),                           -- TossPayments paymentKey
  pg_order_id         VARCHAR(200) UNIQUE NOT NULL,           -- 주문번호 (orderId)
  pg_method           VARCHAR(50),                            -- 카드 | 간편결제
  doc_type            VARCHAR(50) NOT NULL,                   -- 내용증명 | 준비서면 | 상대방반박문
  amount_requested    INTEGER NOT NULL,                       -- 결제 요청 금액
  amount_confirmed    INTEGER,                                -- TossPayments 확인 금액
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | DONE | FAILED | CANCELLED
  idempotency_key     VARCHAR(200),                           -- 멱등성 보장용
  receipt_url         TEXT,                                   -- TossPayments 영수증 URL
  webhook_received_at TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  refund_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

**status 상태 전이**

```
PENDING → DONE       (결제 성공)
PENDING → FAILED     (결제 실패 또는 타임아웃)
DONE    → CANCELLED  (환불 완료)
```

### 6.2 `document_access` 테이블

```sql
CREATE TABLE document_access (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type              VARCHAR(50) NOT NULL,          -- 내용증명 | 준비서면 | 상대방반박문
  payment_id            UUID REFERENCES payments(payment_id),
  access_type           VARCHAR(20) NOT NULL,          -- 'paid' | 'free_trial'
  granted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at            TIMESTAMPTZ,                   -- 환불 시 채워짐
  revision_count_used   INTEGER NOT NULL DEFAULT 0,
  revision_count_limit  INTEGER NOT NULL DEFAULT 3,
  generate_count_used   INTEGER NOT NULL DEFAULT 0,    -- /api/generate 호출 횟수 (환불 조건 판단)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_document_access_user_doc ON document_access(user_id, doc_type);
CREATE INDEX idx_document_access_active ON document_access(user_id, doc_type, revoked_at)
  WHERE revoked_at IS NULL;
```

**조회 쿼리 — 유효한 접근 권한 확인**

```sql
SELECT * FROM document_access
WHERE user_id = $1
  AND doc_type = $2
  AND revoked_at IS NULL
ORDER BY granted_at DESC
LIMIT 1;
```

**환불 가능 여부 판단**

```sql
SELECT
  p.payment_id,
  p.status,
  p.created_at,
  da.generate_count_used,
  (NOW() - p.created_at) < INTERVAL '7 days' AS within_refund_window
FROM payments p
JOIN document_access da ON da.payment_id = p.payment_id
WHERE p.payment_id = $1
  AND p.status = 'DONE';
-- 환불 가능: within_refund_window = true AND generate_count_used = 0
```

---

## 7. API 명세

### 7.1 POST `/api/payment/prepare`

**목적**: 결제 시작 전 주문 생성, 클라이언트에 orderId 반환

**Request**
```json
{
  "doc_type": "상대방반박문"
}
```

**Response (200 OK)**
```json
{
  "order_id": "ord_550e8400-e29b-41d4-a716-446655440000",
  "amount": 69000,
  "order_name": "내편문서 상대방반박문 1건",
  "client_key": "test_ck_..."
}
```

**Error (400)**
```json
{
  "error": "INVALID_DOC_TYPE",
  "message": "지원하지 않는 문서 종류입니다."
}
```

**Error (401)**
```json
{
  "error": "UNAUTHORIZED",
  "message": "로그인이 필요합니다."
}
```

**비고**: `amount`는 서버 `DOC_TYPES` 상수 기반으로 서버에서 계산. 클라이언트 입력값 미사용.

---

### 7.2 POST `/api/payment/confirm`

**목적**: TossPayments 결제 완료 후 금액 재검증 및 권한 부여

**Request**
```json
{
  "payment_key": "5zJ4xY7m0kODnyRpQWGrN2nRcQ84sxCXDJQH6KQqXQ6w",
  "order_id": "ord_550e8400-e29b-41d4-a716-446655440000",
  "amount": 69000
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "document_access_id": "da_7f3e1234-...",
  "doc_type": "상대방반박문",
  "receipt_url": "https://dashboard.tosspayments.com/receipt/..."
}
```

**Error (400) — 금액 불일치**
```json
{
  "error": "AMOUNT_MISMATCH",
  "message": "결제 금액이 일치하지 않습니다."
}
```

**Error (409) — 중복 처리**
```json
{
  "error": "ALREADY_CONFIRMED",
  "message": "이미 처리된 주문입니다."
}
```

---

### 7.3 POST `/api/payment/webhook`

**목적**: TossPayments 비동기 콜백 처리

**Headers**
```
TossPayments-Signature: v1=<HMAC-SHA256 signature>
Content-Type: application/json
```

**Request Body (TossPayments 표준 포맷)**
```json
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "createdAt": "2026-06-21T14:30:00+09:00",
  "data": {
    "orderId": "ord_550e8400-e29b-41d4-a716-446655440000",
    "paymentKey": "5zJ4xY7m0kODnyRpQWGrN2nRcQ84sxCXDJQH6KQqXQ6w",
    "status": "DONE"
  }
}
```

**Response (200 OK)**
```json
{ "received": true }
```

**Response (400) — 서명 검증 실패**
```json
{ "error": "INVALID_SIGNATURE" }
```

---

### 7.4 POST `/api/payment/cancel`

**목적**: 환불 요청 처리

**Request**
```json
{
  "payment_id": "550e8400-e29b-41d4-a716-446655440000",
  "cancel_reason": "서비스 미사용으로 인한 환불 요청"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "cancel_amount": 69000,
  "canceled_at": "2026-06-21T15:00:00+09:00"
}
```

**Error (400) — 환불 불가**
```json
{
  "error": "REFUND_NOT_ELIGIBLE",
  "reason": "ALREADY_USED",
  "message": "이미 문서 생성이 시작된 결제는 환불이 불가합니다."
}
```

**Error (400) — 기간 초과**
```json
{
  "error": "REFUND_NOT_ELIGIBLE",
  "reason": "EXPIRED_WINDOW",
  "message": "환불 가능 기간(7일)이 지났습니다."
}
```

---

### 7.5 GET `/api/payment/history`

**목적**: 사용자별 결제 내역 조회

**Query Parameters**
```
?page=1&per_page=10&status=DONE  (status 필터 선택, 미전달 시 전체)
```

**Response (200 OK)**
```json
{
  "total": 5,
  "page": 1,
  "per_page": 10,
  "items": [
    {
      "payment_id": "550e8400-...",
      "doc_type": "상대방반박문",
      "amount_confirmed": 69000,
      "status": "DONE",
      "created_at": "2026-06-21T14:30:00+09:00",
      "receipt_url": "https://dashboard.tosspayments.com/receipt/...",
      "refundable": true,
      "refundable_until": "2026-06-28T14:30:00+09:00"
    }
  ]
}
```

---

## 8. UI 변경 범위

### 8.1 PaymentModal — `step:fail` 추가

기존 PaymentModal 컴포넌트에 신규 step variant 추가.

```
PaymentModal
  props:
    step: 'select' | 'pay' | 'success' | 'fail'  ← 'fail' 신규
    failType?: 'USER_CANCEL' | 'CARD_ERROR' | 'LIMIT_EXCEEDED' | 'NETWORK_ERROR' | 'AMOUNT_MISMATCH'
    onRetry: () => void
    onClose: () => void
```

**fail step UI 구성**
- 아이콘: ErrorState (빨간 느낌표)
- 제목: "결제가 완료되지 않았습니다"
- 메시지: failType별 한국어 안내 문구
- 버튼: [다시 시도] (primary) / [닫기] (ghost)

### 8.2 FreeTrialBanner — 잔여 체험 횟수 표시

기존 FreeTrialBanner가 `document_access` 테이블 데이터를 기반으로 실제 잔여 횟수를 표시하도록 연결한다.

```
GET /api/user/trial_status
Response: {
  "doc_type": "내용증명",
  "free_trial_used": false,
  "revision_remaining": 3
}
```

### 8.3 마이페이지 결제 내역 탭 (신규 화면)

기존 마이페이지에 "결제 내역" 탭 추가.

```
마이페이지
  └─ Tab (line variant)
       ├─ 나의 문서  (기존)
       └─ 결제 내역  (신규)
            ├─ 기간 필터 (Select)
            ├─ 결제 목록 (PaymentHistoryItem 컴포넌트)
            │     - 문서종류 DocChip
            │     - 금액, 결제일
            │     - 상태 Badge (success/warning/danger/neutral)
            │     - 영수증 보기 링크
            │     - 환불 신청 Button (ghost, 조건부 노출)
            └─ Pagination
```

**신규 컴포넌트**: `PaymentHistoryItem`
- props: `paymentId, docType, amount, status, createdAt, receiptUrl, refundable, refundableUntil`
- 기존 공통 컴포넌트(Badge, DocChip, Button, Pagination) 조합으로 구성
- 별도 스타일 추가 금지

### 8.4 `/api/generate` 403 처리 (클라이언트)

기존 `AIGenerateButton` 클릭 핸들러에 403 응답 처리 추가.

```javascript
// 기존
const response = await fetch('/api/generate', { ... });

// 추가
if (response.status === 403) {
  const error = await response.json();
  if (error.error === 'PAYMENT_REQUIRED') {
    openPaymentModal(docType);
    return;
  }
  if (error.error === 'REVISION_LIMIT_EXCEEDED') {
    showToast({ type: 'error', message: '대화형 수정 횟수(3회)를 모두 사용하셨습니다.' });
    return;
  }
}
```

---

## 9. 구현 우선순위 및 단계

### Phase 1: Mock 결제 (개발·내부 테스트)

**목표**: 실 PG 연동 없이 전체 결제 플로우 동작 검증

| 작업 | 우선순위 | 예상 공수 |
|---|---|---|
| `payments`, `document_access` 테이블 Supabase 마이그레이션 | P0 | 0.5일 |
| `PaymentGateway` ABC + `MockGateway` 구현 | P0 | 0.5일 |
| `gateway_factory.py` + 환경변수 설정 | P0 | 0.25일 |
| `/api/payment/prepare`, `/api/payment/confirm` 구현 (Mock) | P0 | 1일 |
| FR-30: `/api/generate`, `/api/revise`, `/api/download_docx` 접근 권한 게이트 | P0 | 1일 |
| PaymentModal `step:fail` UI 추가 | P0 | 0.5일 |
| 클라이언트 403 처리 + PaymentModal 자동 표시 | P0 | 0.5일 |
| 무료 체험 워터마크 (.docx 서버 사이드 삽입) | P0 | 0.5일 |
| **Phase 1 합계** | | **약 5일** |

### Phase 2: TossPayments 테스트 환경

**목표**: TossPayments 테스트 키로 실제 결제 팝업 및 API 연동 검증

| 작업 | 우선순위 | 예상 공수 |
|---|---|---|
| `TossPaymentsGateway` 구현 (`confirm`, `cancel`, `verify_webhook`) | P0 | 1.5일 |
| `/api/payment/webhook` 구현 (서명 검증 + 멱등성) | P0 | 1일 |
| 클라이언트 TossPayments SDK 로드 + 팝업 흐름 구현 | P0 | 1일 |
| 마이페이지 결제 내역 화면 (`/api/payment/history` + `PaymentHistoryItem`) | P1 | 1일 |
| FR-28: 환불 처리 (`/api/payment/cancel`) | P1 | 0.5일 |
| FreeTrialBanner `document_access` 연동 | P1 | 0.5일 |
| **Phase 2 합계** | | **약 5.5일** |

### Phase 3: 실결제 전환

**목표**: TossPayments 실결제 키 전환 및 운영 환경 검증

| 작업 | 우선순위 | 예상 공수 |
|---|---|---|
| `PG_TEST_MODE=false`, 실결제 키 환경변수 설정 | P0 | 0.25일 |
| 전체 결제 시나리오 E2E 테스트 (실카드) | P0 | 1일 |
| 결제 감사 로그 확인 및 모니터링 설정 | P0 | 0.5일 |
| TossPayments 대시보드에서 Webhook URL 등록 | P0 | 0.25일 |
| **Phase 3 합계** | | **약 2일** |

---

## 10. 미결 사항 (Open Questions)

| # | 질문 | 관련 FR | 우선순위 | 기한 |
|---|---|---|---|---|
| OQ-PAY-01 | 환불 정책을 "미사용 7일 이내"로 확정하되, FAQ 및 결제 완료 화면에 동일 문구로 명시 필요. 법무 검토 필요한가? | FR-28 | High | Phase 2 전 |
| OQ-PAY-02 | 영수증 이메일 자동 발송은 TossPayments 대시보드 설정으로 가능. 별도 구현 없이 대시보드 설정으로 대체할지 확인 필요 | FR-29 | Medium | Phase 2 |
| OQ-PAY-03 | `document_access` 1건 = 1번의 `/api/generate` 호출 허용인가, 아니면 미리보기 재생성(`다시 생성` 버튼)도 횟수에 포함하는가? | FR-30, FR-25 | High | Phase 1 전 |
| OQ-PAY-04 | 워터마크 삽입 방식: 배경 워터마크(전면) vs 하단 footer 텍스트 — 법적 고지 명확성 관점에서 결정 필요 | FR-30, M-08 | Medium | Phase 1 |
| OQ-PAY-05 | 결제 실패 후 `PENDING` 상태 주문의 만료 처리 정책: 24시간 후 자동 `EXPIRED`로 전환하는 배치 작업 필요 여부 | FR-27, FR-29 | Low | Phase 2 |

---

## 11. 테스트 시나리오

### 11.1 Happy Path

| # | 시나리오 | 기대 결과 |
|---|---|---|
| T-01 | 로그인 사용자가 준비서면 49,000원 결제 성공 | `payments.status=DONE`, `document_access` 생성, 문서 생성 1단계 이동 |
| T-02 | 내용증명 무료 체험 사용 (가입 후 첫 문서) | `document_access(access_type=free_trial)` 생성, 워터마크 있는 .docx 다운로드 |
| T-03 | 결제 성공 후 `/api/revise` 반복 사용 | 횟수 제한 없이 계속 수정 가능. `revision_count_used` 증가, 403 미반환 |
| T-04 | 결제 후 7일 이내 미사용 건 환불 신청 | `payments.status=CANCELLED`, `document_access.revoked_at` 기록 |
| T-05 | Webhook 정상 수신 | `payments.status` 업데이트, `webhook_received_at` 기록 |

### 11.2 Edge Cases

| # | 시나리오 | 기대 결과 |
|---|---|---|
| T-06 | 결제 팝업에서 X 버튼으로 닫기 | `PaymentModal step:fail(USER_CANCEL)` 표시 |
| T-07 | 동일 orderId로 `/api/payment/confirm` 중복 호출 | 두 번째 호출에 409 반환, DB 변경 없음 |
| T-08 | 클라이언트가 amount 변조 (1원 전달) | 서버 재검증에서 불일치 감지, 400 반환, 결제 거부 |
| T-09 | 서명이 잘못된 Webhook 수신 | 400 반환, DB 변경 없음 |
| T-10 | 문서 생성 1회 사용 후 환불 시도 | 400 `REFUND_NOT_ELIGIBLE(ALREADY_USED)` 반환 |
| T-11 | 결제 후 8일 경과 후 환불 시도 | 400 `REFUND_NOT_ELIGIBLE(EXPIRED_WINDOW)` 반환 |
| T-12 | 비로그인 상태에서 `/api/payment/prepare` 호출 | 401 반환 |
| T-13 | 내용증명 무료 체험 소진 후 재시도 | 결제 모달 자동 표시 (무료 체험 불가 안내) |
| T-14 | `PG_PROVIDER=mock` 환경에서 `_mock_force_fail=true` 전달 | 결제 실패 흐름 재현 가능 |

### 11.3 비기능 테스트

| # | 테스트 | 방법 | 합격 기준 |
|---|---|---|---|
| T-15 | `PG_SECRET_KEY` 클라이언트 노출 여부 | 브라우저 DevTools 네트워크 탭 확인 | 응답 어디에도 SECRET_KEY 미포함 |
| T-16 | TossPayments API 타임아웃 | 네트워크 throttle 10초 이상 설정 | 오류 메시지 표시 및 재시도 유도 |
| T-17 | 동시 결제 요청 (멱등성) | 동일 orderId로 confirm 2회 동시 호출 | 두 번째 요청 409, 중복 권한 미생성 |

---

## 12. 제약 조건 및 가정

### 12.1 기술 제약

- Flask 기반 기존 서버 구조 유지 (비동기 처리는 Webhook으로 보완)
- Supabase 기존 Auth 테이블(`auth.users`)에 외래키로 연결
- 빌드 도구 없는 CDN 기반 React — TossPayments SDK는 `<script>` 태그로 로드

### 12.2 가정

- TossPayments 가맹점 계정 및 API 키는 별도 발급 완료되어 있다고 가정
- Webhook URL은 공개 도메인이 필요하며, 개발 환경에서는 ngrok 또는 TossPayments 테스트 Webhook 기능 사용
- 부분 환불 시나리오는 현재 요구사항에 없으므로 구현하지 않음
- 결제 시 세금계산서 발급 요구는 현재 Out of Scope (추후 사업자 등록 후 검토)

---

## 13. 향후 확장 (Out of Scope for v1.0)

| 항목 | 시기 |
|---|---|
| 항소이유서 결제 연동 (99,000원) | v2.0 출시 시 |
| 기업·구독 월정액 플랜 | v3.0 |
| 구독 플랜 사용자 `document_access` 자동 생성 (월간 배치) | v3.0 |
| 세금계산서 자동 발급 | 추후 |
| 이메일 영수증 자동 발송 | 추후 |
| 결제 실패 자동 재시도 (카드 한도 일시 초과 등) | 추후 |

---

*본 문서는 내편문서 건별 결제 구현 명세 v1.0이며, 이해관계자 검토에 따라 변경될 수 있습니다.*
*소유·운영: 주식회사 더그라운드모여 (TheGroundMOYO Inc.) · copyright@TheGroundMOYO*
