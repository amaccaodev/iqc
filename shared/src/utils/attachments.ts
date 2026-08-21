import type { Attachment } from "../types/index.js";

/** Ghép data URL để hiển thị / tải — không phụ thuộc cloud */
export function attachmentDataUrl(file: Attachment): string | undefined {
  if (file.contentBase64 && file.mimeType) {
    return `data:${file.mimeType};base64,${file.contentBase64}`;
  }
  if (file.contentBase64) {
    const mime =
      file.type === "image"
        ? "image/webp"
        : file.type === "pdf"
          ? "application/pdf"
          : "application/octet-stream";
    return `data:${mime};base64,${file.contentBase64}`;
  }
  return file.url;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function inferAttachmentType(mimeOrName: string): Attachment["type"] {
  const s = mimeOrName.toLowerCase();
  if (s.includes("pdf") || s.endsWith(".pdf")) return "pdf";
  if (s.includes("image") || /\.(png|jpe?g|gif|webp|bmp)$/.test(s)) return "image";
  if (s.includes("sheet") || s.includes("excel") || /\.(xlsx?|csv)$/.test(s)) return "excel";
  if (s.includes("word") || /\.(docx?)$/.test(s)) return "word";
  if (/\.(dwg|dxf|step|stp|iges)$/.test(s)) return "cad";
  return "other";
}

/** Metadata nhẹ khi list (không gửi base64) */
export function attachmentMetaOnly(file: Attachment): Attachment {
  const { contentBase64: _, ...rest } = file;
  return {
    ...rest,
    url: undefined,
  };
}

export function withAttachmentPreview(file: Attachment): Attachment {
  const url = attachmentDataUrl(file);
  return url ? { ...file, url } : file;
}
