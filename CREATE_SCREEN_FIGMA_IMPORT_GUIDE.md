# CreateScreen — HtmlToDesign Import & Figma 컴포넌트 재구성 가이드

> 기준 문서: `CLAUDE.md` (컴포넌트 설계 규칙 v1.2) · `ComponentsPlan.md` (실제 구현 현황)
> 대상 코드: [create_screen.js](static/js/create_screen.js) **단독** (다른 화면 제외)
> 목적: 문서 생성 1·2·3단계를 HtmlToDesign으로 Figma에 가져온 뒤, **가져온 raw layer를 최종 Figma 컴포넌트 인스턴스로 교체**하기 위한 작업 가이드
> 작성일 기준: 2026-06-14

---

## ⚠️ 이 문서의 대전제 (먼저 읽기)

1. **HtmlToDesign import 결과(raw layer)는 최종본이 아니다.** 단순히 DOM을 Figma 도형으로 옮긴 "참고용 스냅샷"이며, 컴포넌트 등록·variant·Auto Layout이 없는 죽은 레이어다.
2. **최종 화면은 반드시 이미 등록된 Figma 컴포넌트 인스턴스로 재구성**해야 한다. raw layer를 그대로 두거나 그 위에 도형을 덧그리는 것 금지 (CLAUDE.md §2·§5).
3. 컴포넌트 이름·variant·state는 **CLAUDE.md의 설계 규칙**과 **ComponentsPlan.md의 실제 구현 상태**를 기준으로 맞춘다. 추측으로 새 컴포넌트를 만들지 않는다.
4. 이 가이드는 **CreateScreen만** 다룬다. Home / Dashboard / MyDocs / Subscription / Help / Login / Signup 은 범위 밖이다.

---

## 1. 대상 화면

- **코드 파일:** [create_screen.js](static/js/create_screen.js) — `window.CreateScreen` (한 파일에서 `step` 상태로 1→2→3 전환)
- **라우트:** `/create/1`, `/create/2`, `/create/3` (prototype.js: `initialStep`)
- **단계:**
  | 단계 | 코드 함수 | 화면 목적 |
  |---|---|---|
  | **문서 생성 1단계: 정보 입력** | `StepInput` | 문서종류 선택 + 발신/수신인 + 사건표시 + 시간순 경위 + 증거 업로드 + (반박문)상대방 분석 + 사건경위/요구사항 입력 → "초안 생성하기" |
  | **문서 생성 2단계: 초안 미리보기** | `StepPreview` | 생성된 초안 본문(좌) + 읽기전용 증거 패널(우). 생성 중 스피너/스켈레톤, 에러 시 Alert |
  | **문서 생성 3단계: 수정·저장** | `StepEdit` | 문서 본문(좌) + 증거 패널 + AI 어시스턴트 채팅 + 위험문장검사(우) → "완료"(확인 모달 → docx → 토스트) |

- **3단계 공통 상단(모든 단계 고정):** breadcrumb(홈 › 문서 생성 › {문서명}) + 제목("새 {문서명} 만들기") + `StepIndicator`(clickable)
- **3단계 공통 하단:** `LegalNotice` + `SiteFooter`

---

## 2. HtmlToDesign Import 대상

각 단계를 **개별 raw frame**으로 가져온다 (한 번에 합치지 말 것 — 단계 전환이 상태 기반이므로 단계별로 캡처/임포트):

| Import 이름 | 대상 | 캡처 방법 |
|---|---|---|
| `CreateStep1_imported_raw` | `/create/1` 정보 입력 폼 전체 | step=1 상태로 렌더된 DOM |
| `CreateStep2_imported_raw` | `/create/2` 초안 미리보기 (generated 상태) | step=2, draft 생성 완료 상태 |
| `CreateStep3_imported_raw` | `/create/3` 수정·저장 (채팅 패널 포함) | step=3 상태 |

> Tip: 2단계는 `loading`/`error` 상태도 있으나, raw import는 **정상(generated) 상태 1개만** 가져온다. 나머지 상태는 컴포넌트 variant로 재구성 시 만든다.

---

## 3. Figma 위치 구조

### raw import 보관 위치 (참고용, 최종본 아님)
```
05. Archive
  └ HtmlToDesign Raw Import
      └ CreateScreen
          ├ CreateStep1_imported_raw
          ├ CreateStep2_imported_raw
          └ CreateStep3_imported_raw
```

