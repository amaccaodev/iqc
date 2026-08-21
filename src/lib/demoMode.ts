/** Chế độ demo UI — không cần backend (auth + API in-memory). */

export function isDemoMode(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === "true") return true;
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("iqc_demo") === "1") return true;
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "1" || demo === "true") {
      localStorage.setItem("iqc_demo", "1");
      return true;
    }
  } catch {
    /* private mode */
  }
  return false;
}

export function enableDemoMode(): void {
  localStorage.setItem("iqc_demo", "1");
  const url = new URL(window.location.href);
  url.searchParams.set("demo", "1");
  window.location.assign(url.toString());
}

export function disableDemoMode(): void {
  localStorage.removeItem("iqc_demo");
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  window.location.assign(url.pathname + url.search + url.hash);
}
