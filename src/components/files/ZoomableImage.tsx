import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

/**
 * Viewer ảnh fullscreen: pinch-zoom + kéo pan trên điện thoại, double-tap phóng/thu.
 */
export default function ZoomableImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [broken, setBroken] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTap = useRef(0);
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    txRef.current = tx;
  }, [tx]);
  useEffect(() => {
    tyRef.current = ty;
  }, [ty]);

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  useEffect(() => {
    reset();
    setBroken(false);
  }, [src, reset]);

  const clampPan = (s: number, x: number, y: number) => {
    const el = wrapRef.current;
    if (!el || s <= 1) return { x: 0, y: 0 };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        // Double-tap: 1 ↔ 2.5
        if (scaleRef.current > 1.2) {
          reset();
        } else {
          const next = 2.5;
          setScale(next);
          setTx(0);
          setTy(0);
        }
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          tx: txRef.current,
          ty: tyRef.current,
        };
      }
    } else if (pointers.current.size === 2) {
      panStart.current = null;
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist: Math.max(dist, 1), scale: scaleRef.current };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStart.current.scale * (dist / pinchStart.current.dist)),
      );
      setScale(next);
      const pan = clampPan(next, txRef.current, tyRef.current);
      setTx(pan.x);
      setTy(pan.y);
      return;
    }

    if (pointers.current.size === 1 && panStart.current && scaleRef.current > 1) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const pan = clampPan(scaleRef.current, panStart.current.tx + dx, panStart.current.ty + dy);
      setTx(pan.x);
      setTy(pan.y);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.entries()][0];
      if (remaining) {
        panStart.current = {
          x: remaining[1].x,
          y: remaining[1].y,
          tx: txRef.current,
          ty: tyRef.current,
        };
      }
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current + delta));
    setScale(next);
    const pan = clampPan(next, txRef.current, tyRef.current);
    setTx(pan.x);
    setTy(pan.y);
  };

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full overflow-hidden touch-none select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {broken ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 text-sm px-6 text-center">
          <i className="fas fa-image text-3xl mb-2 opacity-50" />
          Không tải được ảnh. Thử lại hoặc tải file nhỏ hơn.
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain pointer-events-none"
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            transition: pointers.current.size ? "none" : "transform 0.12s ease-out",
          }}
          onError={() => setBroken(true)}
        />
      )}
      {scale > 1.05 ? (
        <button
          type="button"
          className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs border-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
        >
          Thu nhỏ
        </button>
      ) : (
        <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/70 pointer-events-none px-4">
          Chạm 2 ngón để phóng · chạm đôi để zoom
        </div>
      )}
    </div>
  );
}
