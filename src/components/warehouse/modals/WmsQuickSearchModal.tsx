import React, { useEffect, useState } from "react";
import type { WmsDataState, WmsDocument } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WmsDataState;
  onOpenDoc: (doc: WmsDocument) => void;
  onNavigateTab: (tab: any) => void;
}

export const WmsQuickSearchModal: React.FC<WmsQuickSearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenDoc,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingProducts = q
    ? data.products
        .filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        )
        .slice(0, 5)
    : [];

  const matchingDocs = q
    ? data.docs
        .filter(
          (d) =>
            d.id.toLowerCase().includes(q) ||
            (d.partner || "").toLowerCase().includes(q) ||
            (d.reference || "").toLowerCase().includes(q),
        )
        .slice(0, 5)
    : [];

  const matchingWarehouses = q
    ? data.warehouses
        .filter(
          (w) =>
            w.id.toLowerCase().includes(q) ||
            w.name.toLowerCase().includes(q) ||
            w.location.toLowerCase().includes(q),
        )
        .slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
        <div className="p-3.5 border-b border-border flex items-center gap-2.5">
          <WmsIcon name="search" size={18} className="text-muted-foreground ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Tìm nhanh mặt hàng, mã phiếu, kho, số PO/LSX..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted/20 border border-border rounded font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto space-y-4 text-xs">
          {!q ? (
            <div className="py-8 text-center text-muted-foreground">
              Nhập từ khóa để tìm kiếm nhanh trong toàn bộ hệ thống WMS...
            </div>
          ) : (
            <>
              {/* Products */}
              {matchingProducts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 px-2">
                    Mặt hàng & Vật tư
                  </div>
                  <div className="space-y-1">
                    {matchingProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigateTab("products");
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-muted/15 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.id} · {p.category}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-primary">Xem danh mục →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {matchingDocs.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 px-2">
                    Chứng từ & Phiếu kho
                  </div>
                  <div className="space-y-1">
                    {matchingDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          onOpenDoc(doc);
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-muted/15 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-primary">{doc.id}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {doc.kind || doc.type} · {doc.partner || "—"} ({doc.createdAt})
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-foreground px-2 py-0.5 rounded bg-muted/20 border border-border">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouses */}
              {matchingWarehouses.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 px-2">
                    Kho lưu trữ
                  </div>
                  <div className="space-y-1">
                    {matchingWarehouses.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          onNavigateTab("warehouses");
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-muted/15 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{w.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {w.id} · {w.location}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-primary">Chi tiết →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchingProducts.length === 0 &&
                matchingDocs.length === 0 &&
                matchingWarehouses.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    Không tìm thấy kết quả nào khớp với "{query}".
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

