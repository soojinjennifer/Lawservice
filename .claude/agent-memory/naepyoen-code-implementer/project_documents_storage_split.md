---
name: documents-storage-split
description: documents 테이블은 실제 Supabase 연동(supabase-py)인 반면, 결제/권한은 아직 인메모리 dict(Phase 1)라는 혼재 상태
metadata:
  type: project
---

`documents` 기능(나의 문서 탭 / 홈 진행현황)은 **실제 Supabase 연동**(supabase-py)으로 구현됨.
반면 `payment_routes.py`의 결제·권한(`_PAYMENTS`, `_DOC_ACCESS`)은 아직 **인메모리 dict(Phase 1)**.

**Why:** 사용자가 documents만 실 DB로 가기로 선택(2026-06). 결제 모듈은 Phase 2 전환 미완.
**How to apply:**
- `documents` 관련: server.py `_get_supabase()` 싱글턴 클라이언트 사용. anon key 기반이라 RLS `auth.uid()`를 못 채우므로 모든 쿼리에 `.eq("user_id", user_id)` 명시 필터가 1차 경계. RLS+JWT/service-role은 Phase 2 과제(server.py 주석에 명시).
- 무료체험 잔여 수치는 documents 통계라도 결제 모듈 `get_trial_status()` 단일 출처를 재활용한다(중복 계산 금지).
- documents 테이블은 Supabase 대시보드에서 수동 생성. DDL은 server.py `_get_supabase` 위 주석에 보관.
- env: `SUPABASE_URL`에 스킴(https://)이 없을 수 있어 `_get_supabase()`에서 보정함. service-role 키 추가 시 `SUPABASE_SERVICE_KEY` 우선 사용.

관련: [[payment-price-source]]
