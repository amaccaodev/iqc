import ShiftCloseQueue from "../../components/salary/ShiftCloseQueue";

export default function ShiftApprovalsPage({
  stage,
}: {
  stage: "teamlead" | "qc" | "supervisor";
}) {
  const title =
    stage === "teamlead"
      ? "Chốt ca công nhân chờ kiểm tra"
      : stage === "qc"
        ? "Chốt ca chờ QC"
        : "Chốt ca / lương chờ Quản đốc";
  const subtitle =
    stage === "teamlead"
      ? "Xem phiếu chốt ca CN gửi lên — xác nhận đúng hoặc từ chối; duyệt mở khóa để CN đo tiếp."
      : stage === "qc"
        ? "Kiểm tra phiếu đã qua tổ trưởng."
        : "Duyệt cuối để chốt lương.";

  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-1">Chốt ca công nhân</h2>
      <p className="text-sm text-muted mb-4">{subtitle}</p>
      <ShiftCloseQueue stage={stage} title={title} />
    </div>
  );
}
