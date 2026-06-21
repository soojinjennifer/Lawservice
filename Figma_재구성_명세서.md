# 내편문서 — Figma 재구성 명세서 (구현 화면 → Figma 인스턴스)

> 기준 문서: `CLAUDE.md` (컴포넌트 설계 규칙 v1.2) · `ComponentsPlan.md` (실제 구현 현황 2026-06-09)
> 분석 대상: `static/js/` 실제 구현 코드 (수정하지 않음, 분석만)
> 목적: 현재 구현된 화면을 Figma로 가져가되, Figma 안에서도 **컴포넌트 등록 상태가 유지**되도록 화면별 구성요소 ↔ 컴포넌트 1:1 매핑 정의
> 작성일 기준: 2026-06-14

---

## 0. 이 문서를 읽는 법

- 각 화면은 CLAUDE.md §7 "Code Component Mapping Table" 폴더 규칙(`ui / document / form / payment / dashboard / layout / feedback`)을 그대로 따른다.
- 코드는 React를 `window.*` 전역으로 노출하는 방식(JSX, 빌드 없음). 한 화면 파일 = 한 Figma Frame(화면).
- **"사용해야 할 Figma 컴포넌트"** = Figma에서 Main Component를 만들고, 화면에서는 그 **Instance**만 배치해야 하는 요소.
- **"직접 그리면 안 되는 요소"** = 절대 Rectangle/Text로 새로 그리지 말 것. 반드시 등록된 컴포넌트 인스턴스 사용 (CLAUDE.md §2·§5 금지사항).

---

## 1. 전역 규칙 (모든 화면 공통)

### 1-1. 모든 화면에 반드시 인스턴스로 배치해야 하는 공통 컴포넌트

| 코드 컴포넌트 | 코드 위치 | Figma 컴포넌트명 | 역할 |
|---|---|---|---|
| `TopNav` | `components.js` | `layout/Header` | 상단 GNB (variant=guest/authed) |
| `LegalNotice` | `components.js` | `feedback/LegalNoticeBox` | 푸터 바로 위 풀폭 법적 고지 |
| `SiteFooter` | `layout/SiteFooter.js` | `layout/SiteFooter` | 4컬럼 사이트맵 + 소유권 고지 |
| `ToastContainer` | `ui/Toast.js` | `ui/Toast` | 전역 1회 마운트 (화면 우상단 오버레이) |
| `AppModalRoot` | `ui/Modal.js` | `ui/Modal` | 전역 1회 마운트 (결제·확인 모달 오버레이) |

> `TopNav`·`LegalNotice`·`SiteFooter`는 **모든 화면 프레임의 최상단/최하단에 고정 인스턴스**로 넣는다. 화면마다 헤더/푸터를 새로 그리지 말 것.
> `Toast`·`Modal`은 화면 구조가 아니라 오버레이이므로, Figma에서는 별도 "Overlays" 페이지에 상태별 인스턴스로 보관(각 화면에 중복 배치 X).

### 1-2. 디자인 토큰 (CLAUDE.md §8-2)

- 색/폰트/간격은 Fluent 2 변수 + 브랜드 오버라이드만 사용: `--brand-rest:#2D4DAA`, 배경 그라데이션 `#E9F6FF → #E1E3E0`.
- Figma에서도 동일 토큰을 **Variables(Color/Number)** 로 먼저 등록하고, 컴포넌트는 토큰을 바인딩한다. 화면별 임의 색/폰트/간격 지정 금지.

### 1-3. 직접 도형으로 만들면 안 되는 요소 (전 화면 공통 금지 목록)

아래는 코드에서 이미 공통 컴포넌트로 분리되어 있으므로 **Figma에서 Rectangle/Frame/Text로 새로 그리는 것을 금지**한다:

- 버튼류 일체 (`btn btn-primary`, `btn-secondary`, `btn-subtle`, `btn-outline`, `icon-btn`) → `ui/Button` 인스턴스
- 인풋/텍스트영역/셀렉트 (`.input`, `.textarea`) → `ui/TextInput` · `ui/Textarea` · `ui/Select`
- 배지/상태 라벨 → `ui/Badge`
- 카드 (`card-flat`, `card`) → `ui/Card`(variant=flat/default/subtle)
- 문서 종류 칩 (`doc-chip`) → `ui/DocChip`
- 알림 박스 → `ui/Alert`
- 단계 표시기 → `document/StepIndicator`, 미니: `dashboard/MiniSteps`

> ⚠️ 코드에 `className`으로만 존재하고 별도 컴포넌트 파일이 없는 요소(예: 통계 카드 내부 숫자, breadcrumb)는 Figma에서 **카드 인스턴스 + 텍스트 레이어** 조합으로 만들되, 카드 외형 자체는 `ui/Card` 인스턴스를 써야 한다.

### 1-4. 구현 화면 캡처를 참고 이미지로 쓸 때 주의사항

