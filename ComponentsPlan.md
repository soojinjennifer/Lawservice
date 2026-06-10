# 내편문서 — 컴포넌트 시스템 정비 계획 (2026-06-09)

> Figma 컴포넌트 시스템 연결을 위한 현황 분석 및 단계별 작업 계획

---

## 1. 현재 화면 파일 목록

| 파일 | 화면 역할 |
|---|---|
| `home_screen.js` | 비로그인 마케팅 홈 (Hero, EmpathySection, 활용방법, 지원문서, 요금제) |
| `dashboard_screen.js` | 로그인 후 홈 (Hero + EmpathySection + 지원문서 + 나의 진행 현황) |
| `create_screen.js` | 문서 생성 3단계 (정보 입력 → 초안 미리보기 → 수정·저장) |
| `mydocs_screen.js` | 마이페이지 — 나의 문서 목록 |
| `subscription_screen.js` | 마이페이지 — 결제 내역 |
| `help_screen.js` | 법률 문서 도움말 (좌: 문서 목록, 우: 체크리스트 + 작성 가이드) |
| `login_screen.js` | 로그인 화면 |
| `auth_screen.js` | 회원가입 화면 |
| `prototype.js` | SPA 라우터 + FAQScreen + ResetScreen (화면이 직접 포함됨) |

---

## 2. 현재 반복되는 UI 패턴

| 패턴 | 사용 위치 |
|---|---|
| **버튼 (raw CSS)** | `btn btn-primary`, `btn btn-secondary`, `btn btn-subtle btn-sm`, `icon-btn` — 모든 화면에서 직접 className으로 사용 |
| **카드** | `card-flat` className 직접 사용 — mydocs, subscription, help, dashboard, prototype |
| **서브탭** | `gnb-link is-active` className — mydocs, subscription (각 화면마다 동일한 마크업 반복) |
| **문서 칩** | `doc-chip` span — mydocs, subscription, dashboard |
| **검색 입력** | `input` + `icon` 조합 — mydocs, help에서 각각 직접 작성 |
| **테이블** | `table` className — mydocs, subscription에서 각각 직접 작성 |
| **빈 상태 / 로딩** | EmptyState 컴포넌트가 없고 각 화면에서 직접 텍스트로 처리 |
| **사건 카드 (CaseExpandedCard)** | dashboard_screen.js 내부에서만 정의, window 미노출 |
| **MiniSteps** | dashboard_screen.js 내부에서만 정의 |
| **YesNoToggle** | dashboard_screen.js 내부에서만 정의 |
| **FAQItem (아코디언)** | prototype.js 내부에서만 정의 |
| **서브탭 레이아웃** | mydocs + subscription에서 동일 구조를 중복 작성 |

---

## 3. 공통 컴포넌트 분리 현황

### ✅ 이미 분리된 것 (`window.XXX` export됨)

| 컴포넌트 | 파일 |
|---|---|
| `Btn` | `ui/Button.js` |
| `Card`, `CardFlat` | `ui/Card.js` |
| `TextInput`, `Textarea`, `Select` | `ui/Input.js` |
| `Badge`, `DocStatusBadge` | `ui/Badge.js` |
| `Alert` | `ui/Alert.js` |
| `Modal`, `openPaymentFlow`, `openPurchaseConfirm` | `ui/Modal.js` |
| `ToastContainer`, `ToastManager` | `ui/Toast.js` |
| `EmpathyBubble`, `EmpathySection` | `ui/EmpathyBubble.js` |
| `StepIndicator` | `document/StepIndicator.js` |
| `FormSection`, `TimelineRowEditor` | `document/FormSection.js` |
| `DocumentTypeCard`, `DocumentTypePicker` | `document/DocumentTypeCard.js` |
| `DocumentPreview` | `document/DocumentPreview.js` |
| `EvidenceUploader` | `document/EvidenceUploader.js` |
| `OpponentDocAnalysis` | `document/OpponentDocAnalysis.js` |
| `PaymentSummaryCard`, `PaymentCardGrid` | `payment/PaymentSummaryCard.js` |
| `TopNav`, `ServiceMark`, `LegalNotice`, `Steps` | `components.js` |
| `SiteFooter` | `layout/SiteFooter.js` |
| `AuthSplitLayout`, `AuthCard`, `AuthCardHeader` | `layout/AuthSplitLayout.js` / `ui/AuthWidgets.js` |

### ❌ 아직 화면 안에 직접 작성된 것

