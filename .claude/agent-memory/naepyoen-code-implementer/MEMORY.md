# naepyoen-code-implementer 메모리 인덱스

- [결제 정가 단일 출처](project_payment_price_source.md) — DOC_PRICES 위치 및 PRD-코드 가격 불일치 처리(9,900 기준)
- [결제 백엔드 구조](project_payment_gateway_arch.md) — PG 추상화 + Phase 1 인메모리 vs Phase 2 Toss 전환 경계
- [documents 저장소 혼재](project_documents_storage_split.md) — documents는 실 Supabase, 결제는 인메모리. user_id 필터가 1차 경계
