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
    <div className="space-y-2">
      <div className="text-xs text-muted">
        Nhập <strong>đủ</strong> thông số đo của linh kiện này (mỗi LK khác nhau). Khi tạo lệnh SX hệ
        thống copy full checklist — không chọn lẻ.
      </div>
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-12 gap-1.5 items-start rounded-lg border border-border bg-surface p-2"
        >
          <div className="col-span-12 sm:col-span-1 text-[11px] font-bold text-primary pt-2">
            ({idx + 1})
          </div>
          <input
            className="col-span-12 sm:col-span-4 border border-border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Tên thông số *"
            value={row.name}
            onChange={(e) => update(idx, { name: e.target.value })}
          />
          <select
            className="col-span-6 sm:col-span-2 border border-border rounded-lg px-2 py-1.5 text-sm"
            value={row.type ?? "numeric"}
            onChange={(e) =>
              update(idx, { type: e.target.value as PartChecklistItem["type"] })
            }
          >
            <option value="numeric">Số</option>
            <option value="qualitative">Đạt/KQ</option>
            <option value="text">Chữ</option>
          </select>
          <input
            className="col-span-6 sm:col-span-1 border border-border rounded-lg px-2 py-1.5 text-sm"
            placeholder="ĐV"
            value={row.unit ?? ""}
            onChange={(e) => update(idx, { unit: e.target.value })}
          />
          <input
            className="col-span-4 sm:col-span-1 border border-border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Chuẩn"
            type="number"
            value={row.target ?? ""}
            onChange={(e) =>
              update(idx, {
                target: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
          <input
            className="col-span-4 sm:col-span-1 border border-border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Min"
            type="number"
            value={row.min ?? ""}
            onChange={(e) =>
              update(idx, { min: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
          <input
            className="col-span-4 sm:col-span-1 border border-border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Max"
            type="number"
            value={row.max ?? ""}
            onChange={(e) =>
              update(idx, { max: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
          <button
            type="button"
            className="col-span-12 sm:col-span-1 text-red-600 text-xs border-0 bg-transparent cursor-pointer py-2"
            onClick={() => remove(idx)}
          >
            Xóa
          </button>
          <input
            className="col-span-12 border border-border rounded-lg px-2 py-1.5 text-xs"
            placeholder="Gợi ý / vị trí bản vẽ (tuỳ chọn)"
            value={row.hint ?? ""}
            onChange={(e) => update(idx, { hint: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-semibold text-[#2D6EBD] border-0 bg-transparent cursor-pointer"
      >
        <i className="fas fa-plus mr-1" /> Thêm thông số
      </button>
    </div>
  );
}
