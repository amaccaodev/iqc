import type { ReactNode } from "react";

/** One surface panel — distinct from page background, no inner frames. */
export default function Card({ children, cls }: { children: ReactNode; cls?: string }) {
  return (
    <div className={`panel text-card-foreground ${cls ?? ""}`}>{children}</div>
  );
}