1. 캡처는 **레이아웃 참고용(배치·간격 확인)** 으로만 사용하고, 캡처 이미지를 프레임 배경에 깔아 그 위에 도형을 얹는 "트레이싱" 방식 금지 → 컴포넌트 등록이 깨진다.
2. 캡처에는 **목업 데이터**(예: "(주)미지급상사", "4242", "VISA")가 들어 있다. 이는 Instance의 텍스트 오버라이드 값일 뿐 컴포넌트 기본값이 아니므로, Main Component에는 플레이스홀더(예: "발신인명", "문서 제목")를 넣는다.
3. 캡처 시점의 색/그림자는 모니터·브라우저에 따라 달라 보인다. **반드시 §1-2 토큰 기준**으로 맞추고 캡처 픽셀을 스포이드로 따지 말 것.
4. Hover/loading/error 등 **상호작용 상태는 캡처에 안 나온다.** variant/state 표(각 화면 항목)를 기준으로 누락 상태를 별도 인스턴스로 만든다.
5. 반응형: 캡처는 데스크톱 1축이다. 모바일은 `MobileBottomActionBar`(CLAUDE.md) 규칙이 별도이므로 캡처만 보고 추정하지 말 것.

---

## 2. DOC_TYPES 데이터 (문서 종류 — 카드/칩/피커 공통 소스)

> `components.js`의 `window.DOC_TYPES`가 단일 소스. Figma에서도 카드/칩/피커는 이 5종을 **같은 컴포넌트의 variant/property**로 표현하고, 종류마다 새 카드를 그리지 않는다.

| id | name | icon | availability | priceLabel |
|---|---|---|---|---|
| `notice` | 내용증명 | mail | active | 9,900원 (첫 1건 무료) |
| `brief` | 준비서면 | book | active | 49,000원 |
| `rebuttal` | 상대방 반박문 | chat | active | 69,000원 |
| `appeal` | 항소이유서 | gavel | **v2-planned** ("예정" 배지) | 99,000원 |
| `contract` | 계약서 | shield | **coming-soon** ("오픈 예정") | — |

→ `document/DocumentTypeCard`의 property: `docType`(5종), `availability`(active/v2-planned/coming-soon), `selected`(bool), `withPrice`(bool).

---

# ── 화면별 명세 ──

## 홈 (HomeScreen / 비로그인 랜딩)
- **코드 파일:** [home_screen.js](static/js/home_screen.js)
- **화면 목적:** 비로그인 마케팅 홈. 서비스 소개 → 공감 → 사용법 → 지원문서 → 건별 요금제로 전환 유도.
- **주요 섹션:**
  1. Hero (좌: 카피+CTA 2개+무료 혜택 3칩 / 우: 내용증명 미리보기 카드 + AI 어시스턴트 미니카드)
  2. EmpathySection (navy 그라데이션 + 좌우 번갈이 말풍선 + CTA)
  3. 활용 방법 3단계 (STEP 카드 ×3)
  4. 지원 문서 (`DocumentTypePicker`, withPrice)
  5. 요금제 (`PaymentCardGrid`)
  6. LegalNotice + SiteFooter
- **사용해야 할 Figma 컴포넌트:** `layout/Header` · `ui/Badge` · `ui/Button` · `ui/Card`(flat/default) · `ui/EmpathyBubble`(+EmpathySection) · `document/DocumentTypeCard`(+Picker) · `payment/PaymentSummaryCard`(+Grid) · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - `TopNav active="home"` → `layout/Header` (variant=guest)
  - `Badge variant="info|neutral"` → `ui/Badge`
  - `Btn variant="primary|secondary" size="xl"` → `ui/Button`
  - `CardFlat` / `Card` → `ui/Card` (variant=flat / default)
  - `EmpathySection` → `ui/EmpathyBubble` 조합(side=left/right)
  - `DocumentTypePicker withPrice` → `document/DocumentTypeCard` 인스턴스 5개 묶음
  - `PaymentCardGrid` → `payment/PaymentSummaryCard` 인스턴스 묶음
- **variant/state:**
  - Button: variant=primary/secondary, size=xl, icon=left/right
  - Badge: variant=info/neutral, icon=sparkle/none
  - Card: variant=flat(STEP 카드·문서 미리보기) / default(AI 어시스턴트 미니카드)
  - EmpathyBubble: side=left/right (좌→우→좌 번갈이)
  - DocumentTypeCard: availability=active×3 / v2-planned×1 / coming-soon×1, withPrice=true
- **Figma 재구성 순서:**
  1. `layout/Header`(guest) 인스턴스 배치
  2. Hero 섹션: 텍스트 + `ui/Badge` + `ui/Button`×2 + `ui/Card`(미리보기·미니카드) 인스턴스
  3. `EmpathySection`(EmpathyBubble 인스턴스들 + CTA Button)
  4. 활용방법: `ui/Card`(flat) ×3 인스턴스
  5. 지원문서: `DocumentTypeCard` ×5
  6. 요금제: `PaymentSummaryCard` 인스턴스
  7. `LegalNoticeBox` → `SiteFooter`
- **주의사항:**
  - Hero 우측 "내용증명 미리보기"는 **장식용 카드**다. `document/DocumentPreview` 컴포넌트가 아니라 `ui/Card`(flat) + 텍스트 오버라이드로 표현(코드도 CardFlat을 직접 씀).
  - STEP 배지("STEP 1")는 `ui/Badge`가 아닌 인라인 pill 스타일이지만, Figma에서는 `ui/Badge`(variant=info) 인스턴스로 통일 권장.
  - 무료 혜택 3칩(체크+텍스트)은 작은 인라인 요소 — 새 컴포넌트 만들지 말고 아이콘+텍스트 레이어로.

