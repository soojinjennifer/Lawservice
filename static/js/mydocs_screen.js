
// MyDocsScreen.jsx — 마이페이지 / 나의 문서. PRD §6.6.

const DOC_LIST = [
{ id: 1, type: "notice",   title: "(주)미지급상사 물품대금 12,400,000원 독촉",      date: "2026-05-24", status: "saved",     edits: 2 },
{ id: 2, type: "notice",   title: "임대인 보증금 반환 통지",                         date: "2026-05-20", status: "draft",     edits: 0 },
{ id: 3, type: "brief",    title: "2026가합12345 매매계약 잔금 청구 - 준비서면",     date: "2026-04-28", status: "saved",     edits: 5 },
{ id: 4, type: "rebuttal", title: "손해배상 청구 반박 초안",                         date: "2026-04-15", status: "in_review", edits: 4 },
{ id: 5, type: "notice",   title: "(폐기) 잘못 작성된 시안",                         date: "2026-03-21", status: "deleted",   edits: 0 }];

// Badge variant 매핑 (Badge 공통 컴포넌트 사용)
const STATUS_META = {
  draft:     { label: "작성중",    variant: "neutral"  },
  generated: { label: "초안 생성됨", variant: "info"   },
  in_review: { label: "수정중",    variant: "warning"  },
  saved:     { label: "저장완료",  variant: "success"  },
  deleted:   { label: "삭제됨",   variant: "danger"   },
};

window.MyDocsScreen = function MyDocsScreen() {
  const visible = DOC_LIST.filter((d) => d.status !== "deleted");
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
        <SubTabBar active="mydocs" count={visible.length} />

        {/* stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "이번 달 생성",   value: "3", sub: "건", color: "var(--brand-rest)" },
            { label: "저장 완료",      value: "2", sub: "건", color: "var(--color-status-success-fg)" },
            { label: "작성중",         value: "1", sub: "건", color: "var(--color-status-warning-fg)" },
            { label: "무료 체험 잔여", value: "1", sub: "건", color: "var(--color-accent-magenta)" },
          ].map((s, i) => (
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
          <SearchFilterBar placeholder="문서 제목으로 검색" />

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
              {visible.map((doc) => {
                const meta   = DocTypeMeta(doc.type);
                const status = STATUS_META[doc.status];
                return (
                  <tr key={doc.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <DocChip type={meta.name} icon={meta.icon} size="sm" />
                    </td>
                    <td style={{ fontWeight: 600 }}>{doc.title}</td>
                    <td>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="muted">{doc.date}</td>
                    <td className="muted">{doc.edits}회</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="btn btn-subtle btn-sm" data-nav="/create/2">
                          <Icon name="eye" size={14} /> 보기
                        </button>
                        <button className="btn btn-subtle btn-sm" data-nav="/create/3">
                          <Icon name="docEdit" size={14} /> 이어서 수정
                        </button>
                        <button className="icon-btn" style={{ width: 28, height: 28 }}>
                          <Icon name="more" size={14} color="var(--color-neutral-fg-3)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LegalNotice />
      <SiteFooter />
    </div>
  );
};
