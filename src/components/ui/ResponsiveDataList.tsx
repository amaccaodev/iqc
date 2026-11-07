import type { ReactNode } from "react";
import PaginationBar from "./PaginationBar";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface ResponsiveDataListProps<T> {
  items: T[];
  getKey: (row: T) => string;
  columns: Column<T>[];
  /** Mobile / tablet card renderer */
  renderCard: (row: T) => ReactNode;
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  emptyText?: string;
  /** Optional row click (desktop table + mobile cards) */
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
}

/**
 * Cards on mobile; data table from `lg` breakpoint upward, with shared pagination.
 */
export default function ResponsiveDataList<T>({
  items,
  getKey,
  columns,
  renderCard,
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  emptyText = "Không có dữ liệu",
  onRowClick,
  isRowActive,
}: ResponsiveDataListProps<T>) {
  return (
    <div className="space-y-3">
      {/* Mobile / tablet: cards */}
      <div className="space-y-2.5 lg:hidden">
        {items.map((row) => (
          <div
            key={getKey(row)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (!onRowClick) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(row);
              }
            }}
            className={`${onRowClick ? "cursor-pointer" : ""} ${
              isRowActive?.(row) ? "ring-2 ring-primary/40 rounded-2xl" : ""
            }`}
          >
            {renderCard(row)}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
            <i className="fas fa-inbox text-2xl mb-2 block opacity-50" />
            {emptyText}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface/80 text-muted text-[11px] uppercase tracking-wider border-b border-border/80">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left font-semibold px-5 py-3.5 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={getKey(row)}
                className={`border-t border-border/60 first:border-t-0 hover:bg-surface/70 ${
                  onRowClick ? "cursor-pointer" : ""
                } ${isRowActive?.(row) ? "bg-secondary/60 shadow-[inset_3px_0_0_var(--primary)]" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3.5 align-middle ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-muted-foreground">
                  <i className="fas fa-inbox text-2xl mb-2 block opacity-50" />
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={onPage}
        onPageSize={onPageSize}
      />
    </div>
  );
}
