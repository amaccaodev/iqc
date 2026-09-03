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
  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-4">Chốt ca công nhân</h2>
      <ShiftCloseQueue stage={stage} title={title} />
    </div>
  );
}