| 패턴 | 위치 | 영향 범위 |
|---|---|---|
| `YesNoToggle` | `dashboard_screen.js` 내부 함수 | dashboard만 |
| `MiniSteps` | `dashboard_screen.js` 내부 함수 | dashboard만 |
| `CaseExpandedCard` | `dashboard_screen.js` 내부 함수 | dashboard만 |
| `FAQItem` (아코디언) | `prototype.js` 내부 함수 | FAQ만 |
| 서브탭 (`gnb-link`) | `mydocs_screen.js`, `subscription_screen.js` 각각 직접 작성 | 2개 화면 중복 |
| `PurchaseTable` | `subscription_screen.js` 내부 함수 | subscription만 |
| 검색 + 필터 툴바 | `mydocs_screen.js` 직접 작성 | mydocs만 |
| 문서 행 (`doc-chip` + 액션버튼) | `mydocs_screen.js`, `subscription_screen.js` | 2개 화면 중복 |
| VISA 결제 수단 카드 | `subscription_screen.js` 직접 작성 | subscription만 |

---

## 4. Figma 컴포넌트로 등록해야 할 후보

| 우선순위 | 컴포넌트명 | 이유 |
|---|---|---|
| 🔴 높음 | `YesNoToggle` | CLAUDE.md 명시, 재사용 예상 |
| 🔴 높음 | `MiniSteps` | 대시보드 + 향후 카드류 재사용 |
| 🔴 높음 | `CaseProgressCard` (= CaseExpandedCard) | 대시보드 핵심 카드 |
| 🔴 높음 | `SubTabBar` | mydocs + subscription 중복 |
| 🟡 중간 | `FAQItem` / `AccordionItem` | help + FAQ 공용 가능 |
| 🟡 중간 | `DocRow` (문서 목록 행) | mydocs + subscription 중복 |
| 🟡 중간 | `SearchFilterBar` | mydocs + 향후 문서 검색 |
| 🟢 낮음 | `PaymentMethodCard` | subscription 단독 사용 |

---

## 5. 코드 컴포넌트로 정리해야 할 후보

| 목표 파일 위치 | 컴포넌트명 | 현재 위치 |
|---|---|---|
| `ui/YesNoToggle.js` | `YesNoToggle` | `dashboard_screen.js` 내부 |
| `dashboard/CaseProgressCard.js` | `CaseExpandedCard` + `MiniSteps` | `dashboard_screen.js` 내부 |
| `layout/SubTabBar.js` | `SubTabBar` | mydocs + subscription 중복 마크업 |
| `ui/Accordion.js` | `AccordionItem` | `prototype.js` FAQItem + help_screen 중복 패턴 |
| `ui/DocChip.js` | `DocChip` | 여러 화면에서 `doc-chip` span 직접 사용 |
| `ui/SearchFilterBar.js` | `SearchFilterBar` | `mydocs_screen.js` 직접 작성 |

---

## 6. 각 컴포넌트 예상 Props

```
YesNoToggle
  value    : "예" | "아니오" | null
  onChange : (v: string) => void

MiniSteps
  step : 1 | 2 | 3 | 4   // 완료 단계 자동 계산

CaseExpandedCard (CaseProgressCard)
  doc : { id, title, docType, icon, status, step, updatedAt }

SubTabBar
  tabs : [{ label, path?, active }]

AccordionItem
  q           : string
  a           : string | ReactNode
  defaultOpen : boolean (기본 false)

DocChip
  type  : "내용증명" | "준비서면" | "상대방 반박문" | ...
  size  : "sm" | "md" (기본 "md")
```

---

## 7. 단계별 컴포넌트화 계획

### Phase 1 — 화면 내부 함수 분리 (영향 범위 최소)
1. `dashboard_screen.js` 내 `YesNoToggle` → `ui/YesNoToggle.js` 신규 파일, `window.YesNoToggle` export
2. `dashboard_screen.js` 내 `MiniSteps` + `CaseExpandedCard` → `dashboard/CaseProgressCard.js` 신규 파일

### Phase 2 — 화면 간 중복 통합
3. `mydocs_screen.js` + `subscription_screen.js` 서브탭 마크업 → `layout/SubTabBar.js`
4. `prototype.js` `FAQItem` + `help_screen.js` 아코디언 패턴 → `ui/Accordion.js`

### Phase 3 — 미세 요소 정리
5. `doc-chip` span → `ui/DocChip.js` (CLAUDE.md DocChip 스펙 반영)
6. `mydocs_screen.js` 검색·필터 툴바 → `ui/SearchFilterBar.js`

### Phase 4 — Figma Code Connect 연결
7. 각 컴포넌트에 `data-component` attribute 추가
8. CLAUDE.md Figma Component Mapping Table 기준 1:1 대응 문서화
9. Figma MCP를 통해 컴포넌트 속성 동기화

---

## 진행 상태

| Phase | 항목 | 상태 |
|---|---|---|
| Phase 1 | YesNoToggle 분리 | ✅ 완료 |
| Phase 1 | CaseProgressCard 분리 | ✅ 완료 |
| Phase 2 | SubTabBar 통합 | ✅ 완료 |
| Phase 2 | Accordion 통합 | ✅ 완료 |
| Phase 3 | DocChip 분리 | ✅ 완료 |
| Phase 3 | SearchFilterBar 분리 | ✅ 완료 |
| Phase 4 | Figma Code Connect 연결 | ⬜ 대기 |
