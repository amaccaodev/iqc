import ShiftCloseQueue from "../../components/salary/ShiftCloseQueue";

export default function ShiftApprovalsPage({
  stage,
}: {
  stage: "teamlead" | "qc" | "supervisor";
}) {
  const title =
    stage === "teamlead" ? "Tổ trưởng kiểm tra chốt ca" : stage === "qc" ? "QC chốt ca" : "Quản đốc chốt ca / lương";
  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-4">Chốt ca</h2>
      <ShiftCloseQueue stage={stage} title={title} />
    </div>
  );
}