### 최종 재구성 위치 (컴포넌트 인스턴스로만 조립)
```
04. Pages
  └ CreateScreen
      ├ CreateStep1
      ├ CreateStep2
      └ CreateStep3
```

> **규칙:** `04. Pages / CreateScreen` 안의 최종 Frame에는 **raw layer를 절대 남기지 않는다.** raw는 `05. Archive`에서만 참고하고, 최종 Frame은 등록된 컴포넌트 인스턴스 + Auto Layout으로 새로 조립한다.

---

## 4. 단계별 사용해야 할 Figma 컴포넌트

> 경로는 CLAUDE.md §7 폴더 규칙(`ui / document / form / payment / dashboard / layout / feedback`) 기준. 실제 코드 파일 위치는 ComponentsPlan.md §3 확인.

### 공통 (1·2·3단계 전부)
- `layout/Header` (TopNav, variant=authed) — *create는 보호 라우트*
- `document/StepIndicator` — 상단 단계 표시
- `feedback/LegalNoticeBox` (LegalNotice) — 하단 고지
- `layout/SiteFooter` — 푸터
- `ui/Toast` (ToastContainer) — 임시저장/저장완료 알림 *(Overlays)*
- `ui/Modal` (AppModalRoot) — 결제 플로우 / 완료 확인 *(Overlays)*

### 1단계 (정보 입력)
- `document/DocumentTypeCard` (+ DocumentTypePicker)
- `document/FormSection` (+ `TimelineRowEditor`)
- `ui/TextInput` · `ui/Textarea` *(발신/수신/사건표시/사건경위/요구사항)*
- `document/EvidenceUploader`
- `document/OpponentDocAnalysis` *(반박문 docType일 때만)*
- `ui/Button` *(임시저장 / 행 추가 / 초안 생성하기)*
- `ui/Alert` *(입력 검증 에러)*

### 2단계 (초안 미리보기)
- `document/DocumentPreview` (mode=preview)
- `document/EvidenceUploader` (mode=preview, readonly)
- `ui/Button` *(이전 / 다시 생성 / .docx 받기 / 다음)*
- `ui/Alert` *(생성 에러 상태)*
- *(loading 상태: DocumentPreview status=loading — 스피너+스켈레톤)*

### 3단계 (수정·저장)
- `document/DocumentPreview` (mode=edit)
- `document/EvidenceUploader` (mode=preview, readonly)
- `ui/DocChip` *(헤더 문서종류 칩, active)*
- `ui/Badge` *("수정 중")*
- `ui/Button` *(이전 / 다시 생성 / .docx 받기 / 완료 / 빠른수정 칩 / 전송)*
- **위험문장검사:** `document/RiskCheckButton` + `document/RiskWarningBox` *(CLAUDE.md FR-20 — 아래 5·5절 주의 참고)*
- `ui/Modal` (완료 확인 → docx 다운로드)
- *(AI 어시스턴트 채팅 패널: 현재 전용 컴포넌트 없음 — 5절 주의 참고)*

---

## 5. 컴포넌트 매핑표

> raw layer는 HtmlToDesign이 만든 임의 이름이므로, 아래 "raw layer(역할)"는 **DOM 역할 기준 식별자**로 표기한다. import 후 실제 레이어 이름은 다를 수 있으니 역할로 찾아 매핑한다.

