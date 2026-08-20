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
      className={`bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none ${className}`}
    >
      {label}
    </span>
  );
}
