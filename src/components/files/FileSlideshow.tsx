import { useEffect, useMemo, useRef, useState } from "react";
import type { Attachment } from "@shared/types";
import { attachmentDataUrl } from "@shared/utils/attachments";

interface FileSlideshowProps {
  files: Attachment[];
  title?: string;
  className?: string;
}

function isViewable(file: Attachment): boolean {
  return file.type === "image" || file.type === "pdf";
}

function viewSrc(file: Attachment): string | undefined {
  return attachmentDataUrl(file);
}

export default function FileSlideshow({ files, title = "Tài liệu đính kèm", className = "" }: FileSlideshowProps) {
  const viewable = useMemo(() => files.filter(isViewable), [files]);
  const others = useMemo(() => files.filter((f) => !isViewable(f)), [files]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const current = viewable[index];
  const currentSrc = current ? viewSrc(current) : undefined;

  const go = (dir: number) => {
    if (viewable.length === 0) return;
    setIndex((i) => (i + dir + viewable.length) % viewable.length);
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  if (files.length === 0) {
    return (
      <div className={`h-36 bg-surface rounded-xl flex items-center justify-center text-muted-foreground text-sm ${className}`}>
        <div className="text-center">
          <i className="fas fa-paperclip text-2xl block mb-2 opacity-40" />
          Chưa có tài liệu đính kèm
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-muted">{title}</div>
        {viewable.length > 1 && (
          <div className="text-[11px] text-muted-foreground">
            {index + 1} / {viewable.length}
          </div>
        )}
      </div>

      {viewable.length > 0 && (
        <div className="relative">
          <div
            ref={scroller}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin"
            style={{ scrollbarWidth: "none" }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / Math.max(el.clientWidth * 0.85, 1));
              if (i !== index && i >= 0 && i < viewable.length) setIndex(i);
            }}
          >
            {viewable.map((file, i) => {
              const src = viewSrc(file);
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setOpen(true);
                  }}
                  className="snap-center flex-shrink-0 w-[92%] sm:w-[320px] h-52 sm:h-48 rounded-xl overflow-hidden border border-border bg-[#0F172A] relative cursor-pointer touch-pan-x"
                >
                  {file.type === "image" && src ? (
                    <img src={src} alt={file.name} className="w-full h-full object-contain bg-[#0F172A]" />
                  ) : file.type === "pdf" && src ? (
                    <iframe
                      src={`${src}#toolbar=0&navpanes=0`}
                      title={file.name}
                      className="w-full h-full bg-card pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/80">
                      <i className={`fas ${file.type === "pdf" ? "fa-file-pdf" : "fa-image"} text-4xl mb-2`} />
                      <span className="text-xs px-3 text-center">{file.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-left">
                    <div className="text-white text-xs font-medium truncate">{file.name}</div>
                    <div className="text-white/70 text-[10px]">
                      {file.type === "pdf" ? "PDF" : "Hình ảnh"} · bấm để xem
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {viewable.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow border-0 cursor-pointer"
                aria-label="Ảnh trước"
              >
                <i className="fas fa-chevron-left text-sm text-primary" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow border-0 cursor-pointer"
                aria-label="Ảnh sau"
              >
                <i className="fas fa-chevron-right text-sm text-primary" />
              </button>
              <div className="flex justify-center gap-1.5 mt-1">
                {viewable.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full border-0 cursor-pointer ${i === index ? "w-5 bg-primary" : "w-1.5 bg-[#CBD5E1]"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {others.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs text-muted bg-surface rounded-lg px-3 py-2">
              <i className="fas fa-file" />
              <span className="truncate">{a.name}</span>
              <span className="text-muted-foreground">{a.size}</span>
            </div>
          ))}
        </div>
      )}

      {open && current && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col" onClick={() => setOpen(false)}>
          <div className="flex items-center justify-between text-white px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{current.name}</div>
              <div className="text-xs text-white/60">
                {index + 1}/{viewable.length} · {current.size} · {current.uploadedBy}
              </div>
            </div>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/10 border-0 text-white cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <i className="fas fa-xmark" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-6 relative" onClick={(e) => e.stopPropagation()}>
            {viewable.length > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 w-10 h-10 rounded-full bg-white/15 text-white border-0 cursor-pointer"
              >
                <i className="fas fa-chevron-left" />
              </button>
            )}
            {current.type === "image" && currentSrc ? (
              <img src={currentSrc} alt={current.name} className="max-h-full max-w-full object-contain" />
            ) : current.type === "pdf" && currentSrc ? (
              <iframe src={currentSrc} title={current.name} className="w-full max-w-4xl h-[80vh] bg-card rounded" />
            ) : null}
            {viewable.length > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 w-10 h-10 rounded-full bg-white/15 text-white border-0 cursor-pointer"
              >
                <i className="fas fa-chevron-right" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
