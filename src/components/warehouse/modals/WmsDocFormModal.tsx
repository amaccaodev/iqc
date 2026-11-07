import React, { useState } from "react";
import type {
  DocItem,
  DocumentType,
  InboundSourceInfo,
  InboundSourceType,
  Product,
  Warehouse,
  WmsDataState,
  WmsDocument,
  WmsRole,
} from "../../../types/wms";
import { getAvailableStock, logAuditAction, saveWmsData } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsDocFormModalProps {
  type: DocumentType;
  existingDoc?: WmsDocument | null;
  onClose: () => void;
  data: WmsDataState;
  currentActor: string;
  currentRole: WmsRole;
  onUpdateState: (newState: WmsDataState) => void;
}

export const WmsDocFormModal: React.FC<WmsDocFormModalProps> = ({
  type,
  existingDoc,
  onClose,
  data,
  currentActor,
  currentRole,
  onUpdateState,
}) => {
  const isEditing = Boolean(existingDoc);
  const [companyId, setCompanyId] = useState(existingDoc?.companyId || data.companies[0]?.id || "C01");

  const availableWarehouses = data.warehouses.filter(
    (w) => w.companyId === companyId && w.status === "active",
  );

  const [warehouseId, setWarehouseId] = useState(
    existingDoc?.warehouseId || availableWarehouses[0]?.id || "WH-BN-01",
  );

  const [targetWarehouseId, setTargetWarehouseId] = useState(
    existingDoc?.targetWarehouseId ||
      availableWarehouses.find((w) => w.id !== warehouseId)?.id ||
      "",
  );

  const [documentDate, setDocumentDate] = useState(
    existingDoc?.documentDate || new Date().toISOString().slice(0, 10),
  );

  // Inbound Source
  const [inboundSourceType, setInboundSourceType] = useState<InboundSourceType>(
    existingDoc?.inboundSource?.type || "purchase",
  );
  const [department, setDepartment] = useState(existingDoc?.inboundSource?.department || "Xưởng cơ khí 1");
  const [productionOrder, setProductionOrder] = useState(
    existingDoc?.inboundSource?.productionOrder || "LSX-2026-001",
  );
  const [partner, setPartner] = useState(
    existingDoc?.partner || existingDoc?.inboundSource?.party || data.suppliers[0]?.name || "",
  );
  const [purchaseOrder, setPurchaseOrder] = useState(
    existingDoc?.inboundSource?.purchaseOrder || "PO-2026-101",
  );
  const [voucherNo, setVoucherNo] = useState(
    existingDoc?.inboundSource?.voucherNo || "HD-2026-888",
  );
  const [voucherDate, setVoucherDate] = useState(
    existingDoc?.inboundSource?.voucherDate || new Date().toISOString().slice(0, 10),
  );
  const [returnReason, setReturnReason] = useState(existingDoc?.inboundSource?.returnReason || "");

  // Outbound Kind
  const [outboundKind, setOutboundKind] = useState(
    existingDoc?.kind || "Xuất cấp vật tư sản xuất",
  );
  const [reference, setReference] = useState(existingDoc?.reference || "REF-2026-001");
  const [note, setNote] = useState(existingDoc?.note || "");

  // Line items
  const [items, setItems] = useState<DocItem[]>(
    existingDoc?.items && existingDoc.items.length > 0
      ? [...existingDoc.items]
      : [
          {
            productId: data.products[0]?.id || "VT-001",
            qty: 10,
            lot: "—",
            unit: data.products[0]?.unit || "cái",
            costPrice: data.products[0]?.costPrice || 0,
          },
        ],
  );

  const [formError, setFormError] = useState("");

  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));

  // Add Item Line
  const handleAddItem = () => {
    const firstProd = data.products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || "VT-001",
        qty: 10,
        lot: "—",
        unit: firstProd?.unit || "cái",
        costPrice: firstProd?.costPrice || 0,
      },
    ]);
  };

  // Remove Line
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof DocItem, val: any) => {
    const next = [...items];
    const item = { ...next[index] };

    if (field === "productId") {
      const prod = productMap.get(val);
      item.productId = val;
      item.unit = prod?.unit || "cái";
      item.costPrice = prod?.costPrice || 0;
      item.lot = prod?.lot ? `LOT-${companyId}-01` : "—";
    } else if (field === "qty") {
      item.qty = Number(val);
    } else {
      (item as any)[field] = val;
    }

    next[index] = item;
    setItems(next);
  };

  // Calculate totals
  const totalValuation = items.reduce((sum, item) => sum + (item.costPrice || 0) * (item.qty || 0), 0);

  // Submit Handler
  const handleSubmit = (submitStatus: "draft" | "pending") => {
    setFormError("");

    if (!items.length) {
      setFormError("Vui lòng thêm ít nhất một dòng mặt hàng.");
      return;
    }

    if (items.some((it) => it.qty <= 0)) {
      setFormError("Số lượng đề xuất phải lớn hơn 0.");
      return;
    }

    // Availability validation for Outbound or Transfer
    if (type === "outbound" || type === "transfer") {
      for (const it of items) {
        const available = getAvailableStock(data.inventory, companyId, warehouseId, it.productId, it.lot);
        if (it.qty > available) {
          const prod = productMap.get(it.productId);
          setFormError(
            `Vượt tồn khả dụng tại kho xuất: ${prod?.name || it.productId} (Lô: ${it.lot}). Hiện có: ${available}, yêu cầu: ${it.qty}. Vui lòng giảm số lượng.`,
          );
          return;
        }
      }
    }

    if (type === "transfer" && warehouseId === targetWarehouseId) {
      setFormError("Kho nguồn và kho đích nhận không được trùng nhau.");
      return;
    }

    if (type === "outbound" && outboundKind === "Xuất cấp vật tư sản xuất" && !reference.trim()) {
      setFormError("Bắt buộc nhập Mã lệnh sản xuất tham chiếu khi xuất cấp vật tư.");
      return;
    }

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const now = new Date().toISOString();

    let inboundSource: InboundSourceInfo | undefined = undefined;
    if (type === "inbound") {
      inboundSource = {
        type: inboundSourceType,
        department: inboundSourceType === "production" ? department : undefined,
        productionOrder: inboundSourceType === "production" ? productionOrder : undefined,
        party: partner,
        purchaseOrder: inboundSourceType === "purchase" ? purchaseOrder : undefined,
        voucherNo: inboundSourceType === "purchase" ? voucherNo : undefined,
        voucherDate: inboundSourceType === "purchase" ? voucherDate : undefined,
        returnReason: inboundSourceType === "return" ? returnReason : undefined,
      };
    }

    if (isEditing && existingDoc) {
      const targetDoc = cloned.docs.find((d) => d.id === existingDoc.id);
      if (targetDoc) {
        targetDoc.companyId = companyId;
        targetDoc.warehouseId = warehouseId;
        targetDoc.targetWarehouseId = type === "transfer" ? targetWarehouseId : undefined;
        targetDoc.documentDate = documentDate;
        targetDoc.partner = partner;
        targetDoc.reference = reference;
        targetDoc.note = note;
        targetDoc.items = items;
        targetDoc.status = submitStatus;
        targetDoc.inboundSource = inboundSource;
        targetDoc.updatedAt = now;

        logAuditAction(cloned, `Cập nhật phiếu (${submitStatus})`, currentActor, currentRole, targetDoc.id);
      }
    } else {
      const prefix = type === "inbound" ? "IN" : type === "outbound" ? "OUT" : "TR";
      const newId = `${prefix}-${Date.now().toString().slice(-5)}`;

      const newDoc: WmsDocument = {
        id: newId,
        type,
        companyId,
        warehouseId,
        targetWarehouseId: type === "transfer" ? targetWarehouseId : undefined,
        targetCompanyId: type === "transfer" ? companyId : undefined,
        kind: type === "inbound" ? (inboundSourceType === "production" ? "Nhập kho sau sản xuất" : "Nhập mua từ NCC") : outboundKind,
        partner,
        status: submitStatus,
        createdAt: documentDate,
        documentDate,
        reference,
        creator: currentActor,
        items: items.map((it) => ({
          ...it,
          requestedQty: it.qty,
          shippedQty: 0,
          receivedQty: 0,
        })),
        posted: false,
        note,
        inboundSource,
        submissionHistory: [{ actor: currentActor, at: now }],
      };

      cloned.docs.unshift(newDoc);
      logAuditAction(cloned, `Tạo mới phiếu (${submitStatus})`, currentActor, currentRole, newId);
    }

    saveWmsData(cloned);
    onUpdateState(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {isEditing
                ? `Chỉnh sửa chứng từ [${existingDoc?.id}]`
                : type === "inbound"
                  ? "Tạo phiếu nhập kho vật tư"
                  : type === "outbound"
                    ? "Tạo phiếu xuất kho vật tư"
                    : "Lập lệnh điều chuyển kho nội bộ"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
          >
            <WmsIcon name="x" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 font-semibold flex items-center gap-2">
              <WmsIcon name="alert" size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Scope & Warehouses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/5">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Công ty quản trị <span className="text-red-500">*</span>
              </label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  const whs = data.warehouses.filter((w) => w.companyId === e.target.value);
                  if (whs[0]) setWarehouseId(whs[0].id);
                }}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {data.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                {type === "transfer" ? "Kho xuất (Nguồn)" : "Kho thực hiện"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} · {w.name}
                  </option>
                ))}
              </select>
            </div>

            {type === "transfer" && (
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Kho đích nhận <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {data.warehouses
                    .filter((w) => w.id !== warehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id} · {w.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Ngày chứng từ
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 2: Inbound Source Fields */}
          {type === "inbound" && (
            <div className="p-3.5 rounded-xl border border-border bg-muted/5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nguồn nhập kho:
                </span>
                {(
                  [
                    ["purchase", "Mua từ NCC"],
                    ["production", "Sản xuất nội bộ"],
                    ["return", "Khách trả lại"],
                    ["external", "Nguồn khác"],
                  ] as const
                ).map(([srcKey, label]) => (
                  <button
                    key={srcKey}
                    type="button"
                    onClick={() => setInboundSourceType(srcKey)}
                    className={`h-7 px-2.5 rounded text-xs font-semibold transition-all ${
                      inboundSourceType === srcKey
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background hover:bg-surface-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {inboundSourceType === "purchase" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Nhà cung cấp
                    </label>
                    <input
                      type="text"
                      value={partner}
                      onChange={(e) => setPartner(e.target.value)}
                      placeholder="Tên NCC..."
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Số đơn mua hàng (PO)
                    </label>
                    <input
                      type="text"
                      value={purchaseOrder}
                      onChange={(e) => setPurchaseOrder(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Số hóa đơn / Vận đơn
                    </label>
                    <input
                      type="text"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Ngày hóa đơn
                    </label>
                    <input
                      type="date"
                      value={voucherDate}
                      onChange={(e) => setVoucherDate(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {inboundSourceType === "production" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Phân xưởng sản xuất bàn giao
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Lệnh sản xuất tham chiếu (LSX)
                    </label>
                    <input
                      type="text"
                      value={productionOrder}
                      onChange={(e) => setProductionOrder(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {inboundSourceType === "return" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Khách hàng trả lại
                    </label>
                    <input
                      type="text"
                      value={partner}
                      onChange={(e) => setPartner(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Lý do trả hàng
                    </label>
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Lỗi kỹ thuật, sai quy cách..."
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Outbound Kind Fields */}
          {type === "outbound" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/5">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Mục đích xuất kho
                </label>
                <select
                  value={outboundKind}
                  onChange={(e) => setOutboundKind(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Xuất cấp vật tư sản xuất">Xuất cấp vật tư sản xuất</option>
                  <option value="Xuất hàng ra bên ngoài">Xuất bán hàng ra bên ngoài</option>
                  <option value="Xuất hủy / hao hụt">Xuất xử lý hao hụt</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Đơn vị / Khách hàng nhận
                </label>
                <input
                  type="text"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder="Xưởng cơ khí hoặc Khách hàng..."
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Số lệnh SX / Đơn hàng tham chiếu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="LSX-..."
                  required
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Section 3: Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Danh mục vật tư / hàng hóa
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-primary/90"
              >
                <WmsIcon name="plus" size={13} />
                <span>Thêm dòng</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const prod = productMap.get(item.productId);
                const available =
                  type === "outbound" || type === "transfer"
                    ? getAvailableStock(data.inventory, companyId, warehouseId, item.productId, item.lot)
                    : null;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border bg-card flex flex-wrap items-center gap-2.5"
                  >
                    {/* Product Select */}
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                        Mặt hàng
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                        className="w-full h-7 px-2 text-xs rounded border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {data.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} · {p.name} ({p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lot input */}
                    <div className="w-28">
                      <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                        Số lô
                      </label>
                      <input
                        type="text"
                        value={item.lot || "—"}
                        onChange={(e) => handleItemChange(index, "lot", e.target.value)}
                        className="w-full h-7 px-2 text-xs rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step="any"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                        className="w-full h-7 px-2 text-xs text-right font-mono font-bold rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Available Stock Indicator for Outbound */}
                    {available !== null && (
                      <div className="w-24 text-right">
                        <span className="block text-[10px] text-muted-foreground">Tồn khả dụng</span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.qty > available ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {available} {prod?.unit}
                        </span>
                      </div>
                    )}

                    {/* Cost Valuation */}
                    <div className="w-28 text-right">
                      <span className="block text-[10px] text-muted-foreground">Đơn giá vốn</span>
                      <span className="font-mono text-xs font-semibold">
                        {(item.costPrice || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    {/* Delete line */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="w-7 h-7 rounded border border-border flex items-center justify-center text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <WmsIcon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Line items summary */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs font-semibold">
              <span>{items.length} mặt hàng đề xuất</span>
              <span>
                Tổng giá trị định mức:{" "}
                <strong className="text-primary font-bold">
                  {totalValuation.toLocaleString("vi-VN")} đ
                </strong>
              </span>
            </div>
          </div>

          {/* Section 4: Note */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Ghi chú nghiệp vụ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập diễn giải lý do hoặc chỉ dẫn vận chuyển..."
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-md border border-border text-xs font-semibold hover:bg-muted/10"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              className="h-8 px-3.5 rounded-md border border-border bg-card text-xs font-semibold hover:bg-surface-2"
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("pending")}
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
            >
              Gửi phê duyệt ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