---

## 대시보드 (DashboardScreen / 로그인 후 홈)
- **코드 파일:** [dashboard_screen.js](static/js/dashboard_screen.js)
- **화면 목적:** 로그인 사용자의 홈. 홈 마케팅 일부 + "나의 진행 현황"(진행 중 사건 카드) 노출. (`/` 접근 시 로그인 상태면 이 화면)
- **주요 섹션:**
  1. Hero (홈과 동일 구조, 카피만 다름)
  2. EmpathySection
  3. 지원 문서 (`DocumentTypePicker` + "전체 보기" subtle 버튼)
  4. **나의 진행 현황** (`CaseProgressCard` ×N — MOCK_CASES)
  5. LegalNotice + SiteFooter
- **사용해야 할 Figma 컴포넌트:** `layout/Header`(authed) · ` ` · `ui/Button` · `ui/Card` · `ui/EmpathyBubble` · `document/DocumentTypeCard` · **`dashboard/CaseProgressCard`** (내부 `dashboard/MiniSteps` 포함) · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - `TopNav active="home"` → `layout/Header` (variant=**authed**: "안녕하세요 OOO님"+로그아웃+크레딧 칩)
  - `CaseProgressCard doc={...}` → `dashboard/CaseProgressCard` (status·step props)
  - 내부 `MiniSteps step` → `dashboard/MiniSteps` (1~4)
  - "전체 보기" `btn btn-subtle btn-sm` → `ui/Button` (variant=ghost/subtle, size=sm)
- **variant/state:**
  - Header: variant=authed
  - CaseProgressCard: status=작성중/초안생성됨/수정중/저장완료/발송완료/분석중, step=1~4
  - MiniSteps: step 단계 todo/current/done
  - DocumentTypeCard: 홈과 동일
- **Figma 재구성 순서:**
  1. `layout/Header`(authed) — 홈과 다른 variant이므로 별도 인스턴스
  2. Hero·EmpathySection·지원문서 = 홈 인스턴스 재사용(텍스트만 오버라이드)
  3. **`CaseProgressCard`** Main Component를 먼저 등록(MiniSteps를 nested instance로) → 사건 2건을 인스턴스로 배치(status=발송완료/분석중)
  4. LegalNoticeBox → SiteFooter
- **주의사항:**
  - `CaseProgressCard`·`MiniSteps`·`YesNoToggle`은 ComponentsPlan.md 기준 **이미 별도 파일로 분리 완료**(`dashboard/CaseProgressCard.js`, `ui/YesNoToggle.js`). 반드시 컴포넌트로 등록할 것.
  - `YesNoToggle`은 CLAUDE.md에 "대시보드 진행 문의"용으로 정의되어 있으나 **현재 dashboard_screen.js에는 렌더되지 않음**(컴포넌트만 존재). Figma에는 `ui/YesNoToggle` Main Component만 라이브러리에 등록하고, 이 화면 프레임에는 배치하지 않는다(현재 구현 충실).
  - Hero/EmpathySection은 홈과 **거의 동일** — 별도로 그리지 말고 홈 인스턴스를 복제해 텍스트만 교체.

---

## 문서 생성 (CreateScreen / 3단계)
- **코드 파일:** [create_screen.js](static/js/create_screen.js)
- **화면 목적:** 문서 생성 워크플로 (STEP1 정보입력 → STEP2 초안 미리보기 → STEP3 대화형 수정·저장). 한 화면에서 `step` 상태로 전환.
- **주요 섹션:** (Figma에서는 **3개의 하위 프레임**으로 분리 권장)
  - 공통 상단: breadcrumb + 제목 + `StepIndicator`(clickable)
  - **STEP1 (StepInput):** ① 문서종류 `DocTypePicker` / ② 발신인 ③ 수신인 폼 / ④ 사건표시(brief·appeal만) / 시간순 사건경위(TimelineRow) / 증거 업로드 `EvidenceUploader` / 반박문이면 `OpponentDocAnalysis` / ⑤사건경위 ⑥요구사항 textarea / 하단 임시저장·초안생성 버튼
  - **STEP2 (StepPreview):** 좌측 초안 본문(pre) + 하단 네비 버튼(이전/다시생성/.docx/다음) · 우측 읽기전용 `EvidenceUploader`(mode=preview). 생성 중에는 스피너+스켈레톤, 에러 시 `Alert`
  - **STEP3 (StepEdit):** 좌측 문서 본문 + 하단 버튼 · 우측 증거 패널 + AI 어시스턴트 채팅(chat-panel) + 위험문장검사 결과(`RiskResultChatMsg`)
