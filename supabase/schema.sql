-- ============================================================
-- 내편문서 — 무료체험 크레딧 스키마 (v1.0)
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- ── 1. profiles 테이블 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email      TEXT,
  provider   TEXT,         -- 'email' | 'google' | 'kakao'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. user_credits 테이블 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_notice_remaining     INT NOT NULL DEFAULT 1,   -- 무료 내용증명 잔여 건수
  trial_revision_remaining   INT NOT NULL DEFAULT 3,   -- 무료 대화형 수정 잔여 횟수
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. 신규 회원 자동 지급 트리거 ────────────────────────────
-- auth.users에 행이 INSERT될 때마다 실행 (이메일·Google·Kakao 모두 동일)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- profiles 생성
  INSERT INTO public.profiles (user_id, display_name, email, provider)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'nickname',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- user_credits 생성 (중복 방지: PRIMARY KEY 충돌 시 무시)
  INSERT INTO public.user_credits (user_id, trial_notice_remaining, trial_revision_remaining)
  VALUES (NEW.id, 1, 3)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 기존 트리거 삭제 후 재생성 (멱등 실행 보장)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. RLS 활성화 ───────────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS 정책 ─────────────────────────────────────────────
-- profiles: 본인만 조회
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- user_credits: 본인만 조회 (UPDATE는 RPC 함수만 허용)
DROP POLICY IF EXISTS "credits_select_own" ON public.user_credits;
CREATE POLICY "credits_select_own" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- ── 6. 크레딧 차감 RPC (SECURITY DEFINER — 클라이언트가 호출, 서버 권한으로 실행) ──

-- 내용증명 크레딧 1건 차감
-- 반환: TRUE = 차감 성공 / FALSE = 잔여 없음
CREATE OR REPLACE FUNCTION public.deduct_trial_notice()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_remaining INT;
BEGIN
  SELECT trial_notice_remaining INTO v_remaining
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET trial_notice_remaining = trial_notice_remaining - 1,
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN TRUE;
END;
$$;

-- 대화형 수정 크레딧 1회 차감
CREATE OR REPLACE FUNCTION public.deduct_trial_revision()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_remaining INT;
BEGIN
  SELECT trial_revision_remaining INTO v_remaining
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET trial_revision_remaining = trial_revision_remaining - 1,
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN TRUE;
END;
$$;
