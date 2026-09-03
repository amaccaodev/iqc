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
      className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border cursor-pointer ${
        tone === "danger"
          ? "border-red-200 bg-card text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          : "border-border bg-card text-primary hover:border-primary hover:bg-secondary"
      }`}
    >
      <i className={`fas ${icon} text-sm`} />
    </button>
  );
}
