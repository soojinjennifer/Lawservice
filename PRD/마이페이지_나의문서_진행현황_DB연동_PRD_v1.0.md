# 설계 PRD — 나의 문서 탭 & 홈 나의 진행현황 DB 연동

> 기준 PRD: 내편문서 v2.0 (FR-10, FR-16)
> 작성일: 2026-06-22
> 상태: **pending approval** — 검토 후 구현 착수
> 구현 대상 파일: server.py, mydocs_screen.js, dashboard_screen.js, dashboard/CaseProgressCard.js, create_screen.js

---

## 1. 목표 및 범위

### 목표
- 현재 하드코딩(MOCK) 데이터로 동작 중인 "나의 문서" 탭과 홈 "나의 진행현황"을 Supabase DB 기반 실데이터로 교체
- CreateScreen에서 문서 초안 생성/수정 시 단계별 진행 상태를 DB에 자동 저장
- 홈 진행현황에서 YesNoToggle 답변 → AI 추천 문서 → CreateScreen으로 입력값 인계

### 범위 (In Scope)
- Supabase `documents` 테이블 설계 및 생성 SQL
- server.py 신규 API 엔드포인트 5종
- mydocs_screen.js stat cards 실데이터 연동
- mydocs_screen.js 문서 목록 DB 조회 + 페이지네이션
- dashboard/CaseProgressCard.js 실데이터 연동
- dashboard 나의 진행현황 최신 2건/문서종류 표시
- YesNoToggle 답변 기반 추천 로직 + 로딩 상태
- "선택한 문서 생성하기" → CreateScreen 입력값 pre-fill
- CreateScreen 단계 이동 시 DB 자동 저장 (upsert)

### 범위 (Out of Scope)
- 증거 파일 서버 영구 저장 (OQ-01, 현재 sessionStorage 유지)
- 결제 내역 화면 (FR-21 별도)
- 발송완료 수동 상태 변경 UI (향후)

---

## 2. DB 스키마 설계

### 2.1 Supabase `documents` 테이블

```sql
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  doc_type      text not null check (doc_type in ('notice','brief','rebuttal')),
  title         text not null default '(제목 없음)',
  status        text not null default 'draft'
                  check (status in ('draft','generated','in_review','saved','delivered','deleted')),
  current_step  smallint not null default 1 check (current_step between 1 and 3),
  input_data    jsonb,        -- 1단계 폼 입력값 전체 (발신인·수신인·사건경위 등)
  draft_text    text,         -- AI 생성 초안 본문
  revision_count smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS: 본인 문서만 접근
alter table public.documents enable row level security;
create policy "own documents" on public.documents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();
```

### 2.2 status ↔ step ↔ 화면 단계 매핑

| status        | current_step | 표시 라벨   | MiniSteps 상태        | Badge variant |
|---------------|-------------|------------|----------------------|---------------|
| `draft`       | 1           | 작성중      | 1번 current          | neutral       |
| `generated`   | 2           | 초안생성됨   | 2번 current          | info          |
| `in_review`   | 3           | 수정중      | 3번 current          | warning       |
| `saved`       | 3           | 저장완료    | 모두 done (step ≥ 3)  | success       |
| `delivered`   | 3           | 발송완료    | 모두 done (step ≥ 3)  | success       |
| `deleted`     | —           | 삭제됨      | 표시 안 함 (목록 제외)  | danger        |

> - .docx 다운로드 완료 이벤트 = `saved` 처리. 이후 별도 UI로 `delivered` 수동 변경 가능(향후 과제).
> - `deleted`는 soft-delete 전용 값. GET /api/documents 목록 응답에서 기본 제외 (status != 'deleted' WHERE 조건 적용).
> - **MiniSteps `step` 인자 처리**: `saved`/`delivered`는 `current_step=3`이지만 MiniSteps에 `step=4`를 전달해 모두 done 렌더링. 기존 `CaseProgressCard.js`의 `MiniSteps` 컴포넌트는 `step > stepNum`을 `isDone`으로 처리하므로 `step=4` 전달 시 1·2·3 모두 done 표시됨 (기존 구현 그대로 활용).
> - **`MOCK_CASES`의 `step=4` 패턴**: `dashboard_screen.js`의 발송완료 카드가 이미 `step=4`를 사용 중 — 일관성 확인 완료.

