import { useTheme, type ThemeMode } from "../../hooks/useTheme";

const THEMES: Array<{ id: ThemeMode; label: string; icon: string; swatch: string }> = [
  { id: "light", label: "Sáng", icon: "fa-sun", swatch: "from-indigo-500 to-sky-400" },
  { id: "dark", label: "Tối", icon: "fa-moon", swatch: "from-slate-900 to-indigo-700" },
  { id: "gold", label: "Vàng đen", icon: "fa-crown", swatch: "from-neutral-950 to-amber-500" },
];

export default function ThemeSwitcher({
  variant = "full",
}: {
  variant?: "full" | "compact" | "cycle";
}) {
  const { theme, setTheme, cycleTheme } = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  if (variant === "cycle") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className="group w-10 h-10 flex items-center justify-center rounded-xl border border-border/70 glass text-foreground shadow-card cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        aria-label={`Giao diện ${current.label}. Bấm để đổi.`}
        title={current.label}
      >
        <i className={`fas ${current.icon} transition-transform duration-300 group-hover:rotate-12`} />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className="group w-9 h-9 flex items-center justify-center rounded-xl border-0 bg-transparent text-header-muted hover:text-header-foreground hover:bg-surface/80 cursor-pointer transition-colors"
        aria-label="Đổi giao diện"
        title={current.label}
      >
        <i className={`fas ${current.icon} transition-transform duration-300 group-hover:rotate-12`} />
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-2xl text-xs font-semibold border cursor-pointer transition-all ${
              active
                ? "border-primary bg-secondary text-secondary-foreground shadow-brand"
                : "bg-surface text-muted border-border hover:border-primary/50 hover:-translate-y-0.5"
            }`}
          >
            <span
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.swatch} flex items-center justify-center text-white shadow-md`}
            >
              <i className={`fas ${t.icon} text-sm`} />
            </span>
            {t.label}
            {active ? (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <i className="fas fa-check text-[8px]" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
