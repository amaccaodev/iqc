import React from "react";
import { useTaskManagement } from "../../hooks/useTaskManagement";
import { TaskIcon } from "../../components/tasks/TaskIcons";
import { TaskKpiBar } from "../../components/tasks/TaskKpiBar";
import { TaskFilters } from "../../components/tasks/TaskFilters";
import { TaskTable } from "../../components/tasks/TaskTable";
import { TaskKanban } from "../../components/tasks/TaskKanban";
import { TaskCalendar } from "../../components/tasks/TaskCalendar";
import { TaskDetailDrawer } from "../../components/tasks/TaskDetailDrawer";
import { TaskForm } from "../../components/tasks/TaskForm";
import {
  TaskNotificationPopover,
  TaskQuickIncidentModal,
} from "../../components/tasks/TaskQuickIncidentAndBell";

export default function DirectorTasksPage() {
  const {
    staffList,
    workshops,
    categories,
    activePersona,
    setActiveStaffId,
    isManager,
    scopeBaseTasks,
    filteredTasks,
    myTaskCount,
    allTaskCount,
    notifications,
    loading,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    selectedTask,
    setSelectedTask,
    isFormOpen,
    setIsFormOpen,
    editingTask,
    setEditingTask,
    incidentModalTask,
    setIncidentModalTask,
    nextTaskCode,
    handleSaveTask,
    handleChangeStatus,
    handleToggleChecklist,
    handleAddChecklistItem,
    handleUpdateActualHours,
    handleAddAttachment,
    handleRemoveAttachment,
    handleAddComment,
    handleSubmitQuickIncident,
    handleSelectNotification,
    handleMarkAllNotificationsRead,
    handleResetDemo,
  } = useTaskManagement();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header trang Công việc */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <TaskIcon name="clipboard" size={24} className="text-primary" />
            <span>Quản lý & Điều phối Công việc Hằng ngày</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân rã công việc từ Lệnh SX (LX-...), theo dõi tiến độ checklist, nghiệm thu KCS và cảnh báo hạn hoàn thành.
          </p>
        </div>

        {/* Bộ chuyển vai trò kiểm thử RBAC + Chuông thông báo + Nút Giao việc */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs">
            <label htmlFor="task-role-switcher" className="text-[11px] font-bold text-muted-foreground">
              Vai trò xem:
            </label>
            <select
              id="task-role-switcher"
              value={activePersona.id}
              onChange={(e) => setActiveStaffId(e.target.value)}
              className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id} className="bg-card text-foreground">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <TaskNotificationPopover
            notifications={notifications}
            onSelectNotification={handleSelectNotification}
            onMarkAllRead={handleMarkAllNotificationsRead}
          />

          {isManager && (
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsFormOpen(true);
              }}
              className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <TaskIcon name="plus" size={14} />
              <span>Tạo việc mới</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDemo}
            className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted/15 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            title="Khôi phục 20 công việc mẫu ban đầu"
          >
            ↺ Reset demo
          </button>
        </div>
      </div>

      {/* Chú thích phân quyền khi ở góc nhìn Công nhân */}
      {!isManager && (
        <div className="px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-xs text-foreground flex items-center justify-between gap-2">
          <span>
            🔒 <strong>Chế độ thực thi ({activePersona.name})</strong>: Bạn chỉ xem các công việc được giao cho mình, cập nhật trạng thái/checklist và gửi duyệt hoặc báo hỏng máy.
          </span>
        </div>
      )}

      {/* 1. Thanh KPI phía trên */}
      <TaskKpiBar
        tasks={scopeBaseTasks}
        activeKpi={filters.kpiStatus}
        onSelectKpi={(kpiStatus) => setFilters({ ...filters, kpiStatus })}
      />

      {/* 2. Bộ lọc & Chuyển đổi 3 chế độ xem */}
      <TaskFilters
        filters={filters}
        onChangeFilters={setFilters}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        staffList={staffList}
        workshops={workshops}
        categories={categories}
        totalResults={filteredTasks.length}
        isManager={isManager}
        myTaskCount={myTaskCount}
        allTaskCount={allTaskCount}
      />

      {/* 3. Nội dung chính: Skeleton / Rỗng / Bảng / Kanban / Lịch */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" aria-busy="true" aria-label="Đang tải danh sách công việc">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted/30" />
                <div className="h-4 w-16 rounded bg-muted/30" />
              </div>
              <div className="h-4 w-full rounded bg-muted/30" />
              <div className="h-3 w-2/3 rounded bg-muted/20" />
              <div className="h-2 w-full rounded bg-muted/20" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center mx-auto">
            <TaskIcon name="search" size={22} />
          </div>
          <h3 className="text-sm font-bold text-foreground">Không tìm thấy công việc phù hợp</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Không có công việc nào khớp với điều kiện lọc hiện tại. Hãy thử đổi từ khóa hoặc xóa bộ lọc.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({
                search: "",
                scope: isManager ? "all" : "mine",
                kpiStatus: "all",
                assigneeId: "all",
                workshop: "all",
                priority: "all",
                category: "all",
                dateRange: "all",
              })
            }
            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
          >
            Xóa toàn bộ bộ lọc
          </button>
        </div>
      ) : viewMode === "list" ? (
        <TaskTable
          tasks={filteredTasks}
          isManager={isManager}
          onSelectTask={setSelectedTask}
          onChangeStatus={handleChangeStatus}
          onQuickReportIncident={setIncidentModalTask}
        />
      ) : viewMode === "kanban" ? (
        <TaskKanban
          tasks={filteredTasks}
          isManager={isManager}
          onSelectTask={setSelectedTask}
          onChangeStatus={handleChangeStatus}
        />
      ) : (
        <TaskCalendar tasks={filteredTasks} onSelectTask={setSelectedTask} />
      )}

      {/* 4. Chi tiết công việc (Drawer) */}
      <TaskDetailDrawer
        task={selectedTask}
        isManager={isManager}
        onClose={() => setSelectedTask(null)}
        onEditTask={(t) => {
          setEditingTask(t);
          setIsFormOpen(true);
        }}
        onChangeStatus={handleChangeStatus}
        onToggleChecklist={handleToggleChecklist}
        onAddChecklistItem={handleAddChecklistItem}
        onUpdateActualHours={handleUpdateActualHours}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        onAddComment={handleAddComment}
        onQuickReportIncident={setIncidentModalTask}
      />

      {/* 5. Modal Tạo mới / Sửa / Giao lại / Đổi hạn */}
      <TaskForm
        isOpen={isFormOpen}
        editingTask={editingTask}
        staffList={staffList}
        workshops={workshops}
        categories={categories}
        nextTaskCode={nextTaskCode}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* 6. Modal Báo hỏng máy nhanh */}
      <TaskQuickIncidentModal
        task={incidentModalTask}
        onClose={() => setIncidentModalTask(null)}
        onSubmitIncident={handleSubmitQuickIncident}
      />
    </div>
  );
}

