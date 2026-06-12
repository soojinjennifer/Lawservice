# PROJECT_STATUS.md

## 프로젝트 상황

이 프로젝트는 Claude Design과 Claude Code를 활용해 만든 MVP 서비스입니다.

현재 상태:

* 1차 PRD 기반 1차 MVP 구현 완료
* 기획 변경으로 2차 PRD 작성
* Claude Design에서 2차 PRD 기준 디자인 수정 완료
* 이후 Claude Code로 기능 구현과 컴포넌트 기반 정리 진행 중

작업 원칙:

* 한 번에 전체 구현하지 않는다.
* Claude Code에게 먼저 분석과 변경 파일 목록을 요청한다.
* 내가 승인한 뒤에만 코드 수정한다.
* 기존 MVP 기능을 함부로 삭제하지 않는다.
* 화면 디자인은 최대한 유지한다.
* 반복 UI는 공통 컴포넌트로 정리한다.
* 로그인/회원가입/인증 관련 작업은 단계별로 나누어 진행한다.

---

## Claude Code 작업 규칙

Claude Code에게 항상 지시할 기본 규칙:

1. 먼저 현재 코드 구조를 분석한다.
2. 수정할 파일 목록을 먼저 보여준다.
3. 각 파일에서 무엇을 수정할지 짧게 설명한다.
4. 내가 승인하기 전에는 코드를 수정하지 않는다.
5. 한 번에 많은 파일을 수정하지 않는다.
6. 로그인/회원가입/OAuth/라우트가드/TopNav는 각각 단계별로 작업한다.
7. 기존 UI 디자인을 바꾸지 않는다.
8. 새 컴포넌트를 만들기 전에 기존 컴포넌트를 재사용할 수 있는지 확인한다.
9. 작업 후 변경 파일, 테스트 방법, 다음 단계를 요약한다.

---

## Supabase Auth 진행 상태

Supabase Auth 연결 상태:

* Supabase 프로젝트 생성 완료
* `.env`에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정 완료
* 브라우저 콘솔에서 `hasClient: true` 확인 완료
* Supabase client 초기화 완료
* `AuthStore` 구조 생성 완료
* 이메일/비밀번호 회원가입 연결 완료
* Google/Kakao 가입/로그인 진입 연결 완료
* Naver는 아직 구현하지 않기로 함
* 이메일 회원가입 성공 후 “회원가입이 완료되었습니다. 로그인해주세요.” 메시지 표시
* 이메일 회원가입 성공 후 `signOut()`으로 세션 정리 후 로그인 화면 이동
* 로그인 기능 구현 완료
* 로그인 세션 유지 확인 완료
* TopNav 로그인 상태 표시 연결 완료

  * 비로그인: 로그인/회원가입 버튼
  * 로그인: “안녕하세요, {사용자명}님” + 로그아웃 버튼

---

## 사용자 이름 표시 규칙

사용자 이름은 아래 우선순위로 표시한다.

1. `user.user_metadata.name`
2. `user.user_metadata.full_name`
3. `user.user_metadata.nickname`
4. 이메일이 있으면 이메일 앞부분
5. 모두 없으면 “사용자”

예:

* `안녕하세요, 안수진님`
* `안녕하세요, ahnleesa님`
* `안녕하세요, 사용자님`

---

## OAuth / 라우트가드 상태

진행 또는 다음 단계 후보:

* Google/Kakao OAuth 후 기본적으로 dashboard 안착 처리
* 라우트 가드 적용 또는 적용 검토
* 보호 페이지:

  * `#/dashboard`
  * `#/mydocs`
  * `#/subscription`
  * `#/create`
* 공개 페이지:

  * `#/`
  * `#/home`
  * `#/login`
  * `#/signup`
  * `#/reset`
  * `#/faq`
  * `#/help`

다음 개선 후보:

* OAuth 안착 시 returnTo 반영

  * 현재 소셜 로그인은 항상 `#/dashboard`로 이동
  * 보호 페이지에서 로그인 진입한 경우 원래 경로로 복귀하도록 개선
* 화면 하드코딩 user prop 제거
* “로그인 상태 유지” 체크박스 실제 필요성 분석
* 무료체험 크레딧 연동 구조 설계
* Naver 구현은 제외

---

## 다음 단계 추천

