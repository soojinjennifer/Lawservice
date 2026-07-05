# 배포 가이드 — 내편문서 (Render)

## Render Start Command

Render 대시보드 → 서비스 선택 → **Settings → Start Command** 에 아래를 입력하세요.

```
gunicorn server:app --workers 1 --threads 4 --timeout 120 --graceful-timeout 30
```

| 옵션 | 값 | 이유 |
|---|---|---|
| `--workers 1` | 1개 | 단일 인스턴스, 메모리 절약 |
| `--threads 4` | 4개 | 동시 요청 처리 (Claude 호출 중 다른 요청 수용) |
| `--timeout 120` | 120초 | Claude Sonnet 최대 응답 시간 여유 확보 (기본값 30초면 500 오류 발생) |
| `--graceful-timeout 30` | 30초 | 배포 중 진행 중인 요청 마무리 대기 |

> `server:app` = `server.py` 파일 안의 `app = Flask(...)` 변수명. 변경 금지.

---

## 필수 환경변수 (Render → Environment)

| 변수명 | 설명 | 비고 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | 누락 시 500 오류 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://` 포함 |
| `SUPABASE_ANON_KEY` | Supabase anon 공개 키 | 브라우저 노출 허용 |
| `SUPABASE_SERVICE_KEY` | Supabase service role 키 | **절대 프론트 노출 금지** |
| `PG_PROVIDER` | `toss` (운영) / `mock` (개발) | |
| `PG_CLIENT_KEY` | Toss 클라이언트 키 (공개) | 브라우저 노출 허용 |
| `PG_SECRET_KEY` | Toss 시크릿 키 | **절대 프론트 노출 금지** |
| `PG_WEBHOOK_SECRET` | Toss 웹훅 시크릿 | **절대 프론트 노출 금지** |
| `PG_TEST_MODE` | `false` (운영) / `true` (개발) | |

---

## 배포 순서

1. GitHub 레포 최신 코드 push
2. Render 대시보드 → **Manual Deploy** 또는 자동 배포 대기
3. Deploy Log에서 `Listening at: http://0.0.0.0:PORT` 확인
4. [테스트 순서](#테스트-순서) 실행

---

## 테스트 순서

### 기본 동작 확인
```
1. 홈 화면 접속 → 로그인 없이 렌더링 확인
2. 내용증명 → 짧은 입력(사건 경위 50자) → 초안 생성 → 정상 응답 확인
3. Render Logs에서 [generate] 로그 출력 확인
```

### 상대방 반박문 (핵심 검증)
```
4. 상대방 반박문 → 전체 필드 입력 → 초안 생성
5. 120초 이내 응답 확인 (이전 31초 timeout 재현 안 되는지 확인)
6. Render Logs에서 [generate] docType=상대방 반박문 로그 확인
```

### 결제 권한 게이트 (FR-30)
```
7. 비로그인 또는 미결제 상태에서 준비서면 생성 시도
8. 결제 모달 표시 확인 (403 → PAYMENT_REQUIRED 흐름)
```

### 오류 처리
```
9. 환경변수에서 ANTHROPIC_API_KEY 임시 제거 → 배포
10. 생성 시도 → "AI 문서 생성 설정이 완료되지 않았습니다." 메시지 확인
11. ANTHROPIC_API_KEY 복원 → 재배포
```

---

## Render Logs 확인 방법

Render 대시보드 → 서비스 선택 → **Logs** 탭

| 로그 패턴 | 의미 |
|---|---|
| `[generate] docType=... facts_len=...` | 요청 정상 수신 |
| `[generate] Claude timeout` | 90초 초과 — 입력 줄이도록 안내 |
| `[generate] Anthropic API key rejected` | `ANTHROPIC_API_KEY` 오류 |
| `[generate] unexpected error` + stack trace | 예상 외 서버 오류 — stack trace로 원인 파악 |

---

## Timeout 발생 시 확인 방법

1. Render Logs에서 `[generate] Claude timeout` 메시지 확인
2. 사용자에게 "입력 내용을 줄이고 재시도" 안내 (자동 표시됨)
3. 지속 발생 시: `--timeout 120` → `--timeout 180` 으로 증가, `max_tokens=8000` → `6000` 으로 조정 검토

---

## 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 올라가지 않습니다. 반드시 Render 환경변수에 직접 입력하세요.
- `SUPABASE_SERVICE_KEY`, `PG_SECRET_KEY`, `PG_WEBHOOK_SECRET`는 서버 전용입니다. 브라우저로 절대 노출되지 않습니다.
- 증거 파일 업로드는 Render 인스턴스 로컬 디스크에 저장됩니다. 재배포 시 파일이 초기화될 수 있습니다. 영구 저장이 필요하면 Supabase Storage 연동을 별도 작업하세요.
