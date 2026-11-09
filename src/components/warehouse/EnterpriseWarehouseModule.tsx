import React, { useEffect, useMemo, useState } from "react";
import type {
  Company,
  DocumentType,
  Product,
  Supplier,
  Warehouse,
  WmsDataState,
  WmsDocument,
  WmsRole,
} from "../../types/wms";
import {
  addWmsTestData,
  loadWmsData,
  logAuditAction,
  resetWmsDemoData,
  saveWmsData,
} from "../../services/wmsStorage";
import { WmsHeader } from "./WmsHeader";
import { WmsNav, type WmsNavTab } from "./WmsNav";

// Views
import { WmsOverviewView } from "./views/WmsOverviewView";
import { WmsWarehousesView } from "./views/WmsWarehousesView";
import { WmsProductsView } from "./views/WmsProductsView";
import { WmsSuppliersView } from "./views/WmsSuppliersView";
import { WmsInventoryView } from "./views/WmsInventoryView";
import { WmsInboundView } from "./views/WmsInboundView";
import { WmsOutboundView } from "./views/WmsOutboundView";
import { WmsTransferView } from "./views/WmsTransferView";
import { WmsCountView } from "./views/WmsCountView";
import { WmsApprovalsView } from "./views/WmsApprovalsView";
import { WmsReportsView } from "./views/WmsReportsView";
import { WmsSettingsView } from "./views/WmsSettingsView";

// Modals
import { WmsDocumentDetailModal } from "./modals/WmsDocumentDetailModal";
import { WmsDocFormModal } from "./modals/WmsDocFormModal";
import { WmsInventoryCountModal } from "./modals/WmsInventoryCountModal";
import { WmsQuickSearchModal } from "./modals/WmsQuickSearchModal";

interface EnterpriseWarehouseModuleProps {
  actorName?: string;
  readOnly?: boolean;
}

