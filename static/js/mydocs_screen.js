
// MyDocsScreen.jsx — 마이페이지 / 나의 문서. PRD §6.6 + 설계 PRD §5(DB 연동).
// 데이터: GET /api/documents, GET /api/documents/stats (window.LawAPI.documents)
// 공통 컴포넌트 재사용: LoadingState / EmptyState / ErrorState / Pagination

// Badge variant 매핑 (Badge 공통 컴포넌트 사용) — 설계 PRD §5.4 확정본
const STATUS_META = {
  draft:     { label: "작성중",     variant: "neutral"  },
  generated: { label: "초안생성됨", variant: "info"     },
  in_review: { label: "수정중",     variant: "warning"  },
  saved:     { label: "저장완료",   variant: "success"  },
  delivered: { label: "발송완료",   variant: "success"  },
  deleted:   { label: "삭제됨",     variant: "danger"   },
};

const PER_PAGE = 20;

// ISO timestamp → YYYY-MM-DD
function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

window.MyDocsScreen = function MyDocsScreen() {
  const [docs,    setDocs]    = React.useState([]);
  const [stats,   setStats]   = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState(false);
  const [page,    setPage]    = React.useState(1);
  const [total,   setTotal]   = React.useState(0);
  const [searchQ, setSearchQ] = React.useState("");

  // 목록 조회 (검색·페이지 변경 시 호출)
  const loadDocs = React.useCallback((opts = {}) => {
    const p = opts.page != null ? opts.page : page;
    const q = opts.q != null ? opts.q : searchQ;
    setLoading(true);
    setError(false);
    return window.LawAPI.documents
      .list({ page: p, perPage: PER_PAGE, q: q || undefined, sort: "updated_at:desc" })
      .then((res) => {
        setDocs(res.items || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [page, searchQ]);

  // 마운트: stats + 첫 페이지 병렬 조회
  React.useEffect(() => {
    let alive = true;
    window.LawAPI.documents.stats()
      .then((s) => { if (alive) setStats(s); })
      .catch(() => { if (alive) setStats(null); });
    loadDocs({ page: 1, q: "" });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색 debounce 400ms → 1페이지부터 재조회
  const debounceRef = React.useRef(null);
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadDocs({ page: 1, q: v });
    }, 400);
  };

  const onPageChange = (next) => {
    setPage(next);
    loadDocs({ page: next });
  };

  const onDelete = (id) => {
    window.LawAPI.documents.remove(id)
      .then(() => {
        if (window.ToastManager) {
          window.ToastManager.show({ type: "success", message: "문서를 삭제했습니다." });
        }
        loadDocs();
        window.LawAPI.documents.stats().then(setStats).catch(() => {});
      })
      .catch(() => {
        if (window.ToastManager) {
          window.ToastManager.show({ type: "error", message: "삭제에 실패했습니다." });
        }
      });
  };

  const statCards = [
    { label: "이번 달 생성",   value: stats ? stats.this_month : "-",           sub: "건", color: "var(--brand-rest)" },
    { label: "저장 완료",      value: stats ? stats.saved : "-",                sub: "건", color: "var(--color-status-success-fg)" },
    { label: "작성중",         value: stats ? stats.in_progress : "-",          sub: "건", color: "var(--color-status-warning-fg)" },
    { label: "무료 체험 잔여", value: stats ? stats.free_trial_remaining : "-", sub: "건", color: "var(--color-accent-magenta)" },
  ];

  return (
    <div className="screen">
      <TopNav active="mypage" />

      <div className="screen-content">
        {/* page header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-neutral-fg-3)" }}>
              <span>마이페이지</span>
              <Icon name="chevronR" size={12} color="var(--color-neutral-fg-3)" />
              <span style={{ color: "var(--color-neutral-fg-1)", fontWeight: 600 }}>나의 문서</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 0" }}>나의 문서</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary"><Icon name="download" size={14} /> 전체 백업</button>
            <button className="btn btn-primary" data-nav="/create/1">
              <Icon name="plus" size={14} color="#fff" /> 새 문서 만들기
            </button>
          </div>
        </div>

        {/* sub-tab */}
        <SubTabBar active="mydocs" count={total} />

        {/* stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {statCards.map((s, i) => (
            <div key={i} className="card-flat" style={{ padding: 20 }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: s.color }}>{s.value}</span>
                <span className="muted" style={{ fontSize: 13 }}>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* toolbar + 문서 목록 */}
        <div className="card-flat" style={{ padding: 0 }}>
          <SearchFilterBar
            placeholder="문서 제목으로 검색"
            searchValue={searchQ}
            onSearchChange={onSearchChange}
          />

          {loading ? (
            <LoadingState context="list" message="문서를 불러오는 중..." />
          ) : error ? (
            <ErrorState context="list" onRetry={() => loadDocs()} />
          ) : docs.length === 0 ? (
            <EmptyState
              context="list"
              message={searchQ ? "검색 결과가 없습니다." : "아직 생성한 문서가 없습니다."}
              actionLabel={searchQ ? undefined : "새 문서 만들기"}
              onAction={searchQ ? undefined : () => { window.location.hash = "/create/1"; }}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" /></th>
                  <th style={{ width: 120 }}>종류</th>
                  <th>제목</th>
                  <th style={{ width: 120 }}>상태</th>
                  <th style={{ width: 110 }}>생성일</th>
                  <th style={{ width: 100 }}>수정</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => {
                  const meta   = DocTypeMeta(doc.doc_type);
                  const status = STATUS_META[doc.status] || STATUS_META.draft;
                  return (
                    <tr key={doc.id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <DocChip type={meta.name} icon={meta.icon} size="sm" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{doc.title || "(제목 없음)"}</td>
                      <td>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="muted">{fmtDate(doc.created_at)}</td>
                      <td className="muted">{(doc.revision_count || 0)}회</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="btn btn-subtle btn-sm" data-nav={`/create/2?doc_id=${doc.id}`}>
                            <Icon name="eye" size={14} /> 보기
                          </button>
                          <button className="btn btn-subtle btn-sm" data-nav={`/create/3?doc_id=${doc.id}`}>
                            <Icon name="docEdit" size={14} /> 이어서 수정
                          </button>
                          <button
                            className="icon-btn"
                            style={{ width: 28, height: 28 }}
                            onClick={() => onDelete(doc.id)}
                            aria-label="삭제"
                          >
                            <Icon name="trash" size={14} color="var(--color-neutral-fg-3)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && !error && total > PER_PAGE && (
            <div style={{ padding: "16px" }}>
              <Pagination page={page} total={total} perPage={PER_PAGE} onPageChange={onPageChange} />
            </div>
          )}
        </div>
      </div>

      <LegalNotice />
      <SiteFooter />
    </div>
  );
};
