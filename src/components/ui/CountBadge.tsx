/** Badge số lượng — dùng trên nav, tab, icon thông báo */
export default function CountBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={`bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none tabular-nums shadow-[0_2px_8px_-2px_rgba(225,29,72,0.6)] ${className}`}
    >
      {label}
    </span>
  );
}