### 2.3 status ↔ MyDocumentListItem status 매핑

CLAUDE.md `MyDocumentListItem`의 status 정의(`saved / draft / in_review / deleted`)와 DB status 값의 대응:

| DB status   | MyDocumentListItem status | 비고                         |
|-------------|--------------------------|------------------------------|
| `draft`     | `draft`                  | 1:1 대응                     |
| `generated` | `draft`                  | 별도 구분이 없으므로 draft 계열로 표시. Badge는 STATUS_META로 "초안생성됨" 표시 |
| `in_review` | `in_review`              | 1:1 대응                     |
| `saved`     | `saved`                  | 1:1 대응                     |
| `delivered` | `saved`                  | MyDocumentListItem에 delivered 없음 — saved와 동일 actions 적용, Badge로 "발송완료" 구분 |
| `deleted`   | `deleted`                | soft-delete, 목록 기본 제외   |

### 2.4 title 자동 생성 규칙

- 1단계 입력 중 `sender` + `receiver` + `doc_type`이 채워지면:
  - 내용증명: `{receiver} — 내용증명`
  - 준비서면: `{case_id} {receiver} — 준비서면`
  - 반박문: `{receiver} 답변 반박`
- 제목이 비어있으면 `(작성 중)` 표시

---

## 3. API 엔드포인트 설계

### 3.0 공통 구현 패턴

모든 신규 엔드포인트는 기존 `server.py`의 패턴을 그대로 따른다:

- **인증 게이트**: 각 엔드포인트 진입 시 `user_id = _gate_user_id()` 호출. 미인증 시 401 반환.
- **RLS 이중 방어**: Supabase RLS(`auth.uid() = user_id`)가 1차 방어, 서버에서 `WHERE user_id = user_id` 조건이 2차 방어.
- **기존 API 충돌 없음**: PRD v2.0 §13.3의 기존 엔드포인트(`/api/generate`, `/api/revise`, `/api/download_docx`, `/api/analyze_opponent`, `/api/check_risk`, `/api/extract_evidence`, `/api/suggest_strategies`)는 변경 없음. 신규 `/api/documents*` 엔드포인트는 별도 경로로 추가.

### 3.1 신규 엔드포인트 목록

| 엔드포인트              | 메서드 | 설명                                        |
|------------------------|--------|---------------------------------------------|
| `/api/documents`       | GET    | 로그인 사용자의 문서 목록 (필터·정렬·페이지) |
| `/api/documents/stats` | GET    | 통계 4종 (이번달/저장완료/작성중/무료잔여)    |
| `/api/documents`       | POST   | 문서 신규 생성 (doc_type 필수)               |
| `/api/documents/<id>`  | PATCH  | 문서 업데이트 (upsert 방식)                  |
| `/api/documents/<id>`  | DELETE | 문서 soft-delete (status → `'deleted'` 처리 — DB check constraint에 `'deleted'` 포함됨) |

### 3.2 GET /api/documents

**Query params**
```
page=1&per_page=20&doc_type=notice&status=saved&q=검색어&sort=updated_at:desc
```

**Response**
```json
{
  "items": [
    {
      "id": "uuid",
      "doc_type": "notice",
      "title": "(주)미지급상사 — 내용증명",
      "status": "saved",
      "current_step": 3,
      "revision_count": 2,
      "created_at": "2026-05-24T10:00:00Z",
      "updated_at": "2026-05-24T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

> `draft_text`, `input_data`는 목록 API에서 제외 (용량 절약). 개별 조회 시 포함.

### 3.3 GET /api/documents/stats

**Response**
```json
{
  "this_month": 3,
  "saved": 2,
  "in_progress": 1,
  "free_trial_remaining": 1
}
```

- `this_month`: 이번 달 1일 이후 `created_at` 건수
- `saved`: status = 'saved' OR 'delivered' 건수
- `in_progress`: status in ('draft','generated','in_review') 건수
- `free_trial_remaining`: `get_trial_status(user_id)` 함수 재활용 (PRD v2.0 §11.2 — 내용증명 1건 무료만 적용. notice 이외 doc_type에는 무료잔여 개념 없음)

### 3.4 POST /api/documents

**Request body**
```json
{ "doc_type": "notice" }
```

**Response**
```json
{ "id": "uuid", "doc_type": "notice", "status": "draft", "current_step": 1 }
```

> CreateScreen 진입 시 즉시 문서 row를 생성해 `document_id`를 확보. 이후 PATCH로 업데이트.

### 3.5 PATCH /api/documents/<id>

**Request body** (변경된 필드만 전송)
```json
{
  "title": "김○○ 임대차 — 내용증명",
  "status": "generated",
  "current_step": 2,
  "input_data": { "sender": "김○○", "receiver": "박○○", "case_body": "..." },
  "draft_text": "AI 생성 초안 본문",
  "revision_count": 0
}
```

---

## 4. CreateScreen 변경 사항

### 4.1 문서 ID 관리 흐름

```
CreateScreen 진입
  ├─ URL에 ?doc_id=xxx → 기존 문서 불러오기 (PATCH 모드)
  └─ doc_id 없음 → POST /api/documents → document_id 확보 (sessionStorage 보관)

