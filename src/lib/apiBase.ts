/** API base URL — `/api` khi cùng domain (local, Vercel); URL đầy đủ trên GitHub Pages */
const GITHUB_PAGES_API = "https://iqc-api-amaccaodev.onrender.com/api";

function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined") return "/api";

  const { hostname } = window.location;
  // Vercel hoặc custom domain — API cùng origin
  if (hostname.endsWith(".vercel.app") || hostname === "localhost" || hostname === "127.0.0.1") {
    return "/api";
  }
  // GitHub Pages — backend riêng (Render)
  if (hostname.endsWith("github.io")) {
    return GITHUB_PAGES_API;
  }
  return "/api";
}

export const API_BASE = resolveApiBase();
