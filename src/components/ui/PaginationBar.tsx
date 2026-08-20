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
  const pages = Math.max(1, Math.ceil(safeTotal / pageSize));
  if (safeTotal <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, safeTotal);
  return (
    <div className="flex items-center justify-between gap-2 pt-3">
      <div className="text-[11px] text-[#94A3B8]">
        {from}–{to} / {safeTotal}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-10 min-w-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm disabled:opacity-40 cursor-pointer"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-[#1B3A5C] px-2">
          {page}/{pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="h-10 min-w-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm disabled:opacity-40 cursor-pointer"
        >
          ›
        </button>
      </div>
    </div>
  );
}
