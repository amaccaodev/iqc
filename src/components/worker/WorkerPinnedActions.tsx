import { useEffect } from "react";
import useSwipeReveal from "../../hooks/useSwipeReveal";
import { useKeyboardViewport } from "../../hooks/useKeyboardViewport";
import { WORKER_BTN_PRIMARY, WORKER_BTN_SECONDARY, WORKER_DOCK_VAR } from "./workerUi";

export type WorkerPinnedAction = "measure" | "close" | "unlock" | "edit";

interface WorkerPinnedActionsProps {
  action: WorkerPinnedAction;
  onMeasure: () => void;
  onCloseShift: () => void;
  onUnlock: () => void;
  measureDisabled?: boolean;
  closeDisabled?: boolean;
  hint?: string;
  /** Highlight Đo điểm when already on the measure screen */
  measureActive?: boolean;
}

/**
 * Ghim 2 nút Đo điểm / Chốt ca (Sửa chốt ca / Mở khóa).
 * Điện thoại: vuốt lên hiện, vuốt xuống ẩn. Desktop: luôn hiện.
 */
export default function WorkerPinnedActions({
  action,
  onMeasure,
  onCloseShift,
  onUnlock,
  measureDisabled = false,
  closeDisabled = false,
  hint,
  measureActive = false,
}: WorkerPinnedActionsProps) {
  const { keyboardOpen } = useKeyboardViewport();
  const { visible, mobile, setVisible } = useSwipeReveal(!keyboardOpen);

  const expanded = visible && !keyboardOpen;

  useEffect(() => {
    const h = keyboardOpen ? 0 : expanded ? (hint ? 108 : 84) : mobile ? 28 : 84;
    document.documentElement.style.setProperty(WORKER_DOCK_VAR, `${h}px`);
    window.dispatchEvent(new Event("resize"));
    return () => {
      document.documentElement.style.setProperty(WORKER_DOCK_VAR, "0px");
      window.dispatchEvent(new Event("resize"));
    };
  }, [expanded, hint, keyboardOpen, mobile]);

  if (keyboardOpen) return null;

  return (
    <div
      data-worker-dock
      className="fixed inset-x-0 bottom-0 z-30"
    >
      <div className="sm:hidden flex justify-center">
        <button
          type="button"
          aria-label={expanded ? "Ẩn nút thao tác" : "Hiện nút thao tác"}
          aria-expanded={expanded}
          onClick={() => setVisible(!expanded)}
          className="flex flex-col items-center justify-center w-full h-7 border-0 bg-background/95 cursor-pointer text-muted"
        >
          <span className="block w-10 h-1 rounded-full bg-border mb-0.5" />
          <i className={`fas text-[10px] ${expanded ? "fa-chevron-down" : "fa-chevron-up"}`} />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
          expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0 sm:max-h-40 sm:opacity-100"
        }`}
      >
        <div className="border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {hint ? <p className="text-xs text-center text-muted mb-2">{hint}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onMeasure}
              disabled={measureDisabled}
              aria-current={measureActive ? "page" : undefined}
              data-testid="tab-Đo điểm"
              className={`${WORKER_BTN_PRIMARY} ${measureActive ? "ring-2 ring-offset-1 ring-white/80" : ""}`}
            >
              <i className="fas fa-ruler" /> Đo điểm
            </button>
            {action === "close" ? (
              <button
                type="button"
                onClick={onCloseShift}
                disabled={closeDisabled}
                data-testid="tab-Chốt ca"
                className={WORKER_BTN_SECONDARY}
              >
                <i className="fas fa-flag-checkered" /> Chốt ca
              </button>
            ) : action === "edit" ? (
              <button
                type="button"
                onClick={onCloseShift}
                disabled={closeDisabled}
                data-testid="tab-Sửa chốt ca"
                className={WORKER_BTN_SECONDARY}
              >
                <i className="fas fa-pen" /> Sửa chốt ca
              </button>
            ) : (
              <button
                type="button"
                onClick={onUnlock}
                disabled={closeDisabled}
                data-testid="tab-Mở khóa"
                className={WORKER_BTN_SECONDARY}
              >
                <i className="fas fa-lock-open" /> Mở khóa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
