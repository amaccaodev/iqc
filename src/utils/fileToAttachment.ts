import type { Attachment } from "@shared/types";
import {
  formatByteSize,
  inferAttachmentType,
} from "@shared/utils/attachments";

const MAX_BYTES = 2.5 * 1024 * 1024; // ~2.5MB sau encode

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

function splitDataUrl(dataUrl: string): { mimeType: string; contentBase64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Định dạng data URL không hợp lệ");
  return { mimeType: m[1], contentBase64: m[2] };
}

/** Ảnh → WebP base64 (canvas). File khác giữ nguyên base64. */
async function encodeImageToWebp(file: File, quality = 0.82): Promise<{ mimeType: string; contentBase64: string; name: string }> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/webp", quality);
  if (!dataUrl.startsWith("data:image/webp")) {
    // Browser không hỗ trợ webp encode → giữ jpeg
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    const parts = splitDataUrl(jpeg);
    return {
      ...parts,
      name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    };
  }
  const parts = splitDataUrl(dataUrl);
  return {
    ...parts,
    name: file.name.replace(/\.[^.]+$/, "") + ".webp",
  };
}

export type FileToAttachmentOpts = {
  uploadedBy: string;
  kind?: Attachment["kind"];
  /** Ép convert ảnh sang webp (mặc định true) */
  preferWebp?: boolean;
};

/**
 * Đọc file local → Attachment có contentBase64 (không upload cloud).
 * Ảnh được nén WebP khi trình duyệt hỗ trợ.
 */
export async function fileToAttachment(
  file: File,
  opts: FileToAttachmentOpts,
): Promise<Omit<Attachment, "id">> {
  if (file.size > MAX_BYTES * 1.4) {
    throw new Error(`File quá lớn (>${formatByteSize(MAX_BYTES)}). Hãy nén hoặc chọn ảnh nhỏ hơn.`);
  }

  const preferWebp = opts.preferWebp !== false;
  const isImage = file.type.startsWith("image/");

  let mimeType: string;
  let contentBase64: string;
  let name = file.name;

  if (isImage && preferWebp) {
    const enc = await encodeImageToWebp(file);
    mimeType = enc.mimeType;
    contentBase64 = enc.contentBase64;
    name = enc.name;
  } else {
    const dataUrl = await readAsDataUrl(file);
    const parts = splitDataUrl(dataUrl);
    mimeType = parts.mimeType || file.type || "application/octet-stream";
    contentBase64 = parts.contentBase64;
  }

  const approxBytes = Math.ceil((contentBase64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    throw new Error(`Nội dung sau mã hóa vẫn quá lớn (${formatByteSize(approxBytes)}).`);
  }

  const type = inferAttachmentType(mimeType || name);
  return {
    name,
    type,
    size: formatByteSize(approxBytes),
    uploadedBy: opts.uploadedBy,
    uploadedAt: new Date().toLocaleDateString("vi-VN"),
    mimeType,
    contentBase64,
    kind: opts.kind ?? (type === "image" || type === "pdf" || type === "cad" ? "drawing" : "tech_spec"),
  };
}
