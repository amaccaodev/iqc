import { useRef, useState } from "react";
import type { Attachment } from "@shared/types";
import { attachmentDataUrl } from "@shared/utils/attachments";
import { fileToAttachment } from "../../utils/fileToAttachment";
import FileSlideshow from "./FileSlideshow";
import { Btn } from "../ui";

type Props = {
  files: Attachment[];
  uploadedBy: string;
  kind?: Attachment["kind"];
  title?: string;
  onUploaded: (att: Omit<Attachment, "id">) => Promise<void> | void;
  onRemove?: (attId: string) => Promise<void> | void;
};

/** Upload nhiều bản vẽ/thông số → base64/webp local (không cloud) */
export default function AttachmentUploader({
  files,
  uploadedBy,
  kind = "drawing",
  title = "Bản vẽ & thông số",
  onUploaded,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(list)) {
        const att = await fileToAttachment(file, { uploadedBy, kind });
        await onUploaded(att);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <FileSlideshow files={files} title={title} />
      <div className="flex flex-wrap items-center gap-2">
        <Btn
          size="sm"
          cls={busy ? "opacity-50 pointer-events-none" : ""}
          onClick={() => inputRef.current?.click()}
        >
          <i className={`fas ${busy ? "fa-spinner fa-spin" : "fa-upload"}`} />
          {busy ? "Đang mã hóa…" : "Thêm file (WebP/Base64)"}
        </Btn>
        <span className="text-[11px] text-muted-foreground">Ảnh → WebP; PDF/Excel → Base64. Lưu DB, không cloud.</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.dwg,.dxf"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      {onRemove && files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-xs text-muted">
              <i className="fas fa-paperclip text-muted-foreground" />
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-muted-foreground">{f.size}</span>
              {attachmentDataUrl(f) ? (
                <a
                  className="text-[#2D6EBD]"
                  href={attachmentDataUrl(f)}
                  download={f.name}
                >
                  Tải
                </a>
              ) : null}
              <button
                type="button"
                className="text-red-600 border-0 bg-transparent cursor-pointer"
                onClick={() => void onRemove(f.id)}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
