export default function IconAction({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border cursor-pointer transition-all hover:-translate-y-px ${
        tone === "danger"
          ? "border-rose-200 bg-card text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
          : "border-border/80 bg-card text-primary hover:border-primary/40 hover:bg-secondary hover:shadow-card"
      }`}
    >
      <i className={`fas ${icon} text-sm`} />
    </button>
  );
}