- **사용해야 할 Figma 컴포넌트:** `layout/Header` · `document/StepIndicator` · `document/FormSection`(+TimelineRowEditor) · `document/DocumentTypeCard`(Picker) · `document/EvidenceUploader` · `document/OpponentDocAnalysis` · `document/DocumentPreview` · `ui/Button` · `ui/TextInput` · `ui/Textarea` · `ui/Alert` · `ui/DocChip` · `ui/Badge` · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - `ClickableSteps` → `StepIndicator` (steps=3, size=md, clickable=true)
  - `DocTypePicker` → `document/DocumentTypeCard`
  - 폼 입력 `.input` / `.textarea` → `ui/TextInput` / `ui/Textarea` (현재 화면은 raw `<input className="input">`을 직접 씀 → Figma에서는 반드시 `ui/TextInput` 인스턴스로 대체)
  - 시간순 사건경위 행 → `document/FormSection` 내 `TimelineRowEditor`
  - `EvidenceUploader` → `document/EvidenceUploader` (mode=input / preview)
  - `OpponentDocAnalysis` → `document/OpponentDocAnalysis` (반박문 전용, 내부에 OpponentClaimItem·RebuttalSuggestionTextarea)
  - 위험문장검사 버튼/결과 → `ui/Button`(위험 스타일) + `RiskWarningBox` 패턴(코드상 `RiskResultChatMsg` 인라인)
  - 미리보기/수정 본문 + 액션 → `document/DocumentPreview` (mode=preview/edit)
- **variant/state:**
  - StepIndicator: current=1/2/3, 스텝별 todo/current/done, clickable
  - DocumentPreview: mode=preview/edit/readonly, status=loading/generated/edited/empty/error
  - EvidenceUploader: state=empty/uploading/done/error, mode=input/preview, readonly
  - OpponentDocAnalysis: state=idle/file-ready/analyzing/done
  - Button: primary/secondary/subtle/outline, size=sm/md/lg
  - Alert: type=error/info
  - DocChip: active(STEP3 헤더)
- **Figma 재구성 순서:**
  1. 공통 상단(Header + breadcrumb + `StepIndicator`)을 3프레임 공유 요소로
  2. **STEP1**: `FormSection` 단위로 폼 조립 → 각 입력은 `TextInput`/`Textarea` 인스턴스, 종류선택은 `DocumentTypeCard`, 증거는 `EvidenceUploader`(state=empty/done), 반박문 분기는 `OpponentDocAnalysis`
  3. **STEP2**: `DocumentPreview`(mode=preview)를 좌측, `EvidenceUploader`(mode=preview/readonly)를 우측. loading·error 상태 인스턴스 별도
  4. **STEP3**: `DocumentPreview`(mode=edit) 좌측 + 채팅 패널 우측. 위험문장검사 결과 인스턴스(`RiskWarningBox` severity=warning) 포함
  5. 각 프레임 하단 LegalNoticeBox → SiteFooter
- **주의사항:**
  - ⚠️ **현재 STEP1 폼은 코드에서 공통 Input 컴포넌트가 아니라 raw `<input className="input">`/`<textarea className="textarea">`를 직접 사용** 중이다. 그러나 CLAUDE.md §2·§5 규칙상 Figma에서는 **반드시 `ui/TextInput`·`ui/Textarea` 인스턴스로 등록**해야 한다(새 인풋 도형 금지).
  - `OpponentClaimItem`·`RebuttalSuggestionTextarea`는 `OpponentDocAnalysis` 내부 구성요소다. **"분석하기" 실행 후에만 노출**(CLAUDE.md FR-19) → Figma에서 state=idle / done 두 인스턴스로 표현.
  - 위험문장검사 결과(`RiskResultChatMsg`)는 코드상 별도 컴포넌트 파일이 아닌 인라인 함수다. Figma에서는 CLAUDE.md의 `RiskWarningBox`(severity=warning, item={원문,사유,수정제안}) 컴포넌트로 등록.
  - 결제 플로우(`openPaymentFlow`)는 이 화면에서 트리거되지만 UI는 `ui/Modal`(type=payment) 오버레이다 — 화면 프레임이 아닌 Overlays에 둔다.
  - AI 어시스턴트 채팅 패널(chat-panel/chat-bubble)은 현재 전용 공통 컴포넌트가 없음 → Figma에서 `document/ChatPanel`로 신규 등록할지 여부는 **임의 결정 금지**, 별도 합의 필요(우선 인스턴스 없이 frame+text로 두되 컴포넌트화는 보류).

---

## 마이페이지 — 나의 문서 (MyDocsScreen)
- **코드 파일:** [mydocs_screen.js](static/js/mydocs_screen.js)
- **화면 목적:** 사용자가 생성한 문서 목록 관리(보기/이어서 수정/백업).
- **주요 섹션:**
  1. 페이지 헤더(breadcrumb + 제목 + "전체 백업"/"새 문서 만들기" 버튼)
  2. 서브탭 `SubTabBar`(active=mydocs)
  3. 통계 카드 4개(card-flat)
  4. 검색·필터 툴바 `SearchFilterBar` + 문서 테이블(종류 `DocChip`·상태 `Badge`·액션 버튼)
  5. LegalNotice + SiteFooter
- **사용해야 할 Figma 컴포넌트:** `layout/Header`(authed) · `layout/SubTabBar` · `ui/Card`(flat) · `ui/SearchFilterBar` · `ui/DocChip` · `ui/Badge` · `ui/Button` · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - `SubTabBar active="mydocs" count` → `layout/SubTabBar`
  - 통계 카드 `card-flat` → `ui/Card`(variant=flat) + 텍스트
  - `SearchFilterBar placeholder` → `ui/SearchFilterBar`
  - `DocChip type icon size="sm"` → `ui/DocChip`
  - `Badge variant={status.variant}` → `ui/Badge`
  - 액션 `btn btn-subtle btn-sm` / `icon-btn` → `ui/Button`(ghost/subtle, sm) / `ui/Button`(variant=icon)