Step 1 폼 변경 시 (debounce 1500ms)
  └─ PATCH /api/documents/{id}  { input_data, title }

"초안 생성하기" 클릭 → AI 생성 성공 시
  └─ PATCH /api/documents/{id}  { status: "generated", current_step: 2, draft_text }

Step 3 이동 시
  └─ PATCH /api/documents/{id}  { status: "in_review", current_step: 3 }

.docx 다운로드 성공 시
  └─ PATCH /api/documents/{id}  { status: "saved" }
```

### 4.2 기존 sessionStorage 임시저장과 공존 규칙

**키 목록 및 역할 (충돌 없음 확인)**:

| 키 이름            | 용도                                          | 기존/신규 |
|--------------------|-----------------------------------------------|-----------|
| `law_form_draft`   | CreateScreen 폼 전체 임시저장 (PRD §5.2 기준) | 기존 유지 |
| `law_form_prefill` | 대시보드 추천 → CreateScreen 입력값 인계용     | 신규 추가 |

> 두 키는 이름이 달라 충돌 없음. `law_form_prefill`은 CreateScreen Step 1 마운트 시 1회 읽고 즉시 삭제(`sessionStorage.removeItem`)하여 잔류하지 않도록 처리.

- `law_form_draft`는 그대로 유지 (오프라인/비로그인 폴백, 기존 `DRAFT_STORAGE_KEY` 상수 변경 없음)
- 로그인 상태에서는 DB 저장을 primary로, `law_form_draft` sessionStorage를 백업으로 병행
- 비로그인 상태에서는 `law_form_draft` sessionStorage만 사용 (기존 동작 유지)
- `law_form_prefill`은 로그인 상태 대시보드에서만 기록되므로 비로그인 경로와 무관

---

## 5. 나의 문서 탭 (mydocs_screen.js) 변경 사항

### 5.1 데이터 로딩

```
컴포넌트 마운트
  ├─ GET /api/documents/stats  → stat cards 업데이트
  └─ GET /api/documents?page=1&per_page=20  → 문서 목록 렌더링
```

### 5.2 Stat Cards (실데이터 연동)

| 카드        | 현재 (하드코딩) | 변경 후 (API)               |
|------------|-------------|---------------------------|
| 이번달 생성  | "3"          | stats.this_month           |
| 저장완료    | "2"          | stats.saved                |
| 작성중      | "1"          | stats.in_progress          |
| 무료체험잔여 | "1"          | stats.free_trial_remaining |

### 5.3 문서 목록 테이블

- 기존 `DOC_LIST` 상수 제거
- `React.useState`로 `docs`, `loading`, `error`, `page`, `total` 관리
- 검색어 입력 시 `?q=검색어` API 재호출 (debounce 400ms)
- 페이지네이션: 20건/페이지, `Pagination` 컴포넌트 사용
- 문서 삭제: DELETE → 목록 재조회
- "이어서 수정": `/create/3?doc_id={id}` 로 이동 (CreateScreen이 input_data + draft_text 복원)

### 5.4 상태 매핑 전체 확정 (STATUS_META)

```js
// mydocs_screen.js — STATUS_META 전체 확정본
const STATUS_META = {
  draft:     { label: "작성중",     variant: "neutral"  },
  generated: { label: "초안생성됨", variant: "info"     },  // 공백 없음 (PRD v2.0 §13.2)
  in_review: { label: "수정중",     variant: "warning"  },
  saved:     { label: "저장완료",   variant: "success"  },
  delivered: { label: "발송완료",   variant: "success"  },  // 신규 추가
  deleted:   { label: "삭제됨",     variant: "danger"   },  // 기존 유지
};
```

---

## 6. 홈 나의 진행현황 (CaseProgressCard.js) 변경 사항

### 6.1 데이터 로딩

```
DashboardScreen 마운트
  └─ GET /api/documents?sort=updated_at:desc&per_page=50
     → doc_type별 최신 2건 추출 (클라이언트 groupBy)
     → CaseProgressCard 배열로 렌더링
