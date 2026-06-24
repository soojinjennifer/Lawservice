// feedback/Pagination.js — 공통 페이지네이션 (PRD v1.2 §3 Pagination, 마이페이지 문서 목록)
// 이전/다음 + 페이지 번호. totalPages <= 1이면 렌더링 안 함. 브랜드 토큰 사용.
//
// Props:
//   page         : number — 현재 페이지(1부터)
//   totalPages   : number — 전체 페이지 수 (없으면 total/perPage로 계산)
//   onPageChange : function(nextPage)
//   perPage      : number(기본 20)
//   total        : number | null — 전체 아이템 수(totalPages 미제공 시 사용, "총 N건" 표기)
//
// 사용 예시:
//   <Pagination page={p} total={42} onPageChange={setP} />
//   <Pagination page={p} totalPages={5} onPageChange={setP} />

window.Pagination = function Pagination({ page, totalPages, onPageChange, perPage = 20, total }) {
  const pages = totalPages != null
    ? totalPages
    : (total != null ? Math.max(1, Math.ceil(total / perPage)) : 1);

  if (pages <= 1) return null;

  const cur = Math.min(Math.max(1, page), pages);

  // 표시할 페이지 번호(현재 ±2, 최대 5개 윈도우)
  const WINDOW = 5;
  let start = Math.max(1, cur - 2);
  let end = Math.min(pages, start + WINDOW - 1);
  start = Math.max(1, end - WINDOW + 1);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const go = (n) => { if (n >= 1 && n <= pages && n !== cur) onPageChange(n); };

  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        className="pagination-btn"
        onClick={() => go(cur - 1)}
        disabled={cur <= 1}
        aria-label="이전 페이지"
      >
        <Icon name="chevronL" size={14} color="currentColor" />
      </button>

      {nums.map((n) => (
        <button
          key={n}
          className={`pagination-num${n === cur ? " is-current" : ""}`}
          onClick={() => go(n)}
          aria-current={n === cur ? "page" : undefined}
        >
          {n}
        </button>
      ))}

      <button
        className="pagination-btn"
        onClick={() => go(cur + 1)}
        disabled={cur >= pages}
        aria-label="다음 페이지"
      >
        <Icon name="chevronR" size={14} color="currentColor" />
      </button>
    </nav>
  );
};