- **variant/state:**
  - SubTabBar: active=mydocs
  - DocChip: size=sm, type=내용증명/준비서면/상대방 반박문
  - Badge: variant=neutral(작성중)/info(초안생성됨)/warning(수정중)/success(저장완료)/danger(삭제됨)
  - Button: variant=primary/secondary/ghost/icon, size=md/sm
- **Figma 재구성 순서:**
  1. Header(authed) → 페이지 헤더(Button ×2)
  2. `SubTabBar`(active=mydocs)
  3. 통계 `Card`(flat) ×4
  4. `SearchFilterBar` + 테이블(행마다 `DocChip` + `Badge` + 액션 `Button`)
  5. LegalNoticeBox → SiteFooter
- **주의사항:**
  - 테이블 자체는 공통 컴포넌트가 아니다(`<table className="table">`). Figma에서 행을 **Auto Layout Frame**으로 만들되, 행 안의 종류/상태/액션은 반드시 `DocChip`·`Badge`·`Button` 인스턴스 사용.
  - 통계 카드 숫자(32px) 색상은 토큰(brand-rest, success-fg, warning-fg, accent-magenta) — 임의 색 금지.
  - 상태값 deleted("삭제됨")는 목록에서 필터링됨(`status !== "deleted"`) → 기본 테이블에는 안 보임. Badge variant=danger 인스턴스는 라이브러리에만 등록.

---

## 마이페이지 — 결제 내역 (SubscriptionScreen)
- **코드 파일:** [subscription_screen.js](static/js/subscription_screen.js)
- **화면 목적:** 건별 결제 내역 + 요금 안내 + 결제 수단 관리. (월구독 → 건별 결제 전환)
- **주요 섹션:**
  1. 페이지 헤더(breadcrumb + "결제 내역")
  2. 서브탭 `SubTabBar`(active=subscription)
  3. 무료 체험 배너(FreeTrialBanner 패턴)
  4. 문서 종류별 요금 `PaymentCardGrid`
  5. 2컬럼: 구매 내역 테이블(`PurchaseTable`) / 결제 수단 카드(VISA + 추가 버튼 + 영수증 안내)
  6. LegalNotice + SiteFooter
- **사용해야 할 Figma 컴포넌트:** `layout/Header`(authed) · `layout/SubTabBar` · `payment/PaymentSummaryCard`(+Grid) · `ui/Card`(flat) · `ui/DocChip` · `ui/Badge` · `ui/Button` · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - `SubTabBar active="subscription"` → `layout/SubTabBar`
  - `PaymentCardGrid` → `payment/PaymentSummaryCard`
  - 구매 내역 행: `DocChip type size="sm"` + `Badge variant=info|success` + `Btn("영수증")`
  - 결제 수단 카드 → `ui/Card`(flat) + VISA 칩
- **variant/state:**
  - SubTabBar: active=subscription
  - Badge: variant=info(무료) / success(완료)
  - DocChip: size=sm
  - PaymentSummaryCard: 문서 4종(내용증명/준비서면/반박문/항소이유서)
- **Figma 재구성 순서:**
  1. Header(authed) → 페이지 헤더
  2. `SubTabBar`(active=subscription)
  3. 무료체험 배너(→ CLAUDE.md `FreeTrialBanner` 컴포넌트로 등록 권장)
  4. `PaymentSummaryCard` Grid
  5. 2컬럼: 구매내역 `Card`(flat)+테이블 / 결제수단 `Card`(flat)
  6. LegalNoticeBox → SiteFooter
- **주의사항:**
  - 무료 체험 배너는 코드상 인라인 div다. CLAUDE.md에 `FreeTrialBanner` 컴포넌트가 정의되어 있으므로 **Figma에서는 `feedback/FreeTrialBanner`로 등록**(마이페이지·결제 공통 재사용).
  - VISA 결제수단 카드는 subscription 단독 사용(ComponentsPlan §4 "낮음 우선순위 PaymentMethodCard"). 지금은 단독 인스턴스로 두되, 카드 외형은 `ui/Card`(flat) 인스턴스 기반.
  - `SubTabBar`는 **mydocs와 동일 컴포넌트** — 두 화면에서 같은 Main Component의 active property만 바꿔 쓴다(중복 생성 금지).

---

## 법률 문서 도움말 (HelpScreen)
- **코드 파일:** [help_screen.js](static/js/help_screen.js)
- **화면 목적:** 내용증명 안내 + 인터넷 우체국 발송 5단계 가이드(아코디언 패널 + 참고 이미지).
- **주요 섹션:**
  1. 좌측 사이드바(검색 input + 문서종류 nav `DOC_TYPES` + 발송단계 nav)
  2. 본문: breadcrumb + 제목 + 설명 + "이 문서 만들기" 버튼
  3. 활용상황/주의사항 2컬럼 카드
  4. 발송 단계 헤더(모두 열기/닫기 버튼)
  5. Closable Panel ×5(`AccordionItem` 패턴, 번호+아이콘+제목+이미지+불릿)
  6. 하단 `Alert`(info)
  7. LegalNotice + SiteFooter