```

> 최신 2건/문서종류 제한은 서버 부담 없이 클라이언트에서 slice 처리.

### 6.2 추천 문서 로딩 상태 (신규)

**변경 후 흐름**:
```
초기 상태
  └─ 추천 카드 비활성 ("지금 상황을 알려주세요 답변 후 추천됩니다" 안내)
  └─ "선택한 문서 생성하기" 버튼 disabled

3개 질문 중 1개 이상 답변 시
  └─ 로딩 스피너 500ms
  └─ 추천 카드 활성화 (recommended 배지 강조)
  └─ "선택한 문서 생성하기" 버튼 활성화
```

**추천 로직 (클라이언트 규칙 기반)**:

```
내용증명 이후:
  q1(답변했나요?) = yes  → 상대방 반박문 recommended
  q2(반송됐나요?) = yes  → 재내용증명 recommended
  그 외             → 재내용증명 recommended (기본)

준비서면 이후:
  q1(답변했나요?) = yes  → 보충 준비서면 recommended
  그 외             → 보충 준비서면 recommended (기본)

반박문 이후:
  q2(더 심한 주장?) = yes → 반박문 이어쓰기 recommended
  그 외              → 반박문 이어쓰기 recommended (기본)
```

### 6.3 "선택한 문서 생성하기" → CreateScreen pre-fill

1. 선택된 추천 문서 종류 확인 (`selected` state)
2. 현재 카드의 `doc.input_data`에서 발신인·수신인 등 공통 필드 추출
3. sessionStorage에 `law_form_prefill` 키로 저장:
   ```json
   {
     "docType": "rebuttal",
     "sender": "김○○",
     "receiver": "(주)미지급상사",
     "prefillSource": "dashboard_recommendation"
   }
   ```
4. `/create/1`로 이동
5. CreateScreen Step 1 마운트 시 `law_form_prefill` 존재하면 해당 필드 자동 채움 + Toast "이전 정보가 자동으로 입력되었습니다" + `removeItem` 즉시 삭제

---

## 7. 구현 순서 및 파일별 작업 목록

### Phase 1 — DB·API (server.py)
1. Supabase `documents` 테이블 생성 SQL 실행
2. `GET /api/documents` 엔드포인트 구현
3. `GET /api/documents/stats` 엔드포인트 구현
4. `POST /api/documents` 엔드포인트 구현
5. `PATCH /api/documents/<id>` 엔드포인트 구현
6. `DELETE /api/documents/<id>` 엔드포인트 구현

### Phase 2 — CreateScreen DB 연동 (create_screen.js)
7. CreateScreen 마운트 시 `POST /api/documents` 호출 → document_id 관리
8. 폼 입력 debounce PATCH 추가
9. 초안 생성 성공 시 PATCH (status: generated)
10. Step 3 이동 시 PATCH (status: in_review)
11. 다운로드 완료 시 PATCH (status: saved)
12. `?doc_id=` URL param으로 기존 문서 불러오기 (input_data, draft_text 복원)

### Phase 3 — 나의 문서 탭 (mydocs_screen.js)
13. `DOC_LIST` 하드코딩 제거, API 호출로 교체
14. Stat cards 실데이터 연동
15. 검색·필터 API 연동
16. 페이지네이션 연동
17. 삭제·이어서 수정 실동작 연결

### Phase 4 — 나의 진행현황 (dashboard_screen.js + CaseProgressCard.js)
18. `MOCK_CASES` 제거, API 조회로 교체
19. 추천 로딩 상태 UI 추가
20. YesNoToggle 답변 기반 추천 로직 구현
21. "선택한 문서 생성하기" pre-fill sessionStorage 저장 + 이동
22. CreateScreen Step 1에서 pre-fill 자동 채움 처리

---

## 8. 수용 기준 (Acceptance Criteria)

- [ ] 로그인 후 나의 문서 탭에서 실제 DB의 문서 목록이 조회된다
- [ ] Stat cards가 실시간 집계값을 표시한다 (이번달/저장완료/작성중/무료잔여)
- [ ] 검색어 입력 시 문서 목록이 필터링된다
- [ ] CreateScreen에서 초안 생성 완료 후 나의 문서 탭 재방문 시 해당 문서가 목록에 나타난다
- [ ] 문서 상태(작성중 → 초안생성됨 → 수정중 → 저장완료)가 단계 이동에 따라 자동으로 변경된다
- [ ] 홈 나의 진행현황에 실제 내 문서 최신 2건이 doc_type별로 표시된다
- [ ] YesNoToggle 질문 답변 후 500ms 로딩 → 추천 문서 카드 활성화된다
- [ ] 답변 전 "선택한 문서 생성하기" 버튼이 disabled 상태이다
- [ ] 추천 문서 선택 후 "선택한 문서 생성하기" 클릭 시 CreateScreen에 발신인/수신인이 pre-fill된다
- [ ] Pre-fill 시 Toast "이전 정보가 자동으로 입력되었습니다"가 표시된다
- [ ] 비로그인 상태에서는 기존 sessionStorage 임시저장 동작이 그대로 유지된다

---

## 9. 위험 및 완화

| 위험 | 완화 방안 |
|------|---------|
| Supabase RLS 미설정 시 타 사용자 문서 노출 | SQL에 RLS 정책 포함, 서버에서 user_id 재검증 |
| CreateScreen 진입마다 빈 문서 row 생성 (쓰레기 데이터) | `?doc_id=` 없는 경우에만 POST, 뒤로가기 시 미저장 문서(status=draft + input_data=null) 배치 정리 |
| 폼 debounce 중 브라우저 이탈 | sessionStorage 폴백 유지 |
| doc_type 'notice' 이외 무료잔여 계산 오류 | stats API에서 기존 `get_trial_status()` 함수 재활용 |

---

## 10. 설계 규칙 검토 결과

> 검토 기준: CLAUDE.md v1.2 + 내편문서 PRD v2.0
> 검토일: 2026-06-22
> 결론: 아래 6개 항목 수정 완료. 나머지 항목은 기존 설계 규칙과 일치 확인.

| # | 항목 | Before | After | 근거 |
|---|------|--------|-------|------|
| 1 | DB status constraint | `'deleted'` 누락 | `'deleted'` 추가 | soft-delete API 오류 방지, CLAUDE.md MyDocumentListItem 일치 |
| 2 | status 매핑표 | deleted 행·Badge variant 컬럼 없음 | deleted 행·variant 컬럼 추가 | 기존 mydocs_screen.js 구현 일치 |
| 3 | MiniSteps step 인자 | saved/delivered 렌더링 방식 불명확 | step=4 전달 명시 | CaseProgressCard.js MiniSteps 로직·MOCK_CASES 패턴 일치 |
| 4 | STATUS_META generated 레이블 | "초안 생성됨" (공백) | "초안생성됨" (공백 없음) | PRD v2.0 §13.2 표기 기준 |
| 5 | sessionStorage 생명주기 | law_form_prefill 정리 시점 미명시 | Step 1 마운트 후 즉시 removeItem | 재진입 오작동 방지 |
| 6 | API 공통 패턴 | _gate_user_id() 적용 여부 불명확 | §3.0 공통 패턴 섹션 신설 | 기존 server.py 일관성 유지 |

### 이상 없음 확인 항목
- `doc_type` 3종 constraint — CLAUDE.md 활성 3종과 일치
- MiniSteps 레이블 `["정보", "초안", "수정·저장"]` — 기존 구현과 일치
- `free_trial_remaining` → `get_trial_status()` 재활용 — 기존 엔드포인트와 동일 함수
- 신규 버튼 스타일 생성 없음 — 금지사항 준수
- `/create/3?doc_id=` — 기존 라우팅 구조의 query param 확장, 신규 라우트 없음
- 컴포넌트명 (`Pagination`, `MyDocumentListItem`, `Badge`, `DocChip`) — CLAUDE.md 일치

---

*소유·운영: 주식회사 더그라운드모여 (TheGroundMOYO Inc.) · copyright@TheGroundMOYO*
