import React from "react";
import { useMachineManagement } from "../../hooks/useMachineManagement";
import { MachineIcon } from "../../components/machines/MachineIcons";
import { MachineKpiBar } from "../../components/machines/MachineKpiBar";
import { MachineFilters } from "../../components/machines/MachineFilters";
import { MachineCard } from "../../components/machines/MachineCard";
import { MachineTable } from "../../components/machines/MachineTable";
import { MachineDetailDrawer } from "../../components/machines/MachineDetailDrawer";
import {
  ChangeStatusModal,
  MachineFormModal,
  ReportIncidentModal,
  ScheduleMaintenanceModal,
} from "../../components/machines/MachineActionModals";

export default function DirectorMachinesPage() {
  const {
    canEdit,
    machines,
    loading,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    filteredMachines,
    workshops,
    machineTypes,
    selectedMachine,
    setSelectedMachine,
    isAddEditModalOpen,
    setIsAddEditModalOpen,
    editingMachine,
    setEditingMachine,
    statusModalMachine,
    setStatusModalMachine,
    incidentModalMachine,
    setIncidentModalMachine,
    maintenanceModalMachine,
    setMaintenanceModalMachine,
    handleSaveMachine,
    handleConfirmChangeStatus,
    handleReportIncident,
    handleScheduleMaintenance,
    handleResetDemo,
  } = useMachineManagement();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MachineIcon name="cpu" size={24} className="text-primary" />
            <span>Quản lý Thiết bị & Máy móc</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát trạng thái vận hành thời gian thực, tiến độ lệnh sản xuất, cảnh báo bảo trì và sự cố kỹ thuật.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditingMachine(null);
                setIsAddEditModalOpen(true);
              }}
              className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <MachineIcon name="plus" size={14} />
              <span>Thêm máy mới</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDemo}
            className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted/15 font-medium transition-all cursor-pointer"
            title="Khôi phục 12 máy mẫu ban đầu"
          >
            ↺ Reset demo
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <MachineKpiBar
        machines={machines}
        activeStatusFilter={filters.status}
        onFilterStatus={(statusKey) => setFilters({ ...filters, status: statusKey })}
      />

      {/* Filters Toolbar */}
      <MachineFilters
        filters={filters}
        onChangeFilters={setFilters}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        workshops={workshops}
        machineTypes={machineTypes}
        totalResults={filteredMachines.length}
      />

      {/* Machine List / Skeleton / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-border bg-card space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-muted/30 rounded w-16" />
                <div className="h-5 bg-muted/30 rounded-full w-20" />
              </div>
              <div className="h-4 bg-muted/30 rounded w-3/4" />
              <div className="h-3 bg-muted/20 rounded w-1/2" />
              <div className="h-20 bg-muted/15 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-xl bg-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center mx-auto">
            <MachineIcon name="search" size={22} />
          </div>
          <h3 className="font-bold text-sm text-foreground">Không tìm thấy thiết bị nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Không có máy móc nào phù hợp với bộ lọc hiện tại. Vui lòng thử từ khóa tìm kiếm hoặc xóa bộ lọc.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({ search: "", workshop: "all", type: "all", status: "all" })
            }
            className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 cursor-pointer"
          >
            Xóa toàn bộ bộ lọc
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMachines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onSelectMachine={setSelectedMachine}
              canEdit={canEdit}
              onQuickChangeStatus={setStatusModalMachine}
              onQuickReportIncident={setIncidentModalMachine}
            />
          ))}
        </div>
      ) : (
        <MachineTable
          machines={filteredMachines}
          onSelectMachine={setSelectedMachine}
          canEdit={canEdit}
          onEditMachine={(m) => {
            setEditingMachine(m);
            setIsAddEditModalOpen(true);
          }}
          onQuickChangeStatus={setStatusModalMachine}
          onQuickReportIncident={setIncidentModalMachine}
        />
      )}

      {/* Machine Detail Drawer */}
      <MachineDetailDrawer
        machine={selectedMachine}
        onClose={() => setSelectedMachine(null)}
        canEdit={canEdit}
        onEditMachine={(m) => {
          setEditingMachine(m);
          setIsAddEditModalOpen(true);
        }}
        onReportIncident={setIncidentModalMachine}
        onScheduleMaintenance={setMaintenanceModalMachine}
      />

      {/* Add / Edit Machine Modal */}
      <MachineFormModal
        machine={editingMachine}
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingMachine(null);
        }}
        onSave={handleSaveMachine}
        workshops={workshops}
        machineTypes={machineTypes}
      />

      {/* Quick Change Status Modal */}
      <ChangeStatusModal
        machine={statusModalMachine}
        isOpen={Boolean(statusModalMachine)}
        onClose={() => setStatusModalMachine(null)}
        onConfirm={handleConfirmChangeStatus}
      />

      {/* Quick Report Incident Modal */}
      <ReportIncidentModal
        machine={incidentModalMachine}
        isOpen={Boolean(incidentModalMachine)}
        onClose={() => setIncidentModalMachine(null)}
        onSubmit={handleReportIncident}
      />

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        machine={maintenanceModalMachine}
        isOpen={Boolean(maintenanceModalMachine)}
        onClose={() => setMaintenanceModalMachine(null)}
        onSubmit={handleScheduleMaintenance}
      />
    </div>
  );
}