- **사용해야 할 Figma 컴포넌트:** `layout/Header` · `ui/TextInput`(검색) · `ui/Button` · `ui/Card`(flat) · `ui/Accordion`(AccordionItem) · `ui/Alert` · `ui/Badge`("예정") · `feedback/LegalNoticeBox` · `layout/SiteFooter`
- **코드 컴포넌트 매핑:**
  - 사이드바 검색 `.input` → `ui/TextInput`(leadingIcon=search)
  - 문서종류 nav `gnb-link` → 사이드 nav 아이템(현재 raw 버튼) — Figma에서 `ui/Button`(variant=ghost) 또는 nav-item 인스턴스
  - "예정" 라벨 → `ui/Badge`(variant=v2/warning)
  - 발송단계 패널 → `ui/Accordion`(AccordionItem: q/a/defaultOpen)
  - 활용상황/주의 카드 → `ui/Card`(flat)
  - 하단 `Alert type="info"` → `ui/Alert`
- **variant/state:**
  - Accordion: open/closed (defaultOpen=1번만 true)
  - Badge: variant=v2/warning("예정")
  - Card: flat
  - Alert: type=info
  - Button: primary("이 문서 만들기"), secondary(모두 열기/닫기), ghost(nav)
- **Figma 재구성 순서:**
  1. Header → 2컬럼 레이아웃 프레임(사이드바 260px / 본문)
  2. 사이드바: `TextInput`(검색) + 문서종류 nav(DOC_TYPES, 비활성+"예정" 배지) + 발송단계 nav
  3. 본문: breadcrumb + 제목 + `Button` + `Card`(flat)×2
  4. `Accordion` ×5 (1번 open, 나머지 closed). 패널 내부 참고이미지는 placeholder 프레임
  5. `Alert`(info) → LegalNoticeBox → SiteFooter
- **주의사항:**
  - 발송단계 패널은 코드상 인라인 토글 div지만, ComponentsPlan.md 기준 `ui/Accordion.js`로 **이미 분리 완료**. FAQ와 공용이므로 반드시 `ui/Accordion` 인스턴스로 등록.
  - 참고 이미지(`/static/images/help_step1~5.png`)는 **실제 캡처 이미지**다. §1-4 규칙대로 이미지는 콘텐츠 슬롯(이미지 fill)일 뿐 트레이싱 대상 아님.
  - 문서종류 nav의 "예정"/비활성은 `comingSoon`/availability 데이터 기반 → 새 스타일 만들지 말고 Badge + disabled 상태로.

---

## 로그인 (LoginScreen)
- **코드 파일:** [login_screen.js](static/js/login_screen.js)
- **화면 목적:** 이메일/소셜 로그인. 좌 브랜드 패널 + 우 카드(AuthSplitLayout).
- **주요 섹션:**
  1. 좌측 브랜드 패널(headline + subtext + "마지막으로 보던 문서" 미리보기 카드)
  2. 우측 `AuthCard`(narrow): 헤더 + `SocialLoginRow` + `AuthDivider` + 에러 `Alert` + 이메일/비번 폼 + 비번찾기 링크 + 로그인 버튼
- **사용해야 할 Figma 컴포넌트:** `layout/AuthSplitLayout` · `ui/AuthCard` · `ui/AuthCardHeader` · `ui/SocialLoginRow` · `ui/AuthDivider` · `ui/TextInput` · `ui/Button` · `ui/Alert` · `ui/Card`(flat, 미리보기)
- **코드 컴포넌트 매핑:**
  - `AuthSplitLayout activeTab="login"` → `layout/AuthSplitLayout`
  - `AuthCard size="narrow"` → `ui/AuthCard`
  - `AuthCardHeader title subtitle` → `ui/AuthCardHeader`
  - `SocialLoginRow disabledProviders={["naver"]}` → `ui/SocialLoginRow`
  - `AuthDivider` → `ui/AuthDivider`
  - `TextInput type="email|password" showToggle leadingIcon` → `ui/TextInput`
  - `Btn variant="primary" size="lg" width="fill"` → `ui/Button`
  - `Alert type="error" closable` → `ui/Alert`
- **variant/state:**
  - AuthSplitLayout: activeTab=login
  - AuthCard: size=narrow
  - TextInput: type=email(leadingIcon=mail)/password(showToggle, leadingIcon=lock), state=default/error
  - SocialLoginRow: providers=google/kakao(active)/naver(disabled)
  - Button: variant=primary, size=lg, width=fill, loading
  - Alert: type=error
- **Figma 재구성 순서:**
  1. `AuthSplitLayout`(activeTab=login) 인스턴스 — 좌 패널은 컴포넌트 슬롯
  2. 좌 패널: headline/subtext 텍스트 + `ui/Card`(flat, 반투명) 미리보기
  3. 우 `AuthCard`(narrow): `AuthCardHeader` → `SocialLoginRow` → `AuthDivider` → `Alert`(error, 옵션) → `TextInput`×2 → 비번찾기 링크 → `Button`(primary/lg/fill)
- **주의사항:**
  - `LegalNotice compact`는 코드에서 **주석 처리**되어 화면에 안 나옴 → Figma 로그인 프레임에 배치하지 말 것.
  - SiteFooter도 Auth 화면에는 없음(AuthSplitLayout이 풀스크린). 전역 규칙 §1-1의 "모든 화면 Footer"는 **Auth 3종(login/signup/reset)에는 예외**.
  - Naver 버튼은 disabled 상태로 등록(준비 중).

