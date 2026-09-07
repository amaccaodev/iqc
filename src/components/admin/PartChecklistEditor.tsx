import type { PartChecklistItem } from "@shared/types/spec";

const emptyRow = (): PartChecklistItem => ({
  name: "",
  type: "numeric",
  unit: "mm",
});

/** Nhập full checklist đo theo linh kiện — không chọn từ danh sách chung */
export default function PartChecklistEditor({
  items,
  onChange,
}: {
  items: PartChecklistItem[];
  onChange: (next: PartChecklistItem[]) => void;
}) {
  const rows = items.length ? items : [emptyRow()];

  const update = (idx: number, patch: Partial<PartChecklistItem>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };

  const add = () => onChange([...rows, emptyRow()]);
  const remove = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onChange(next.length ? next : [emptyRow()]);
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-border/50 bg-surface/70 p-3 space-y-3 sm:p-4 shadow-sm shadow-slate-950/5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-primary">Điểm đo ({idx + 1})</div>
            <button
              type="button"
              className="text-red-600 text-xs border-0 bg-transparent cursor-pointer"
              onClick={() => remove(idx)}
            >
              Xóa
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <label className="lg:col-span-6 block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Tên thông số</span>
              <input
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                placeholder="VD: Ø3, chiều dài, ren M6..."
                value={row.name}
                onChange={(e) => update(idx, { name: e.target.value })}
              />
            </label>
            <label className="lg:col-span-3 block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Loại nhập</span>
              <select
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                value={row.type ?? "numeric"}
                onChange={(e) =>
                  update(idx, { type: e.target.value as PartChecklistItem["type"] })
                }
              >
                <option value="numeric">Số</option>
                <option value="qualitative">Đạt/KQ</option>
                <option value="text">Chữ</option>
              </select>
            </label>
            <label className="lg:col-span-3 block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Đơn vị</span>
              <input
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                placeholder="mm"
                value={row.unit ?? ""}
                onChange={(e) => update(idx, { unit: e.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Giá trị chuẩn</span>
              <input
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                placeholder="Chuẩn"
                type="number"
                value={row.target ?? ""}
                onChange={(e) =>
                  update(idx, {
                    target: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Min</span>
              <input
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                placeholder="Min"
                type="number"
                value={row.min ?? ""}
                onChange={(e) =>
                  update(idx, { min: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-semibold text-muted mb-1">Max</span>
              <input
                className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
                placeholder="Max"
                type="number"
                value={row.max ?? ""}
                onChange={(e) =>
                  update(idx, { max: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[11px] font-semibold text-muted mb-1">Vị trí trên bản vẽ / ghi chú</span>
            <input
              className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm shadow-sm shadow-slate-950/5"
              placeholder="VD: Điểm (3) trên bản vẽ mặt cắt"
              value={row.hint ?? ""}
              onChange={(e) => update(idx, { hint: e.target.value })}
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-semibold text-primary border-0 bg-transparent cursor-pointer"
      >
        <i className="fas fa-plus mr-1" /> Thêm thông số
      </button>
    </div>
  );
}