export const EnterpriseWarehouseModule: React.FC<EnterpriseWarehouseModuleProps> = ({
  actorName = "Nguyễn An",
}) => {
  const [data, setData] = useState<WmsDataState>(() => loadWmsData());

  // Scope state
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<WmsNavTab>("overview");

  // Modals state
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<WmsDocument | null>(null);
  const [formDocType, setFormDocType] = useState<DocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<WmsDocument | null>(null);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Available plants based on selected company
  const availablePlants = useMemo(() => {
    if (selectedCompany === "all") {
      return Array.from(new Set(data.companies.flatMap((c) => c.plants)));
    }
    const comp = data.companies.find((c) => c.id === selectedCompany);
    return comp ? comp.plants : [];
  }, [data.companies, selectedCompany]);

  // Scoped Warehouses
  const scopedWarehouses = useMemo(() => {
    return data.warehouses.filter((wh) => {
      if (selectedCompany !== "all" && wh.companyId !== selectedCompany) return false;
      if (selectedPlant !== "all" && wh.plant !== selectedPlant) return false;
      return true;
    });
  }, [data.warehouses, selectedCompany, selectedPlant]);

  const scopedWarehouseIds = useMemo(
    () => new Set(scopedWarehouses.map((w) => w.id)),
    [scopedWarehouses],
  );

  // Scoped Inventory
  const scopedInventory = useMemo(() => {
    return data.inventory.filter((inv) => {
      if (selectedCompany !== "all" && inv.companyId !== selectedCompany) return false;
      return scopedWarehouseIds.has(inv.warehouseId);
    });
  }, [data.inventory, selectedCompany, scopedWarehouseIds]);

  // Scoped Documents
  const scopedDocs = useMemo(() => {
    return data.docs.filter((doc) => {
      if (selectedCompany !== "all" && doc.companyId !== selectedCompany) return false;
      if (
        scopedWarehouseIds.has(doc.warehouseId) ||
        (doc.targetWarehouseId && scopedWarehouseIds.has(doc.targetWarehouseId))
      ) {
        return true;
      }
      return false;
    });
  }, [data.docs, selectedCompany, scopedWarehouseIds]);

  // Pending Approvals count for scope
  const pendingApprovalsCount = useMemo(() => {
    return scopedDocs.filter((d) => d.status === "pending").length;
  }, [scopedDocs]);

  // Handlers
  const handleRoleChange = (role: WmsRole) => {
    const updated: WmsDataState = { ...data, role };
    setData(updated);
    saveWmsData(updated);
  };

  const handleAddTestData = () => {
    const nextState = addWmsTestData(data, actorName);
    setData(nextState);
  };

  const handleResetData = () => {
    if (confirm("Khôi phục toàn bộ dữ liệu WMS về trạng thái gốc ban đầu?")) {
      const initial = resetWmsDemoData();
      setData(initial);
    }
  };

  const handleSaveWarehouse = (wh: Warehouse, isNew: boolean) => {
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    if (isNew) {
      cloned.warehouses.push(wh);
      logAuditAction(cloned, "Thêm mới kho", actorName, data.role, wh.id);
    } else {
      const idx = cloned.warehouses.findIndex((w) => w.id === wh.id);
      if (idx >= 0) cloned.warehouses[idx] = wh;
      logAuditAction(cloned, "Cập nhật thông tin kho", actorName, data.role, wh.id);
    }
    saveWmsData(cloned);
    setData(cloned);
  };

  const handleDeleteWarehouse = (whId: string) => {
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    cloned.warehouses = cloned.warehouses.filter((w) => w.id !== whId);
    logAuditAction(cloned, "Xóa kho", actorName, data.role, whId);
    saveWmsData(cloned);
    setData(cloned);
  };

  const handleSaveProduct = (p: Product, isNew: boolean) => {
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    if (isNew) {
      cloned.products.push(p);
      logAuditAction(cloned, "Thêm mặt hàng mới", actorName, data.role, p.id);
    } else {
      const idx = cloned.products.findIndex((item) => item.id === p.id);
      if (idx >= 0) cloned.products[idx] = p;
      logAuditAction(cloned, "Cập nhật mặt hàng", actorName, data.role, p.id);
    }
    saveWmsData(cloned);
    setData(cloned);
  };

  const handleSaveCompany = (comp: Company) => {
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const idx = cloned.companies.findIndex((c) => c.id === comp.id);
    if (idx >= 0) cloned.companies[idx] = comp;
    saveWmsData(cloned);
    setData(cloned);
  };

  const handleSaveSupplier = (s: Supplier, isNew: boolean) => {
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    if (isNew) {
      cloned.suppliers.push(s);
    } else {
      const idx = cloned.suppliers.findIndex((item) => item.id === s.id);
      if (idx >= 0) cloned.suppliers[idx] = s;
    }
    saveWmsData(cloned);
    setData(cloned);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <WmsHeader
        companies={data.companies}
        selectedCompany={selectedCompany}
        onChangeCompany={(cId) => {
          setSelectedCompany(cId);
          setSelectedPlant("all");
        }}
        selectedPlant={selectedPlant}
        onChangePlant={setSelectedPlant}
        availablePlants={availablePlants}
        currentRole={data.role}
        onChangeRole={handleRoleChange}
        actorName={actorName}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        onOpenApprovals={() => setActiveTab("approvals")}
        onAddTestData={handleAddTestData}
        onResetData={handleResetData}
        activeTab={activeTab}
      />

      {/* Navigation Bar */}
      <WmsNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-in fade-in">
        {activeTab === "overview" && (
          <WmsOverviewView
            data={data}
            scopedCompanies={data.companies}
            scopedWarehouses={scopedWarehouses}
            scopedInventory={scopedInventory}
            scopedDocs={scopedDocs}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenDoc={(doc) => setSelectedDoc(doc)}
            onOpenQuickCount={() => setIsCountModalOpen(true)}
            onOpenNewInbound={() => {
              setEditingDoc(null);
              setFormDocType("inbound");
            }}
            onOpenNewOutbound={() => {
              setEditingDoc(null);
              setFormDocType("outbound");
            }}
          />
        )}

        {activeTab === "inventory" && (
          <WmsInventoryView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedInventory={scopedInventory}
            onOpenQuickCount={() => setIsCountModalOpen(true)}
          />
        )}

        {activeTab === "inbound" && (
          <WmsInboundView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedDocs={scopedDocs}
            onOpenDoc={(doc) => setSelectedDoc(doc)}
            onOpenNewInbound={() => {
              setEditingDoc(null);
              setFormDocType("inbound");
            }}
          />
        )}

        {activeTab === "outbound" && (
          <WmsOutboundView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedDocs={scopedDocs}
            onOpenDoc={(doc) => setSelectedDoc(doc)}
            onOpenNewOutbound={() => {
              setEditingDoc(null);
              setFormDocType("outbound");
            }}
          />
        )}

        {activeTab === "transfers" && (
          <WmsTransferView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedDocs={scopedDocs}
            onOpenDoc={(doc) => setSelectedDoc(doc)}
            onOpenNewTransfer={() => {
              setEditingDoc(null);
              setFormDocType("transfer");
            }}
          />
        )}

        {activeTab === "counts" && (
          <WmsCountView
            data={data}
            scopedWarehouses={scopedWarehouses}
            onOpenNewCount={() => setIsCountModalOpen(true)}
          />
        )}

        {activeTab === "approvals" && (
          <WmsApprovalsView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedDocs={scopedDocs}
            currentActor={actorName}
            currentRole={data.role}
            onOpenDoc={(doc) => setSelectedDoc(doc)}
            onUpdateState={setData}
          />
        )}

        {activeTab === "reports" && (
          <WmsReportsView
            data={data}
            scopedWarehouses={scopedWarehouses}
            scopedInventory={scopedInventory}
          />
        )}

        {activeTab === "warehouses" && (
          <WmsWarehousesView
            data={data}
            onSaveWarehouse={handleSaveWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
          />
        )}

        {activeTab === "products" && (
          <WmsProductsView data={data} onSaveProduct={handleSaveProduct} />
        )}

        {activeTab === "suppliers" && (
          <WmsSuppliersView
            data={data}
            onSaveCompany={handleSaveCompany}
            onSaveSupplier={handleSaveSupplier}
          />
        )}

        {activeTab === "settings" && (
          <WmsSettingsView
            data={data}
            currentRole={data.role}
            onChangeRole={handleRoleChange}
            onAddTestData={handleAddTestData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <WmsDocumentDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          data={data}
          currentActor={actorName}
          currentRole={data.role}
          onUpdateState={(next) => {
            setData(next);
            // Refresh selectedDoc instance from updated state
            const refreshed = next.docs.find((d) => d.id === selectedDoc.id);
            setSelectedDoc(refreshed || null);
          }}
          onEditDoc={(docToEdit) => {
            setSelectedDoc(null);
            setEditingDoc(docToEdit);
            setFormDocType(docToEdit.type);
          }}
        />
      )}

      {/* Universal Document Creation/Edit Form Modal */}
      {formDocType && (
        <WmsDocFormModal
          type={formDocType}
          existingDoc={editingDoc}
          onClose={() => {
            setFormDocType(null);
            setEditingDoc(null);
          }}
          data={data}
          currentActor={actorName}
          currentRole={data.role}
          onUpdateState={setData}
        />
      )}

      {/* Inventory Count Session Modal */}
      {isCountModalOpen && (
        <WmsInventoryCountModal
          onClose={() => setIsCountModalOpen(false)}
          data={data}
          currentActor={actorName}
          currentRole={data.role}
          onUpdateState={setData}
        />
      )}

      {/* Quick Search Modal */}
      <WmsQuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        data={data}
        onOpenDoc={(doc) => setSelectedDoc(doc)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