다음 작업은 Naver를 제외하고 아래 범위로 진행한다.

1. OAuth returnTo 반영
2. 화면 하드코딩 user prop 제거
3. “로그인 상태 유지” 체크박스는 구현 여부 분석만
4. 무료체험 크레딧은 실제 구현하지 말고 설계만

주의:

* Naver 구현 금지
* 무료체험 크레딧 실제 지급 로직 구현 금지
* DB 테이블 생성 금지
* 로그인/회원가입 기본 기능 수정 금지
* 기존 Google/Kakao Provider 설정 코드 수정 금지
* 화면 디자인 변경 금지
* 새 UI 컴포넌트 생성 금지

---

## 컴포넌트 정리 작업 (Phase 1~3) 완료 — 2026-06-12

### 배경

Figma 컴포넌트 시스템 연결을 위해 화면 안에 직접 작성된 반복 UI를
공통 컴포넌트 파일로 분리하는 작업을 진행했다.
분석 결과와 단계별 계획은 `ComponentsPlan.md`에 정리되어 있다.

### 완료된 작업

| Phase | 컴포넌트 | 파일 | 내용 |
|---|---|---|---|
| Phase 1 | `YesNoToggle` | `ui/YesNoToggle.js` | `dashboard_screen.js` 내부 함수 분리 |
| Phase 1 | `CaseProgressCard` + `MiniSteps` | `dashboard/CaseProgressCard.js` | `dashboard_screen.js` 내부 함수 분리 |
| Phase 2-A | `SubTabBar` | `layout/SubTabBar.js` | `mydocs_screen.js` + `subscription_screen.js` 중복 탭 마크업 통합 |
| Phase 2-B | `AccordionItem` | `ui/Accordion.js` | `prototype.js` 내부 `FAQItem` 분리 |
| Phase 3-A | `DocChip` | `ui/DocChip.js` | `doc-chip` span 분리, `size="md/sm/ssm"` 지원 |
| Phase 3-B | `SearchFilterBar` | `ui/SearchFilterBar.js` | `mydocs_screen.js` 검색·필터 툴바 분리 |

### DocChip 사이즈 규격

| size | height | fontSize | 사용처 |
|---|---|---|---|
| `md` | 28px (CSS 기본) | 12px | create_screen active 칩 |
| `sm` | 24px | 11px | mydocs, subscription 목록 행 |
| `ssm` | 20px | 11px | 카드 헤더 초소형 (CaseProgressCard용으로 예약) |

### help_screen.js POST_STEPS 패널

help_screen.js의 발송 단계 토글 패널은 외부 state + 4컬럼 그리드 구조로
AccordionItem과 통합 불가 판단 → 기존 인라인 코드 유지.

### Git 저장소 현황

- `git init` 후 GitHub 저장소 연결: `https://github.com/soojinjennifer/Lawservice.git`
- 총 6개 커밋 `main` 브랜치에 푸시 완료

| 커밋 | 메시지 |
|---|---|
| `885e1f0` | chore: initial project setup |
| `a548717` | refactor: extract dashboard components |
| `04ffa87` | refactor: extract sub tab bar component |
| `fef44ef` | refactor: extract accordion component |
| `19a8164` | refactor: extract doc chip component |
| `68ae426` | refactor: extract search filter bar component |

### 다음 단계 (Phase 4)

- Figma Code Connect 연결 (`data-component` attribute 추가, 컴포넌트 1:1 대응 문서화)
- 현재 `ComponentsPlan.md`에 Phase 4 항목이 `⬜ 대기` 상태로 남아 있음

---

## 다음 Claude Code 프롬프트

OAuth dashboard 안착, 라우트 가드, TopNav 로그인 상태 표시까지 완료되었습니다.

이제 다음 단계 작업을 진행하려고 합니다.

단, Naver 구현은 이번 단계에 포함하지 않습니다.
Naver 관련 코드는 절대 추가하거나 수정하지 마세요.

이번 단계에서는 아래 작업을 포함하되, 먼저 분석과 계획만 보여주세요.
내가 승인하기 전에는 코드를 수정하지 마세요.

## 이번 단계에 포함할 작업

### 1. OAuth 안착 시 returnTo 반영

현재 Google/Kakao 소셜 로그인은 항상 `#/dashboard`로 안착합니다.