---

## 회원가입 (AuthScreen)
- **코드 파일:** [auth_screen.js](static/js/auth_screen.js)
- **화면 목적:** 이메일/소셜 회원가입. 좌 브랜드 패널 + 우 카드(wide).
- **주요 섹션:**
  1. 좌측 브랜드 패널(headline + subtext + 가입 혜택 features 4개)
  2. 우측 `AuthCard`(wide): 헤더 + 무료체험 배지 2개 + `SocialLoginRow` + `AuthDivider` + 에러 + 이메일/이름/비번 폼 + 약관동의 체크박스 + 가입 버튼
- **사용해야 할 Figma 컴포넌트:** `layout/AuthSplitLayout` · `ui/AuthCard` · `ui/AuthCardHeader` · `ui/SocialLoginRow` · `ui/AuthDivider` · `ui/TextInput` · `ui/Badge` · `ui/Button` · `ui/Alert` · (`ui/Checkbox` 패턴)
- **코드 컴포넌트 매핑:**
  - `AuthSplitLayout activeTab="signup" features` → `layout/AuthSplitLayout`
  - `AuthCard size="wide"` → `ui/AuthCard`
  - `Badge variant="success|info" icon="sparkle"` → `ui/Badge`
  - `TextInput type=email/text/password` → `ui/TextInput`(leadingIcon=mail/person/lock, helperText)
  - 약관 체크박스 → CLAUDE.md `ui/Checkbox`(현재 raw `<input type=checkbox>`)
  - `Btn variant="primary" loading` → `ui/Button`
- **variant/state:**
  - AuthSplitLayout: activeTab=signup
  - AuthCard: size=wide
  - Badge: variant=success("내용증명 1건 무료") / info("대화형 수정 3회")
  - TextInput: type=email/text/password, helperText=true(비번)
  - Button: primary/lg/fill, loading
- **Figma 재구성 순서:**
  1. `AuthSplitLayout`(activeTab=signup) — login과 같은 Main Component, property만 변경
  2. 좌 패널: headline/subtext + features 리스트(아이콘+텍스트)
  3. 우 `AuthCard`(wide): Header → Badge×2 → `SocialLoginRow` → `AuthDivider` → `Alert` → `TextInput`×3 → 약관 체크박스 → `Button`
- **주의사항:**
  - 약관 동의 체크박스는 현재 raw input이지만 CLAUDE.md `Checkbox` 컴포넌트로 등록해야 함(새 도형 금지).
  - `AuthSplitLayout`은 login/signup/reset **3화면 공용 Main Component**. size(narrow/wide)와 activeTab만 다르게 — 화면마다 레이아웃 새로 그리지 말 것.
  - Footer/LegalNotice 없음(§1-1 예외).

---

