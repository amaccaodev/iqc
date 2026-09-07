import { PAGE_SIZE_OPTIONS } from "@shared/constants/pagination";

function pageWindow(page: number, pages: number, width = 5): number[] {
  if (pages <= width) return Array.from({ length: pages }, (_, i) => i + 1);
  const half = Math.floor(width / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(pages, start + width - 1);
  start = Math.max(1, end - width + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function pageJumps(pages: number): number[] {
  if (pages <= 7) return [];
  return [1, pages];
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
  const jumps = pageJumps(pages);
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-transparent px-2 text-sm text-foreground cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed hover:bg-surface";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex w-full items-center justify-center gap-1">
        {pages <= 1 ? (
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
            1
          </span>
        ) : (
          <>
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
            {jumps.includes(1) && !nums.includes(1) ? (
              <button type="button" onClick={() => onPage(1)} className={`${btn} hidden sm:inline-flex`} aria-label="Trang 1">
                1
              </button>
            ) : null}
            {nums[0] > 1 ? <span className="hidden px-1 text-xs text-muted sm:inline">…</span> : null}
            {nums.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                className={`${btn} ${n === page ? "bg-primary text-primary-foreground font-semibold hover:bg-primary" : "hidden sm:inline-flex"}`}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Trang ${n}`}
              >
                {n}
              </button>
            ))}
            {nums[nums.length - 1] < pages ? <span className="hidden px-1 text-xs text-muted sm:inline">…</span> : null}
            {jumps.includes(pages) && !nums.includes(pages) ? (
              <button
                type="button"
                onClick={() => onPage(pages)}
                className={`${btn} hidden sm:inline-flex`}
                aria-label={`Trang ${pages}`}
              >
                {pages}
              </button>
            ) : null}
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
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="tabular-nums">
          {from}–{to} / {safeTotal} mục · Trang {page}/{pages}
        </span>
        {onPageSize ? (
          <label className="flex items-center gap-1">
            <span>Mỗi trang</span>
            <select
              className="h-8 rounded-lg bg-transparent px-1 text-sm cursor-pointer"
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
      </div>
    </div>
  );
}
