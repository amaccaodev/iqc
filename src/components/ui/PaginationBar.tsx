export default function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
  if (safeTotal === 0) return null;
  const pages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, safeTotal);
  return (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border mt-2">
      <div className="text-[11px] text-muted">
        {from}–{to} / {safeTotal}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-10 min-w-10 px-3 rounded-xl border border-border bg-card text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Trang trước"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-primary px-2 min-w-[3rem] text-center">
          {page}/{pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="h-10 min-w-10 px-3 rounded-xl border border-border bg-card text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </div>
  );
}