| 단계 | HtmlToDesign raw layer (역할) | 최종 Figma 컴포넌트 | 코드 컴포넌트 | 파일 위치 | variant/state | 주의사항 |
|---|---|---|---|---|---|---|
| 공통 | 상단 GNB | `layout/Header` | `TopNav active="create"` | `components.js` | variant=authed | 보호 라우트 — 로그인 상태 헤더 |
| 공통 | 단계 표시 막대 | `document/StepIndicator` | `ClickableSteps`/`StepIndicator` | `document/StepIndicator.js` | size=md, current=1/2/3, clickable=true, 스텝 todo/current/done | steps=3 (STEP1 정보입력/STEP2 미리보기/STEP3 수정·저장) |
| 공통 | breadcrumb·제목 | (컴포넌트 아님) | 인라인 | — | — | 텍스트 레이어로. 새 컴포넌트 만들지 말 것 |
| 공통 | 하단 고지 | `feedback/LegalNoticeBox` | `LegalNotice` | `components.js` | variant=full | |
| 공통 | 푸터 | `layout/SiteFooter` | `SiteFooter` | `layout/SiteFooter.js` | — | |
| 1 | 문서종류 선택 카드 묶음 | `document/DocumentTypeCard` (+Picker) | `DocTypePicker value onChange withPrice` | `document/DocumentTypeCard.js` / `components.js` | docType=notice/brief/rebuttal/appeal/contract, availability=active/v2-planned/coming-soon, selected, withPrice=true | 5종을 같은 컴포넌트 variant로. appeal=예정, contract=오픈예정 |
| 1 | 발신인/수신인 섹션 박스 | `document/FormSection` | 인라인 `<section>` | `document/FormSection.js` | layout=2col, required=true, stepNum=②③ | 코드는 인라인이지만 FormSection으로 등록 |
| 1 | 텍스트 입력칸 (`<input class="input">`) | `ui/TextInput` | raw `<input>` | `ui/Input.js` | type=text, state=default/error | ⚠️ 코드가 raw input 사용 — Figma는 반드시 TextInput 인스턴스 |
| 1 | 사건 표시 행 | `document/FormSection` | 인라인 (needsCase) | `document/FormSection.js` | layout=3col | brief·appeal docType일 때만 노출 |
| 1 | 시간순 사건경위 행 | `document/FormSection` + `TimelineRowEditor` | 인라인 timeline-row | `document/FormSection.js` | rows, 행 추가/삭제 | "행 추가"는 `ui/Button`(outline, sm) |
| 1 | 증거 업로드 드롭존 | `document/EvidenceUploader` | `EvidenceUploader` | `document/EvidenceUploader.js` | mode=input, state=empty/uploading/done/error, aiExtract=true, multiple=true | 업로드 칩에 AI 날짜추출 결과 표시 |
| 1 | 상대방 문서 분석 영역 | `document/OpponentDocAnalysis` | `OpponentDocAnalysis` | `document/OpponentDocAnalysis.js` | state=idle/file-ready/analyzing/done | **rebuttal docType일 때만**. 내부 OpponentClaimItem·RebuttalSuggestionTextarea는 "분석하기" 후 노출 |
| 1 | 사건경위/요구사항 입력 | `ui/Textarea` | raw `<textarea class="textarea">` | `ui/Input.js` | rows=6, helperText | ⚠️ raw textarea → Textarea 인스턴스 |
| 1 | 검증 에러 박스 | `ui/Alert` | `Alert type="error"` | `ui/Alert.js` | type=error | |
| 1 | 임시저장 / 초안 생성하기 버튼 | `ui/Button` | `btn btn-secondary`/`btn btn-primary btn-lg` | `ui/Button.js` | variant=secondary/primary, size=md/lg, icon=save/sparkle | |
| 2 | 초안 본문 패널 | `document/DocumentPreview` | StepPreview `doc-preview` | `document/DocumentPreview.js` | mode=preview, status=generated/loading/error/empty | loading=스피너+스켈레톤, error=Alert+돌아가기 |
| 2 | 우측 증거 패널 | `document/EvidenceUploader` | `EvidenceUploader mode="preview"` | `document/EvidenceUploader.js` | mode=preview, readonly=true, showDownloadButton=true | 읽기 전용 |
| 2 | 하단 네비 버튼들 | `ui/Button` | 이전/다시생성/.docx/다음 | `ui/Button.js` | variant=subtle/secondary/primary | |
| 3 | 헤더 문서종류 칩 | `ui/DocChip` | `DocChip active` | `ui/DocChip.js` | active=true, size=md | |
| 3 | "수정 중" 라벨 | `ui/Badge` | `badge badge-warning` | `ui/Badge.js` | variant=warning | loading/riskChecking 시 |
| 3 | 문서 본문(수정) 패널 | `document/DocumentPreview` | StepEdit `doc-preview` | `document/DocumentPreview.js` | mode=edit, status=edited | |
| 3 | 위험문장검사 버튼 | `document/RiskCheckButton` | 인라인 `btn`(warning) `handleRiskCheck` | (신규 등록) | state=idle/checking/done | CLAUDE.md FR-20. 코드는 인라인 → 컴포넌트로 등록 |
| 3 | 위험문장검사 결과 박스 | `document/RiskWarningBox` | `RiskResultChatMsg` (인라인 함수) | (신규 등록) | severity=warning, item={원문,사유,수정제안} | 코드상 별도 파일 없음 — 5절 주의 |
| 3 | AI 어시스턴트 채팅 패널 | (보류 — 5절 주의) | `chat-panel` 인라인 | 없음 | — | 전용 공통 컴포넌트 없음. 임의 컴포넌트화 금지 |
| 3 | 완료 확인 모달 | `ui/Modal` | `AppModal.open` | `ui/Modal.js` | type=confirm, size=sm, action=double | Overlays에 배치 |
| 1·3 | 결제 플로우 모달 | `ui/Modal` | `openPaymentFlow` | `ui/Modal.js` | type=payment | 크레딧 소진 시 트리거. Overlays |
| 공통 | 임시저장/저장완료 알림 | `ui/Toast` | `ToastManager.show` | `ui/Toast.js` | type=success/error, duration=2500 | Overlays |

