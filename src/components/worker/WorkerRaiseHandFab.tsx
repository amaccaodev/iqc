import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DraggableFab from "../ui/DraggableFab";

const ACTIONS = [
  {
    id: "overtime",
    label: "Xin tăng ca (OT)",
    hint: "Gửi đề xuất làm thêm giờ",
    fa: "fa-clock",
    path: "/worker/overtime?create=1",
  },
  {
    id: "incident",
    label: "Báo hỏng máy",
    hint: "Xin hỗ trợ cơ điện / tổ trưởng",
    fa: "fa-triangle-exclamation",
    path: "/worker/incidents?create=1",
  },
  {
    id: "machine",
    label: "Xin đổi máy",
    hint: "Đề xuất đổi máy khi đang sản xuất",
    fa: "fa-industry",
    path: "/worker/entry",
  },
] as const;

interface WorkerRaiseHandFabProps {
  hidden?: boolean;
}

/** FAB “dơ tay” — kéo mép màn hình; bấm mở menu đề xuất nhanh. */
export default function WorkerRaiseHandFab({ hidden = false }: WorkerRaiseHandFabProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <DraggableFab
        storageKey="iqc-fab-worker-raise"
        ariaLabel="Dơ tay — xin đề xuất"
        hidden={hidden}
        onPress={() => setOpen(true)}
        className="bg-[#1B3A5C] text-white dark:bg-[var(--nav-active)]"
      >
        <span className="relative flex flex-col items-center justify-center leading-none">
          <i className="fas fa-hand text-xl" aria-hidden />
          <span className="text-[9px] font-semibold mt-0.5 tracking-wide">Đề xuất</span>
        </span>
      </DraggableFab>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
            aria-label="Đóng"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xin đề xuất"
            className="relative z-10 w-full sm:max-w-md bg-card text-foreground rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center shrink-0">
                <i className="fas fa-hand" />
              </div>
              <div>
                <div className="font-display font-700 text-base">Dơ tay xin đề xuất</div>
                <p className="text-xs text-muted">Chọn loại yêu cầu gửi lên tổ trưởng / quản đốc</p>
              </div>
            </div>

            <div className="space-y-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-surface text-left cursor-pointer hover:border-[#2D6EBD] transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate(a.path);
                  }}
                >
                  <span className="w-9 h-9 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
                    <i className={`fas ${a.fa}`} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="block text-[11px] text-muted">{a.hint}</span>
                  </span>
                  <i className="fas fa-chevron-right text-muted text-xs ml-auto" />
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted mt-3 text-center">
              Giữ và kéo nút dơ tay để đẩy sang mép trái / phải màn hình
            </p>

            <button
              type="button"
              className="mt-2 w-full py-2.5 rounded-xl border border-border bg-background text-sm font-semibold cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
