import React, { useEffect, useState } from "react";
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskRecurrence,
  TaskWorkshop,
} from "../../types/task";
import type { StaffMember } from "../../services/taskSeedDataA";
import { TaskIcon } from "./TaskIcons";

export interface TaskFormSubmitPayload {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  workshop: TaskWorkshop;
  line: string;
  assigneeId: string;
  dueDate: string;
  estimatedHours: number;
  orderCode?: string;
  orderName?: string;
  machineCode?: string;
  machineName?: string;
  warehouseCode?: string;
  warehouseName?: string;
  recurrence: TaskRecurrence;
  recurrenceLabel?: string;
  checklistLines: string[];
}

interface TaskFormProps {
  isOpen: boolean;
  editingTask: Task | null;
  staffList: StaffMember[];
  workshops: TaskWorkshop[];
  categories: TaskCategory[];
  nextTaskCode: string;
  onClose: () => void;
  onSave: (payload: TaskFormSubmitPayload) => void;
}

const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  none: "Không lặp lại",
  daily_shift: "Hằng ngày (Đầu ca)",
  weekly: "Hằng tuần",
  monthly: "Hằng tháng",
};

const defaultDueTomorrow = () => {
  const d = new Date(Date.now() + 24 * 3600_000);
  d.setHours(17, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`;
};

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  editingTask,
  staffList,
  workshops,
  categories,
  nextTaskCode,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Vận hành" as TaskCategory,
    priority: "high" as TaskPriority,
    workshop: "Xưởng Cơ khí 1" as TaskWorkshop,
    line: "Dây chuyền CNC-A",
    assigneeId: "u6",
    dueDate: defaultDueTomorrow(),
    estimatedHours: "4",
    orderCode: "LX-2026-088",
    machineCode: "CNC-01",
    warehouseCode: "",
    recurrence: "none" as TaskRecurrence,
    checklistRaw: "Kiểm tra thông số an toàn thiết bị đầu ca\nThực hiện gia công / kiểm tra theo quy trình\nNghiệm thu và bàn giao cuối ca",
  });

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        priority: editingTask.priority,
        workshop: editingTask.workshop,
        line: editingTask.line || "",
        assigneeId: editingTask.assigneeId,
        dueDate: editingTask.dueDate.slice(0, 16),
        estimatedHours: String(editingTask.estimatedHours),
        orderCode: editingTask.orderCode || "",
        machineCode: editingTask.machineCode || "",
        warehouseCode: editingTask.warehouseCode || "",
        recurrence: editingTask.recurrence,
        checklistRaw: editingTask.checklist.map((c) => c.title).join("\n"),
      });
    } else {
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        dueDate: defaultDueTomorrow(),
      }));
    }
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const update = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;

    const lines = form.checklistRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      title: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      category: form.category,
      priority: form.priority,
      workshop: form.workshop,
      line: form.line.trim(),
      assigneeId: form.assigneeId,
      dueDate: form.dueDate,
      estimatedHours: Number(form.estimatedHours) || 2,
      orderCode: form.orderCode.trim() || undefined,
      machineCode: form.machineCode.trim() || undefined,
      warehouseCode: form.warehouseCode.trim() || undefined,
      recurrence: form.recurrence,
      recurrenceLabel: form.recurrence !== "none" ? RECURRENCE_LABELS[form.recurrence] : undefined,
      checklistLines: lines,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/10 flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] font-black text-primary">
              {editingTask ? editingTask.code : nextTaskCode}
            </span>
            <h3 id="task-form-title" className="text-sm font-bold text-foreground">
              {editingTask ? "Chỉnh sửa / Giao lại / Đổi hạn công việc" : "Giao công việc mới"}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng biểu mẫu" className="w-7 h-7 rounded hover:bg-muted/20 flex items-center justify-center text-muted-foreground cursor-pointer">
            <TaskIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs max-h-[82vh] overflow-y-auto">
          <div>
            <label htmlFor="tf-title" className="block text-[11px] font-bold text-muted-foreground mb-1">
              Tiêu đề công việc <span className="text-red-500">*</span>
            </label>
            <input id="tf-title" type="text" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="VD: Kiểm tra máy đầu ca & gia công đợt 3 lệnh LX-2026-088..." className="w-full h-8 px-3 rounded-lg border border-border bg-background text-foreground" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="tf-category" className="block text-[11px] font-bold text-muted-foreground mb-1">Loại việc</label>
              <select id="tf-category" value={form.category} onChange={(e) => update("category", e.target.value as TaskCategory)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="tf-priority" className="block text-[11px] font-bold text-muted-foreground mb-1">Mức ưu tiên</label>
              <select id="tf-priority" value={form.priority} onChange={(e) => update("priority", e.target.value as TaskPriority)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground">
                <option value="low">▽ Thấp</option>
                <option value="medium">◇ Trung bình</option>
                <option value="high">△ Cao</option>
                <option value="urgent">⚡ Khẩn cấp</option>
              </select>
            </div>
            <div>
              <label htmlFor="tf-recurrence" className="block text-[11px] font-bold text-muted-foreground mb-1">Lặp lại theo lịch</label>
              <select id="tf-recurrence" value={form.recurrence} onChange={(e) => update("recurrence", e.target.value as TaskRecurrence)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground">
                <option value="none">Không lặp lại</option>
                <option value="daily_shift">Hằng ngày (Đầu ca)</option>
                <option value="weekly">Hằng tuần</option>
                <option value="monthly">Hằng tháng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="tf-assignee" className="block text-[11px] font-bold text-muted-foreground mb-1">Người phụ trách (Nhận việc) <span className="text-red-500">*</span></label>
              <select id="tf-assignee" value={form.assigneeId} onChange={(e) => update("assigneeId", e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground font-semibold">
                {staffList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="tf-duedate" className="block text-[11px] font-bold text-muted-foreground mb-1">Hạn hoàn thành <span className="text-red-500">*</span></label>
              <input id="tf-duedate" type="datetime-local" required value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="tf-workshop" className="block text-[11px] font-bold text-muted-foreground mb-1">Xưởng / Bộ phận</label>
              <select id="tf-workshop" value={form.workshop} onChange={(e) => update("workshop", e.target.value as TaskWorkshop)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground">
                {workshops.map((w) => (<option key={w} value={w}>{w}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="tf-line" className="block text-[11px] font-bold text-muted-foreground mb-1">Dây chuyền / Tổ</label>
              <input id="tf-line" type="text" value={form.line} onChange={(e) => update("line", e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground" />
            </div>
            <div>
              <label htmlFor="tf-esthours" className="block text-[11px] font-bold text-muted-foreground mb-1">Giờ ước tính (h)</label>
              <input id="tf-esthours" type="number" step="0.5" min="0.5" value={form.estimatedHours} onChange={(e) => update("estimatedHours", e.target.value)} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-lg border border-border bg-muted/10">
            <div>
              <label htmlFor="tf-order" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Liên kết Lệnh SX</label>
              <input id="tf-order" type="text" value={form.orderCode} onChange={(e) => update("orderCode", e.target.value)} placeholder="VD: LX-2026-088" className="w-full h-7 px-2 rounded border border-border bg-background font-mono text-foreground" />
            </div>
            <div>
              <label htmlFor="tf-machine" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Liên kết Máy móc</label>
              <input id="tf-machine" type="text" value={form.machineCode} onChange={(e) => update("machineCode", e.target.value)} placeholder="VD: CNC-01, DAP-01" className="w-full h-7 px-2 rounded border border-border bg-background font-mono text-foreground" />
            </div>
            <div>
              <label htmlFor="tf-warehouse" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Liên kết Kho</label>
              <input id="tf-warehouse" type="text" value={form.warehouseCode} onChange={(e) => update("warehouseCode", e.target.value)} placeholder="VD: KHO-NVL-01" className="w-full h-7 px-2 rounded border border-border bg-background font-mono text-foreground" />
            </div>
          </div>

          <div>
            <label htmlFor="tf-desc" className="block text-[11px] font-bold text-muted-foreground mb-1">Mô tả yêu cầu kỹ thuật</label>
            <textarea id="tf-desc" rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Ghi chú thông số vận hành, tiêu chuẩn nghiệm thu..." className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground" />
          </div>

          {!editingTask && (
            <div>
              <label htmlFor="tf-checklist" className="block text-[11px] font-bold text-muted-foreground mb-1">Checklist việc con (mỗi dòng 1 đầu việc)</label>
              <textarea id="tf-checklist" rows={3} value={form.checklistRaw} onChange={(e) => update("checklistRaw", e.target.value)} className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground" />
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-8 px-3.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted/15 cursor-pointer">Hủy</button>
            <button type="submit" className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer">
              {editingTask ? "Lưu cập nhật & Thông báo" : "Giao việc ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
