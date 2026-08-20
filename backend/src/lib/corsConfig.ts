import type { CorsOptions } from "cors";

/** Origins được phép gọi API (GitHub Pages + local dev) */
export function getCorsOptions(): CorsOptions {
  const allowed = new Set([
    "https://amaccaodev.github.io",
    "http://localhost:8443",
    "http://127.0.0.1:8443",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  for (const o of (process.env.CORS_ORIGIN ?? "").split(",")) {
    const t = o.trim();
    if (t) allowed.add(t);
  }

  return {
    origin(origin, callback) {
      // Postman / health check — không có Origin
      if (!origin) return callback(null, true);
      if (allowed.has(origin)) return callback(null, true);
      // Preview Figma / branch deploy khác
      if (origin.endsWith(".github.io")) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  };
}
