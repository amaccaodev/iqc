import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export type FabEdge = "left" | "right";

export interface FabPosition {
  edge: FabEdge;
  /** 0–1 from top of usable area (below safe top, above bottom nav) */
  yRatio: number;
}

const DEFAULT_POS: FabPosition = { edge: "right", yRatio: 0.62 };
const FAB_SIZE = 56;
const EDGE_PAD = 12;
const BOTTOM_NAV = 80;
const DOCK_VAR = "--worker-dock-h";

function bottomReserve(): number {
  if (typeof window === "undefined") return BOTTOM_NAV;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(DOCK_VAR).trim();
  const dock = Number.parseInt(raw, 10);
  if (Number.isFinite(dock) && dock > 0) return dock + 8;
  return BOTTOM_NAV;
}
const TOP_SAFE = 12;
const DRAG_THRESHOLD = 8;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function loadPos(storageKey: string): FabPosition {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw) as FabPosition;
    if (p.edge !== "left" && p.edge !== "right") return DEFAULT_POS;
    if (typeof p.yRatio !== "number" || Number.isNaN(p.yRatio)) return DEFAULT_POS;
    return { edge: p.edge, yRatio: clamp(p.yRatio, 0, 1) };
  } catch {
    return DEFAULT_POS;
  }
}

function toPixels(pos: FabPosition, vw: number, vh: number) {
  const bottom = bottomReserve();
  const usableH = Math.max(1, vh - TOP_SAFE - bottom - FAB_SIZE);
  const x = pos.edge === "left" ? EDGE_PAD : vw - FAB_SIZE - EDGE_PAD;
  const y = TOP_SAFE + pos.yRatio * usableH;
  return { x, y };
}

function fromPixels(x: number, y: number, vw: number, vh: number): FabPosition {
  const bottom = bottomReserve();
  const usableH = Math.max(1, vh - TOP_SAFE - bottom - FAB_SIZE);
  const mid = vw / 2;
  const edge: FabEdge = x + FAB_SIZE / 2 < mid ? "left" : "right";
  const yRatio = clamp((y - TOP_SAFE) / usableH, 0, 1);
  return { edge, yRatio };
}

interface DraggableFabProps {
  storageKey: string;
  ariaLabel: string;
  onPress: () => void;
  children: ReactNode;
  className?: string;
  /** Hide while keyboard open / etc. */
  hidden?: boolean;
}

/**
 * FAB kéo được; thả tay thì hút vào mép trái/phải, nhớ vị trí theo storageKey.
 */
export default function DraggableFab({
  storageKey,
  ariaLabel,
  onPress,
  children,
  className = "",
  hidden = false,
}: DraggableFabProps) {
  const [pos, setPos] = useState<FabPosition>(() => loadPos(storageKey));
  const [dragging, setDragging] = useState(false);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const liveRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const setLivePos = (p: { x: number; y: number } | null) => {
    liveRef.current = p;
    setLive(p);
  };

  const syncFromStorage = useCallback(() => {
    setPos(loadPos(storageKey));
  }, [storageKey]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const onResize = () => setLivePos(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const anchored = toPixels(pos, vw, vh);
  const x = live?.x ?? anchored.x;
  const y = live?.y ?? anchored.y;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const el = btnRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: x,
      originY: y,
      moved: false,
    };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    const nextX = clamp(d.originX + dx, EDGE_PAD, vw - FAB_SIZE - EDGE_PAD);
    const nextY = clamp(d.originY + dy, TOP_SAFE, vh - bottomReserve() - FAB_SIZE);
    setLivePos({ x: nextX, y: nextY });
  };

  const finish = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      btnRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (!d.moved) {
      setLivePos(null);
      onPress();
      return;
    }

    const cur = liveRef.current ?? {
      x: clamp(d.originX + (e.clientX - d.startX), EDGE_PAD, vw - FAB_SIZE - EDGE_PAD),
      y: clamp(d.originY + (e.clientY - d.startY), TOP_SAFE, vh - bottomReserve() - FAB_SIZE),
    };
    const snapped = fromPixels(cur.x, cur.y, vw, vh);
    setPos(snapped);
    setLivePos(null);
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapped));
    } catch {
      /* ignore */
    }
  };

  if (hidden) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      className={`fixed z-40 flex items-center justify-center rounded-full shadow-lg border-0 touch-none select-none ${
        dragging ? "cursor-grabbing scale-105" : "cursor-grab"
      } ${className}`}
      style={{
        width: FAB_SIZE,
        height: FAB_SIZE,
        left: x,
        top: y,
        transition: dragging || live ? "none" : "left 180ms ease, top 180ms ease, transform 120ms ease",
      }}
    >
      {children}
    </button>
  );
}
