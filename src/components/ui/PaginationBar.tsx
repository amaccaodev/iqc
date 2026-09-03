import { PAGE_SIZE_OPTIONS } from "@shared/constants/pagination";

function pageWindow(page: number, pages: number, width = 5): number[] {
  if (pages <= width) return Array.from({ length: pages }, (_, i) => i + 1);
  const half = Math.floor(width / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(pages, start + width - 1);
  start = Math.max(1, end - width + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
  if (safeTotal === 0) return null;
  const pages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, safeTotal);
  const nums = pageWindow(page, pages);
  const btn =
    "h-9 min-w-9 px-2 rounded-lg border border-border bg-card text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:border-primary";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border mt-2">
      <div className="text-[11px] text-muted tabular-nums">
        {from}–{to} / {safeTotal} mục · Trang {page}/{pages}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {onPageSize ? (
          <label className="flex items-center gap-1 text-[11px] text-muted mr-2">
            <span>Mỗi trang</span>
            <select
              className="h-9 rounded-lg border border-border bg-card text-sm px-2 cursor-pointer"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              aria-label="Số dòng mỗi trang"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="button" disabled={page <= 1} onClick={() => onPage(1)} className={btn} aria-label="Trang đầu">
          «
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={btn}
          aria-label="Trang trước"
        >
          ‹
        </button>
        {nums[0] > 1 ? <span className="px-1 text-muted text-xs">…</span> : null}
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            className={`${btn} ${n === page ? "bg-primary text-primary-foreground border-primary font-semibold" : ""}`}
            aria-current={n === page ? "page" : undefined}
            aria-label={`Trang ${n}`}
          >
            {n}
          </button>
        ))}
        {nums[nums.length - 1] < pages ? <span className="px-1 text-muted text-xs">…</span> : null}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className={btn}
          aria-label="Trang sau"
        >
          ›
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(pages)}
          className={btn}
          aria-label="Trang cuối"
        >
          »
        </button>
      </div>
    </div>
  );
}