---

## 6. 직접 도형으로 만들면 안 되는 요소 (CreateScreen)

아래는 **절대 Rectangle/Frame/Text로 새로 그리지 말 것.** raw layer를 참고만 하고, 반드시 등록된 컴포넌트 인스턴스로 교체한다:

- **버튼** (임시저장 / 초안 생성하기 / 행 추가 / 이전 / 다시 생성 / .docx 받기 / 다음 / 완료 / 빠른수정 칩 / 전송) → `ui/Button`
- **입력 필드** (발신/수신/사건표시 input, 사건경위/요구사항 textarea) → `ui/TextInput` / `ui/Textarea`
- **카드** (단계 컨테이너, 미리보기 카드 등) → `ui/Card`
- **문서 종류 카드** → `document/DocumentTypeCard`
- **StepIndicator** (단계 표시) → `document/StepIndicator`
- **EvidenceUploader** (증거 드롭존·칩) → `document/EvidenceUploader`
- **DocumentPreview** (2·3단계 문서 본문 영역) → `document/DocumentPreview`
- **Alert** (검증/생성 에러) → `ui/Alert`
- **Modal** (결제·완료 확인) → `ui/Modal`
- **위험문장검사 영역** (검사 버튼 + 결과 박스) → `document/RiskCheckButton` + `document/RiskWarningBox`
- **DocChip / Badge** (3단계 헤더 칩·상태 라벨) → `ui/DocChip` / `ui/Badge`
- **OpponentDocAnalysis** (상대방 분석) → `document/OpponentDocAnalysis`

---

## 7. Figma 작업 순서

1. **HtmlToDesign import** → 결과를 `05. Archive / HtmlToDesign Raw Import / CreateScreen` 아래 `CreateStep1~3_imported_raw`로 보관. (참고용, 최종본 아님)
2. **`04. Pages / CreateScreen` 아래 새 Frame 3개 생성**: `CreateStep1`, `CreateStep2`, `CreateStep3`. (빈 Auto Layout Frame으로 시작)
3. **컴포넌트 라이브러리 확인** — 4절 컴포넌트가 Main Component로 등록돼 있는지 먼저 확인. 없으면 ComponentsPlan.md 분리 현황을 보고 등록(또는 미정 항목은 보류).
4. **raw layer를 참고**해 배치·간격·순서만 확인하고, 최종 Frame에는 **기존 컴포넌트 인스턴스를 드래그해 재조립.** (raw 위에 덧그리기 금지)
5. **단계별 조립:**
   - CreateStep1: Header → StepIndicator → DocumentTypeCard → FormSection(발신/수신/사건표시) → TimelineRowEditor → EvidenceUploader → (rebuttal면 OpponentDocAnalysis) → Textarea×2 → Alert → Button → LegalNoticeBox → SiteFooter
   - CreateStep2: Header → StepIndicator → DocumentPreview(preview, +loading/error variant) ‖ EvidenceUploader(preview) → 하단 Button 행 → LegalNoticeBox → SiteFooter
   - CreateStep3: Header → StepIndicator → DocChip+Badge → DocumentPreview(edit) ‖ EvidenceUploader(preview) + (채팅 패널 보류) + RiskCheckButton/RiskWarningBox → 하단 Button 행 → LegalNoticeBox → SiteFooter
6. **최종 Frame 안에 raw layer가 남지 않도록** 정리. raw는 Archive에만.
7. **컴포넌트 이름·variant/state를 CLAUDE.md 기준으로 맞춤.** (예: DocumentPreview mode=preview/edit, StepIndicator current/clickable, EvidenceUploader mode/state)
8. **Modal·Toast는 화면 Frame이 아니라 Overlays**로 분리 보관.

---

## 8. Claude Code가 나중에 Figma MCP로 다시 읽을 때 기준 프롬프트

> 아래 프롬프트를 그대로 사용하면, Claude Code가 Figma의 CreateScreen을 코드와 대조해 검증/동기화할 수 있다.

