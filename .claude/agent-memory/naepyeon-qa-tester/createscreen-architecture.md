---
name: createscreen-architecture
description: CreateScreen(static/js/create_screen.js) 3단계 화면의 상태 흐름과 증거(evidence) 데이터가 Step 간 전달되는 두 갈래 구조
metadata:
  type: project
---

CreateScreen은 `window.CreateScreen`(static/js/create_screen.js) 단일 컴포넌트가 step(1/2/3) state로 분기한다.

**증거(evidence) 데이터는 두 개의 독립 소스로 갈라져 흐른다 — 이 분리가 버그의 단골 원인이다:**

1. `evidenceFiles` state — CreateScreen에 lift됨. 업로드 중/완료 칩 raw 목록. Step2·3 "하단 공통 컨테이너"(evidence-bottom-container)가 이걸 읽음. step 전환 시 초기화되지 않음.
2. `formData.evidence_list` — StepInput.handleSubmit에서 `status==="done"`만 필터해 onSubmit→generate→setFormData로 저장. Step3의 `EvidenceUploader mode="preview"`가 이걸 읽음(`evidenceList={(formData && formData.evidence_list) || []}`).

**Why:** 같은 "증거"를 화면마다 다른 prop 경로로 받기 때문에, 업로드가 done 되기 전 제출하거나 한쪽 소스만 채워지면 한 화면에는 보이고 다른 화면에는 안 보이는 증상이 난다.

**How to apply:** "Step2/3에서 증거가 안 보인다" 류 버그는 항상 (a) `evidenceFiles[].status`가 "done"인지, (b) 제출 시점에 업로드가 끝났는지(handleSubmit이 done만 통과시킴), (c) EvidenceUploader preview가 `formData.evidence_list`를 받는지 세 갈래를 모두 확인하라.

관련: revise API는 create_screen.js에서 `docType`을 안 넘김(`revise({draft, revisionRequest})`) → 서버 FR-30 수정횟수 게이트가 동작 안 함. 백업본 create_screen-수진_집.js는 docType을 넘김. [[recurring-violations]]
