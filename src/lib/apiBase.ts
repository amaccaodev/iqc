/** API base URL — `/api` local; URL đầy đủ khi frontend tách backend (GitHub Pages) */
const PRODUCTION_API = "https://iqc-api-amaccaodev.onrender.com/api";

function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
    return PRODUCTION_API;
  }
  return "/api";
}

export const API_BASE = resolveApiBase();