```
CLAUDE.md(컴포넌트 설계 규칙 v1.2)와 ComponentsPlan.md(실제 구현 현황),
그리고 CREATE_SCREEN_FIGMA_IMPORT_GUIDE.md를 기준으로 작업해줘.

대상: Figma의 04. Pages / CreateScreen 아래 CreateStep1, CreateStep2, CreateStep3 Frame.
(05. Archive의 *_imported_raw 는 참고용 raw layer이며 최종본이 아님 — 검증 대상에서 제외)

확인할 것:
1. 각 Frame이 raw layer 없이 등록된 컴포넌트 인스턴스로만 구성됐는지
2. 사용된 컴포넌트가 4절/5절 매핑표와 일치하는지
   (StepIndicator, DocumentTypeCard, FormSection, TimelineRowEditor,
    EvidenceUploader, OpponentDocAnalysis, DocumentPreview, Button, Alert,
    Modal, Toast, LegalNoticeBox, DocChip, Badge, RiskCheckButton/RiskWarningBox)
3. 각 인스턴스의 variant/state가 CLAUDE.md 정의와 맞는지
   (예: DocumentPreview mode=preview/edit, EvidenceUploader mode=input/preview·readonly,
    StepIndicator current=1/2/3·clickable, DocumentTypeCard availability=active/v2-planned/coming-soon)
4. create_screen.js의 실제 단계 구조(StepInput/StepPreview/StepEdit)와
   섹션 순서가 일치하는지
5. 코드와 어긋나는 지점(아래)이 의도대로 처리됐는지:
   - STEP1 폼이 raw input이 아니라 TextInput/Textarea 인스턴스인지
   - 채팅 패널 컴포넌트화 여부(현재 보류)
   - RiskWarningBox/RiskCheckButton 등록 여부

코드는 수정하지 말고, 불일치 항목만 리포트해줘.
```

---

## 부록 A. 코드와 CLAUDE.md가 어긋나는 지점 (작업 전 확인 필요)

> 임의 판단하지 말고 아래는 별도 확인 후 진행:

1. **STEP1 폼의 raw input/textarea** — 코드는 `<input className="input">`/`<textarea className="textarea">`를 직접 사용. CLAUDE.md 규칙상 Figma는 `ui/TextInput`·`ui/Textarea` 인스턴스로 등록해야 함 (규칙 우선).
2. **AI 어시스턴트 채팅 패널** (`chat-panel`/`chat-bubble`, 3단계) — 전용 공통 컴포넌트가 없음(인라인). **컴포넌트화 여부 미정 → 임의 신규 생성 금지.** 우선 Frame+Text로 두되 컴포넌트화는 별도 합의.
3. **RiskResultChatMsg** (위험문장검사 결과, 3단계) — 코드상 별도 컴포넌트 파일이 아닌 인라인 함수. CLAUDE.md `RiskWarningBox`(severity=warning, item={원문,사유,수정제안}) / `RiskCheckButton`(state=idle/checking/done)으로 매핑·등록할지 확정 필요.
4. **FormSection 적용 범위** — 코드의 발신/수신/사건표시 섹션은 인라인 `<section>`이지만 `document/FormSection.js`가 분리돼 있음(ComponentsPlan §3). Figma는 FormSection 인스턴스로 등록.
5. **OpponentClaimItem / RebuttalSuggestionTextarea** — `OpponentDocAnalysis` 내부 구성요소이며 "분석하기" 실행 후에만 노출(CLAUDE.md FR-19). Figma는 state=idle / done 인스턴스 2종으로 표현.

## 부록 B. CreateScreen에서 쓰는 DOC_TYPES (1단계 문서종류 카드)

| id | name | icon | availability | priceLabel | 비고 |
|---|---|---|---|---|---|
| notice | 내용증명 | mail | active | 9,900원 | 첫 1건 무료(워터마크)·수정 3회 |
| brief | 준비서면 | book | active | 49,000원 | 사건표시 섹션 노출 |
| rebuttal | 상대방 반박문 | chat | active | 69,000원 | OpponentDocAnalysis 노출 |
| appeal | 항소이유서 | gavel | v2-planned | 99,000원 | "예정" — 생성 비활성 |
| contract | 계약서 | shield | coming-soon | — | "오픈 예정" — 생성 비활성 |

> 1단계 종류 카드는 5종을 **같은 `DocumentTypeCard` 컴포넌트의 variant**로만 표현한다. 종류마다 새 카드를 그리지 않는다.
