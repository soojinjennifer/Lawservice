---
name: recurring-violations
description: CLAUDE.md 규칙 위반이 반복되는 위치 — create_screen.js의 인라인 스타일·로직 중복·페이지 내 임시 컴포넌트
metadata:
  type: project
---

CLAUDE.md(v1.2) 위반이 반복 관찰되는 지점:

- **인라인 스타일 남발 (5번 금지)**: static/js/create_screen.js 전반. 섹션 헤더 원형 번호 배지(②③④), evidence-file-card 등 거의 모든 요소가 `style={{...}}` 인라인. CLAUDE.md 8-2 "화면별 색/폰트/간격 임의 지정 금지" 위반.
- **공통 컴포넌트 미사용 (2번/4번)**: Step2·3 하단 evidence-bottom-container가 EvidenceUploader를 안 쓰고 `.evidence-file-card`를 페이지 안에서 직접 마크업(create_screen.js ~line 1244-1285). 같은 화면 Step3 상단(line 903)은 EvidenceUploader를 쓰는데 하단은 별도 구현 → 동일 역할 UI 중복.
- **버튼 스타일 page-local (5번 금지)**: Step2·3 하단 액션이 `<Btn>` 공통 컴포넌트 대신 `<button className="btn btn-secondary">` 직접 사용(create_screen.js line 573~). StepInput은 `<Btn>`을 씀 → 같은 화면 안에서 혼용.
- **로직 중복**: sendRevision / handleRiskCheck / handleApplySuggestion이 StepEdit 내부와 CreateScreen 본체에 거의 동일하게 두 벌 존재(예: line 646 vs 1015, 714 vs 1043). CreateScreen 본체 버전은 StepEdit에 전달되지 않아 dead code 의심.

**Why:** 이 파일이 가장 자주 수정되는 hot path라 빠른 수정이 누적되며 규칙이 무너진 상태.

**How to apply:** create_screen.js를 QA할 때 위 4개를 기본 점검 항목으로 항상 확인. 단, CLAUDE.md 1번(한 번에 많은 파일 수정 금지)·작게 작업 원칙 때문에 한꺼번에 리팩터링 제안하지 말고 버그 우선·항목별로 분리 제안. [[createscreen-architecture]]