## 비밀번호 찾기 (ResetScreen)
- **코드 파일:** [prototype.js](static/js/prototype.js#L33) (`window.ResetScreen`)
- **화면 목적:** 가입 이메일로 재설정 링크 발송. AuthSplitLayout 재사용.
- **주요 섹션:** 좌 브랜드 패널 + 우 `AuthCard`(narrow): 헤더 + (발송 전)이메일 폼 / (발송 후)성공 `Alert` + `LegalNotice compact`
- **사용해야 할 Figma 컴포넌트:** `layout/AuthSplitLayout` · `ui/AuthCard` · `ui/AuthCardHeader` · `ui/TextInput` · `ui/Button` · `ui/Alert` · `feedback/LegalNoticeBox`(compact)
- **코드 컴포넌트 매핑:**
  - `AuthSplitLayout activeTab={null}` → `layout/AuthSplitLayout`
  - `Alert type="success"` → `ui/Alert`
  - `LegalNotice compact` → `feedback/LegalNoticeBox`(variant=compact)
- **variant/state:**
  - AuthSplitLayout: activeTab=null(탭 비활성)
  - 화면 상태 2개: **발송 전**(TextInput+Button) / **발송 후**(success Alert)
  - LegalNoticeBox: variant=compact
- **Figma 재구성 순서:**
  1. `AuthSplitLayout`(activeTab=null) 인스턴스
  2. `AuthCard`(narrow) + `AuthCardHeader`
  3. 상태별 2개 프레임: ①폼(`TextInput`+`Button`) ②성공(`Alert` success)
  4. `LegalNoticeBox`(compact)
- **주의사항:**
  - 이 화면은 login/signup과 달리 `LegalNotice compact`가 **활성**(주석 아님) — 카드 하단에 포함.
  - activeTab=null이므로 상단 탭 강조 없음.

---

## FAQ (FAQScreen)
- **코드 파일:** [prototype.js](static/js/prototype.js#L4) (`window.FAQScreen`)
- **화면 목적:** 자주 묻는 질문 아코디언 목록.
- **주요 섹션:** Header + 제목/설명 + `AccordionItem` ×5(1번 defaultOpen)
- **사용해야 할 Figma 컴포넌트:** `layout/Header` · `ui/Accordion`(AccordionItem)
- **코드 컴포넌트 매핑:**
  - `AccordionItem q a defaultOpen` → `ui/Accordion`
- **variant/state:**
  - Accordion: open(1번) / closed(2~5)
- **Figma 재구성 순서:**
  1. Header
  2. 제목/설명 텍스트
  3. `Accordion` ×5 (1번 open)
- **주의사항:**
  - FAQ는 `LegalNotice`/`SiteFooter`가 **코드에 없음** → Figma 프레임에도 추가하지 말 것(현재 구현 충실).
  - help_screen 발송단계 패널과 **동일한 `ui/Accordion` 컴포넌트** 공용. 별도 아코디언 만들지 말 것.

---

# 3. 화면 재구성 전체 순서 (권장 작업 흐름)

> Figma 컴포넌트 등록이 깨지지 않으려면 **컴포넌트 → 화면 순서**로 작업한다. 화면을 먼저 그리고 나중에 컴포넌트화하면 인스턴스 연결이 안 된다.

1. **Variables 등록** — §1-2 토큰(Color/Number/Font)을 Figma Variables로 먼저 정의.
2. **기본 UI Main Component** — Button, Badge, Card, TextInput/Textarea/Select, Alert, DocChip, Modal, Toast, Accordion, SearchFilterBar, YesNoToggle.
3. **서비스 컴포넌트** — DocumentTypeCard, StepIndicator, FormSection/TimelineRowEditor, EvidenceUploader, OpponentDocAnalysis(+OpponentClaimItem, RebuttalSuggestionTextarea), DocumentPreview, RiskWarningBox, PaymentSummaryCard, CaseProgressCard(+MiniSteps), FreeTrialBanner.
4. **레이아웃 컴포넌트** — Header(guest/authed), SiteFooter, AuthSplitLayout, AuthCard/AuthCardHeader, SubTabBar, LegalNoticeBox.
5. **화면 조립(쉬운→복잡 순)**: FAQ → Reset → Login → Signup → MyDocs → Subscription → Help → Home → Dashboard → **Create(3단계, 가장 복잡)**.
6. **Code Connect 연결**(ComponentsPlan Phase 4): 각 Figma 컴포넌트를 `static/js/...` 경로의 React 컴포넌트와 1:1 매핑(`data-component` attribute 기준). CLAUDE.md §7 매핑표 준수.

---

# 4. "직접 도형으로 만들면 안 되는 요소" 통합 체크리스트

| 화면에서 보이는 것 | 절대 새로 그리지 말고 → 이 컴포넌트 인스턴스 | 비고 |
|---|---|---|
| 모든 버튼 | `ui/Button` | variant 5종+ |
| 모든 입력/검색창 | `ui/TextInput`/`Textarea`/`Select`/`SearchFilterBar` | create STEP1의 raw input 포함 |
| 상태/라벨 배지 | `ui/Badge` | 문서상태·"예정"·무료 |
| 카드 외형 | `ui/Card` | flat/default/subtle |
| 문서 종류 칩 | `ui/DocChip` | mydocs·subscription·create |
| 문서 종류 선택 카드 | `document/DocumentTypeCard` | 홈·대시보드·create |
| 알림 박스 | `ui/Alert` | |
| 단계 표시 | `document/StepIndicator` / `dashboard/MiniSteps` | |
| 미리보기/수정 문서 영역 | `document/DocumentPreview` | create STEP2·3 |
| 증거 업로드 | `document/EvidenceUploader` | |
| 상대방 분석 | `document/OpponentDocAnalysis` | 반박문 |
| 요금 카드 | `payment/PaymentSummaryCard` | |
| 사건 진행 카드 | `dashboard/CaseProgressCard` | |
| 아코디언 | `ui/Accordion` | help·FAQ 공용 |
| 서브탭 | `layout/SubTabBar` | mydocs·subscription 공용 |
| 헤더/푸터/고지 | `layout/Header`·`SiteFooter`·`feedback/LegalNoticeBox` | |
| 모달/토스트 | `ui/Modal`·`ui/Toast` | Overlays 페이지 |

---

# 5. 주의: 코드와 CLAUDE.md가 어긋나는 지점 (Figma 작업 전 확인 필요)

작업 중 임의 판단하지 말고 아래는 별도 확인할 것:

1. **create STEP1 폼**: 코드가 raw `<input className="input">`를 직접 사용 → CLAUDE.md 규칙상 `ui/TextInput`으로 등록해야 하나, 현 구현과 마크업이 다름. Figma는 규칙(컴포넌트) 우선.
2. **YesNoToggle**: `ui/YesNoToggle.js`로 분리됐으나 dashboard 화면에 실제 렌더 안 됨. 라이브러리에만 등록, 화면 배치 보류.
3. **AI 어시스턴트 채팅 패널**(create STEP3): 전용 공통 컴포넌트 없음(인라인 chat-panel). 컴포넌트화 여부 미정 — 신규 컴포넌트 임의 생성 금지.
4. **RiskResultChatMsg**: 인라인 함수. CLAUDE.md `RiskWarningBox`로 매핑할지 확정 필요.
5. **무료체험 배너**: subscription에 인라인 div. CLAUDE.md `FreeTrialBanner`로 등록 권장하나 코드 분리 안 됨.
6. **Auth 3종 + FAQ**: Footer/LegalNotice 없음(현 구현). 전역 Footer 규칙의 예외로 처리.
