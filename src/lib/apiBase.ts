/** API base URL — `/api` locally, full URL when frontend deploy tách backend */
export const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";
