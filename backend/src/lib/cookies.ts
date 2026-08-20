import type { IncomingMessage, ServerResponse } from "node:http";

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const key = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function clientIp(req: IncomingMessage): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "";
}

export function setCookie(
  res: ServerResponse,
  name: string,
  value: string,
  opts: {
    maxAgeMs: number;
    httpOnly?: boolean;
    path?: string;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean;
  },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path ?? "/"}`,
    `Max-Age=${Math.floor(opts.maxAgeMs / 1000)}`,
    `SameSite=${opts.sameSite ?? "Lax"}`,
  ];
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  res.setHeader("Set-Cookie", [...existingSetCookie(res), parts.join("; ")]);
}

export function clearCookie(res: ServerResponse, name: string) {
  res.setHeader("Set-Cookie", [
    ...existingSetCookie(res),
    `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`,
  ]);
}

function existingSetCookie(res: ServerResponse): string[] {
  const raw = res.getHeader("Set-Cookie");
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}
