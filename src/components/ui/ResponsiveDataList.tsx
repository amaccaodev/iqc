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
  /** Skip the white panel when a parent Card already provides it */
  plain?: boolean;
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
  plain = false,
}: ResponsiveDataListProps<T>) {
  return (
    <div className={plain ? "" : "panel px-4 py-3"}>
      <div className="space-y-2 lg:hidden">
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
            className={onRowClick ? "cursor-pointer" : ""}
          >
            {renderCard(row)}
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
        )}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 text-left font-semibold ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={getKey(row)}
                className={`${onRowClick ? "cursor-pointer hover:bg-surface/70" : ""} ${
                  isRowActive?.(row) ? "bg-secondary/30" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-middle ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
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
