-- 내편문서 — 건별 결제 DB 스키마 (PRD 건별결제 v1.0 §6)
-- 실행: Supabase SQL Editor 에서 수동 실행 (Phase 1 에서는 인메모리로 대체, 실행 안 함)
-- 의존: auth.users (Supabase Auth 기존 테이블)

-- ── payments: 모든 결제 시도(성공·실패·취소·환불) 기록 (§6.1) ──
CREATE TABLE IF NOT EXISTS payments (
  payment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pg_provider         VARCHAR(20) NOT NULL DEFAULT 'toss',   -- 'toss' | 'mock'
  pg_transaction_id   VARCHAR(200),                          -- TossPayments paymentKey
  pg_order_id         VARCHAR(200) UNIQUE NOT NULL,          -- 주문번호 (orderId)
  pg_method           VARCHAR(50),                           -- 카드 | 간편결제
  doc_type            VARCHAR(50) NOT NULL,                  -- 내용증명 | 준비서면 | 상대방반박문
  amount_requested    INTEGER NOT NULL,                      -- 결제 요청 금액
  amount_confirmed    INTEGER,                               -- TossPayments 확인 금액
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',-- PENDING | DONE | FAILED | CANCELLED
  idempotency_key     VARCHAR(200),                          -- 멱등성 보장 (NFR-PAY-03)
  receipt_url         TEXT,                                  -- TossPayments 영수증 URL
  webhook_received_at TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  refund_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- ── document_access: 문서 접근 권한 + 무료체험/수정횟수 관리 (§6.2) ──
CREATE TABLE IF NOT EXISTS document_access (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type              VARCHAR(50) NOT NULL,         -- 내용증명 | 준비서면 | 상대방반박문
  payment_id            UUID REFERENCES payments(payment_id),
  access_type           VARCHAR(20) NOT NULL,         -- 'paid' | 'free_trial'
  granted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at            TIMESTAMPTZ,                  -- 환불 시 기록
  revision_count_used   INTEGER NOT NULL DEFAULT 0,
  revision_count_limit  INTEGER NOT NULL DEFAULT 3,
  generate_count_used   INTEGER NOT NULL DEFAULT 0,   -- /api/generate 호출 횟수 (환불 조건 판단)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_access_user_doc
  ON document_access(user_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_document_access_active
  ON document_access(user_id, doc_type, revoked_at)
  WHERE revoked_at IS NULL;
