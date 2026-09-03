import { useTheme, type ThemeMode } from "../../hooks/useTheme";

const THEMES: Array<{ id: ThemeMode; label: string; icon: string }> = [
  { id: "gold", label: "Vàng đen", icon: "fa-certificate" },
  { id: "light", label: "Sáng", icon: "fa-sun" },
  { id: "dark", label: "Tối", icon: "fa-moon" },
];

export default function ThemeSwitcher({
  variant = "full",
}: {
  variant?: "full" | "compact" | "cycle";
}) {
  const { theme, setTheme, cycleTheme } = useTheme();

  if (variant === "cycle") {
    const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className="w-10 h-10 flex items-center justify-center border border-header-foreground/30 bg-header-foreground/10 text-header-foreground cursor-pointer rounded-lg"
        aria-label={`Giao diện ${current.label}. Bấm để đổi.`}
        title={current.label}
      >
        <i className={`fas ${current.icon}`} />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-lg border-0 bg-transparent text-header-muted hover:text-header-foreground cursor-pointer"
        aria-label="Đổi giao diện"
        title={THEMES.find((t) => t.id === theme)?.label}
      >
        <i className={`fas ${THEMES.find((t) => t.id === theme)?.icon ?? "fa-certificate"}`} />
      </button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
            theme === t.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-muted border-border hover:border-primary/50"
          }`}
        >
          <i className={`fas ${t.icon} text-sm`} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
