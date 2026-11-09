import React, { useState } from "react";
import type { Task, TaskAttachment } from "../../types/task";
import { TaskIcon } from "./TaskIcons";

interface TaskActivityAndFilesProps {
  task: Task;
  activeSubTab: "attachments" | "activity";
  onAddAttachment: (taskId: string, file: Omit<TaskAttachment, "id" | "uploadedBy" | "uploadedAt">) => void;
  onRemoveAttachment: (taskId: string, attachmentId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
}

export const TaskActivityAndFiles: React.FC<TaskActivityAndFilesProps> = ({
  task,
  activeSubTab,
  onAddAttachment,
  onRemoveAttachment,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith("image/");
    const sizeKb = Math.max(1, Math.round(file.size / 1024));

    if (isImg && file.size <= 1_500_000) {
      const reader = new FileReader();
      reader.onload = () => {
        onAddAttachment(task.id, {
          name: file.name,
          sizeKb,
          type: "image",
          dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    } else {
      onAddAttachment(task.id, {
        name: file.name,
        sizeKb,
        type: isImg ? "image" : "document",
      });
    }
    e.target.value = "";
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText("");
  };

  if (activeSubTab === "attachments") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground">
              Ảnh nghiệm thu & Tài liệu đính kèm ({task.attachments.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Hỗ trợ tải ảnh chụp hiện trường (base64) hoặc biên bản kỹ thuật PDF/Word.
            </p>
          </div>
          <label className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-primary/90 shrink-0">
            <TaskIcon name="paperclip" size={13} />
            <span>Đính kèm tệp</span>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {task.attachments.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
            Chưa có ảnh hoặc tài liệu đính kèm cho công việc này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {task.attachments.map((att) => (
              <div
                key={att.id}
                className="p-3 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-2"
              >
                {att.dataUrl && (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate" title={att.name}>
                      {att.type === "image" ? "🖼️ " : "📄 "}
                      {att.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {att.sizeKb} KB • {att.uploadedBy}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(task.id, att.id)}
                    aria-label={`Xóa tệp ${att.name}`}
                    className="w-6 h-6 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-500 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <TaskIcon name="x" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Khung bình luận */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
          <TaskIcon name="message" size={13} />
          <span>Trao đổi & Ghi chú hiện trường ({task.comments.length})</span>
        </h3>

        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            type="text"
            aria-label="Nhập nội dung bình luận"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Nhập báo cáo tiến độ, vướng mắc kỹ thuật..."
            className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shrink-0"
          >
            Gửi
          </button>
        </form>

        {task.comments.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground border border-border rounded-xl">
            Chưa có bình luận nào.
          </div>
        ) : (
          <div className="space-y-2">
            {task.comments.map((cm) => (
              <div key={cm.id} className="p-3 rounded-xl border border-border bg-muted/10 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">
                    {cm.authorName}{" "}
                    <span className="text-muted-foreground font-normal">({cm.authorRole})</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(cm.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-xs text-foreground">{cm.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lịch sử thay đổi */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
          <TaskIcon name="history" size={13} />
          <span>Nhật ký thay đổi trạng thái ({task.history.length})</span>
        </h3>

        {task.history.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground border border-border rounded-xl">
            Chưa có lịch sử cập nhật.
          </div>
        ) : (
          <div className="space-y-2">
            {task.history.map((h) => (
              <div
                key={h.id}
                className="p-2.5 rounded-lg border border-border bg-card flex flex-col gap-1 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {h.actorName} <span className="text-muted-foreground">({h.actorRole})</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(h.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  <strong className="text-primary">{h.action}</strong>
                  {h.fromValue && h.toValue ? `: ${h.fromValue} → ${h.toValue}` : ""}
                  {!h.fromValue && h.toValue ? `: ${h.toValue}` : ""}
                </div>
                {h.note && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Ghi chú: {h.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

