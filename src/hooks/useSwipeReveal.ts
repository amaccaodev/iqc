import { useCallback, useEffect, useRef, useState } from "react";

const MIN_DISTANCE = 48;
const BOTTOM_ZONE = 140;

/**
 * Mobile: swipe up near the bottom → show; swipe down → hide.
 * Desktop (sm+): always shown.
 */
export default function useSwipeReveal(enabled: boolean) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : true,
  );
  const [visible, setVisible] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !mobile) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled, mobile],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !mobile) return;
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dy = touch.clientY - start.y;
      const dx = touch.clientX - start.x;
      if (Math.abs(dy) < MIN_DISTANCE || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const fromBottom = start.y >= window.innerHeight - BOTTOM_ZONE;
      const fromDock = (e.target as HTMLElement | null)?.closest("[data-worker-dock]") != null;
      if (!fromBottom && !fromDock) return;
      if (dy < 0) setVisible(true);
      else setVisible(false);
    },
    [enabled, mobile],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, onTouchStart, onTouchEnd]);

  return {
    visible: !mobile || visible,
    mobile,
    setVisible,
  };
}