이제 비로그인 사용자가 보호 페이지에 접근했다가 로그인 화면으로 이동한 경우,
소셜 로그인 후에도 원래 가려던 경로로 복귀하도록 개선해주세요.

예:

* 비로그인 상태에서 `#/create` 접근
* `#/login?returnTo=%23/create`로 이동
* Google/Kakao 로그인
* OAuth 완료 후 `#/create`로 복귀

요구사항:

1. Google/Kakao OAuth 로그인 시작 시 returnTo 값을 보존해주세요.
2. OAuth 콜백 후 세션이 생성되면 returnTo가 있으면 해당 경로로 이동해주세요.
3. returnTo가 없으면 기존처럼 `#/dashboard`로 이동해주세요.
4. returnTo 값은 안전하게 처리하고, 외부 URL로 이동하지 않도록 해주세요.
5. 기존 이메일/비밀번호 로그인 returnTo 동작은 유지해주세요.
6. 기존 Google/Kakao 버튼 UI는 수정하지 마세요.

### 2. 화면 하드코딩 user prop 제거

아래 화면들에 하드코딩된 사용자 정보가 있다면 제거하고,
실제 로그인 세션의 사용자 정보를 사용하도록 변경해주세요.

확인 대상:

* `dashboard_screen.js`
* `mydocs_screen.js`
* `subscription_screen.js`
* `create_screen.js`
* `help_screen.js`

제거 대상 예시:

* `{ name: "김미수" }`
* `user={{ name: "김미수" }}`
* 임시 사용자명
* 임시 이메일
* 가짜 프로필 정보

사용자 이름 표시 우선순위:

1. `user.user_metadata.name`
2. `user.user_metadata.full_name`
3. `user.user_metadata.nickname`
4. 이메일이 있으면 이메일 앞부분
5. 모두 없으면 “사용자”

### 3. “로그인 상태 유지” 체크박스 분석

현재 로그인 화면에 “로그인 상태 유지” 체크박스가 있다면 실제 동작과 연결할 수 있는지 확인해주세요.

단, Supabase Auth는 기본적으로 localStorage 기반 세션 유지와 토큰 갱신을 지원하므로,
체크박스가 실제로 필요한지 먼저 판단해주세요.

이번 단계에서는 바로 구현하지 말고 먼저 분석과 제안만 해주세요.

### 4. 무료체험 크레딧 연동 준비

무료체험 크레딧 연동은 이번 단계에서 바로 구현하지 말고,
필요한 구조만 분석해주세요.

분석할 내용:

1. 신규 회원가입 시 무료체험 크레딧을 지급해야 하는지
2. 이메일 회원가입, Google/Kakao 가입 모두에 동일하게 지급해야 하는지
3. 중복 지급을 어떻게 막을지
4. Supabase에 어떤 테이블이 필요한지
5. user id와 크레딧을 어떻게 연결할지
6. 무료체험 크레딧 차감은 어느 기능에서 발생해야 하는지
7. 다음 단계에서 구현할 경우 필요한 파일과 DB 스키마

## 이번 단계에서 하지 말 것

* Naver 구현 금지
* Naver 버튼 연결 금지
* Naver OAuth 관련 코드 추가 금지
* 무료체험 크레딧 실제 지급 로직 구현 금지
* DB 테이블 생성 또는 마이그레이션 실행 금지
* 로그인/회원가입 기본 기능 수정 금지
* 기존 Google/Kakao OAuth Provider 설정 코드 수정 금지
* 화면 디자인 변경 금지
* 새 UI 컴포넌트 생성 금지
* 전체 라우팅 구조 갈아엎기 금지

## 작업 방식

1. 먼저 현재 코드에서 관련 파일과 흐름을 분석해주세요.
2. 아래 4개 항목별로 현재 상태를 정리해주세요.

   * OAuth returnTo
   * 하드코딩 user prop
   * 로그인 상태 유지 체크박스
   * 무료체험 크레딧
3. 실제로 이번 단계에서 수정할 항목과 분석만 할 항목을 구분해주세요.
4. 변경할 파일 목록을 보여주세요.
5. 각 파일에서 무엇을 수정할지 짧게 설명해주세요.
6. 내가 승인하면 그때 코드를 수정해주세요.
