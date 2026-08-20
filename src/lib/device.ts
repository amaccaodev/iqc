import type { DeviceKind } from "@shared/types";

const DEVICE_KEY = "iqc_device_id";

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return `dev-tmp-${Date.now()}`;
  }
}

export function detectDeviceKind(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return "mobile";
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return "mobile";
  return "desktop";
}
