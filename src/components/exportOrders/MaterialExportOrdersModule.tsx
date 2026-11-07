import { useState, useEffect, useCallback } from "react"
import type { ExportOrder, ExportUser } from "../../types/exportOrder"
import {
  loadStoredCurrentUser,
  loadStoredOrders,
  resetDemoExportData,
  saveStoredCurrentUser,
  saveStoredOrders,
} from "../../services/exportOrderStorage"
import RoleSwitcherBar from "./RoleSwitcherBar"
import ExportOrderList from "./ExportOrderList"
import CreateOrEditOrderModal from "./CreateOrEditOrderModal"
import WarehouseIssueModal from "./WarehouseIssueModal"
import CancelOrderModal from "./CancelOrderModal"
import OrderDetailModal from "./OrderDetailModal"
import PrintSlipModal from "./PrintSlipModal"
import ToastNotification, { type ToastMessage } from "./ToastNotification"

export default function MaterialExportOrdersModule() {
  const [orders, setOrders] = useState<ExportOrder[]>(() => loadStoredOrders())
  const [currentUser, setCurrentUser] = useState<ExportUser>(() =>
    loadStoredCurrentUser(),
  )
  const [activeTab, setActiveTab] = useState<"orders" | "warehouse_issue">(
    "orders",
  )

  // Modals state
  const [isCreateOrEditOpen, setIsCreateOrEditOpen] = useState(false)
  const [orderToEdit, setOrderToEdit] = useState<ExportOrder | null>(null)

  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<ExportOrder | null>(null)
  const [orderToIssue, setOrderToIssue] = useState<ExportOrder | null>(null)
  const [orderToCancel, setOrderToCancel] = useState<ExportOrder | null>(null)
  const [orderToPrint, setOrderToPrint] = useState<ExportOrder | null>(null)

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (
      message: string,
      type: "success" | "warning" | "error" | "info" = "success",
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    [],
  )

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Sync orders to localStorage whenever orders change
  const updateOrdersAndSave = (newOrders: ExportOrder[]) => {
    setOrders(newOrders)
    saveStoredOrders(newOrders)
  }

  // Switch Role
  const handleSelectUser = (user: ExportUser) => {
    setCurrentUser(user)
    saveStoredCurrentUser(user)
    // If switching to warehouse keeper, auto select "warehouse_issue" tab
    if (user.roleType === "warehouse_keeper") {
      setActiveTab("warehouse_issue")
    } else {
      setActiveTab("orders")
    }
    addToast(`Đã chuyển sang vai trò: ${user.name} (${user.role})`, "info")
  }

  // Reset Demo Data
  const handleResetData = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu lệnh xuất mẫu ban đầu?",
      )
    ) {
      const reset = resetDemoExportData()
      setOrders(reset.orders)
      setCurrentUser(reset.user)
      setActiveTab("orders")
      setSelectedOrderDetail(null)
      setOrderToIssue(null)
      setOrderToCancel(null)
      setOrderToPrint(null)
      addToast(
        "Đã khôi phục toàn bộ kịch bản dữ liệu mẫu chuẩn công trình!",
        "success",
      )
    }
  }

  // Save or Publish Order
  const handleSaveOrder = (
    savedOrder: ExportOrder,
    action: "save_draft" | "publish",
  ) => {
    const exists = orders.some((o) => o.id === savedOrder.id)
    let updated: ExportOrder[]
    if (exists) {
      updated = orders.map((o) => (o.id === savedOrder.id ? savedOrder : o))
    } else {
      updated = [savedOrder, ...orders]
    }
    updateOrdersAndSave(updated)
    if (action === "publish") {
      addToast(
        `Đã phát hành lệnh xuất ${savedOrder.code} đến kho phụ trách!`,
        "success",
      )
    } else {
      addToast(`Đã lưu bản nháp lệnh xuất ${savedOrder.code}.`, "success")
    }
  }

  // Keeper accepts order
  const handleAcceptOrder = (order: ExportOrder) => {
    const now = new Date()
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().substring(0, 5)}`
    const updated: ExportOrder = {
      ...order,
      status: "in_progress",
      logs: [
        ...order.logs,
        {
          time: timeStr,
          actor: `${currentUser.name} (${currentUser.role})`,
          action: "Tiếp nhận lệnh xuất",
          note: "Thủ kho đã tiếp nhận lệnh, đang chuẩn bị phương tiện bốc dỡ tại bãi kho.",
        },
      ],
    }
    const newOrders = orders.map((o) => (o.id === order.id ? updated : o))
    updateOrdersAndSave(newOrders)
    addToast(
      `Thủ kho đã tiếp nhận lệnh ${order.code}. Trạng thái chuyển sang: Đang xuất kho!`,
      "success",
    )
  }

  // Keeper confirms issue
  const handleConfirmIssue = (
    updatedOrder: ExportOrder,
    issueType: "full" | "partial" | "close_short",
    note: string,
  ) => {
    const newOrders = orders.map((o) =>
      o.id === updatedOrder.id ? updatedOrder : o,
    )
    updateOrdersAndSave(newOrders)

    // If modal detail was open, update it
    if (selectedOrderDetail && selectedOrderDetail.id === updatedOrder.id) {
      setSelectedOrderDetail(updatedOrder)
    }

    if (issueType === "close_short") {
      addToast(
        `Đã đóng lệnh thiếu ${updatedOrder.code} kèm lý do giải trình.`,
        "warning",
      )
    } else if (issueType === "full") {
      addToast(
        `Xuất kho hoàn tất 100% cho lệnh ${updatedOrder.code}!`,
        "success",
      )
    } else {
      addToast(
        `Đã ghi nhận xuất kho đợt này cho lệnh ${updatedOrder.code}.`,
        "success",
      )
    }
  }

  // Cancel order
  const handleConfirmCancel = (updatedOrder: ExportOrder, reason: string) => {
    const newOrders = orders.map((o) =>
      o.id === updatedOrder.id ? updatedOrder : o,
    )
    updateOrdersAndSave(newOrders)
    addToast(
      `Đã hủy lệnh xuất ${updatedOrder.code}. Lý do: ${reason}`,
      "warning",
    )
  }

  return (
    <div className="w-full pb-10">
      {/* Role Switcher Bar */}
      <RoleSwitcherBar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onResetData={handleResetData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Order List */}
      <ExportOrderList
        orders={orders}
        currentUser={currentUser}
        activeTab={activeTab}
        onCreateNew={() => {
          setOrderToEdit(null)
          setIsCreateOrEditOpen(true)
        }}
        onViewDetail={(order) => setSelectedOrderDetail(order)}
        onEditOrder={(order) => {
          setOrderToEdit(order)
          setIsCreateOrEditOpen(true)
        }}
        onCancelOrder={(order) => setOrderToCancel(order)}
        onOpenIssueModal={(order) => setOrderToIssue(order)}
        onAcceptOrder={handleAcceptOrder}
        onOpenPrint={(order) => setOrderToPrint(order)}
      />

      {/* Modal: Create or Edit Order */}
      <CreateOrEditOrderModal
        orderToEdit={orderToEdit}
        existingOrders={orders}
        currentUser={currentUser}
        isOpen={isCreateOrEditOpen}
        onClose={() => {
          setIsCreateOrEditOpen(false)
          setOrderToEdit(null)
        }}
        onSave={handleSaveOrder}
      />

      {/* Modal: Warehouse Issue */}
      <WarehouseIssueModal
        order={orderToIssue}
        currentUser={currentUser}
        isOpen={!!orderToIssue}
        onClose={() => setOrderToIssue(null)}
        onConfirmIssue={handleConfirmIssue}
      />

      {/* Modal: Cancel Order */}
      <CancelOrderModal
        order={orderToCancel}
        currentUser={currentUser}
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Modal: Order Detail & Audit Trail */}
      <OrderDetailModal
        order={selectedOrderDetail}
        currentUser={currentUser}
        onClose={() => setSelectedOrderDetail(null)}
        onOpenPrint={(order) => setOrderToPrint(order)}
        onOpenIssueModal={(order) => {
          setSelectedOrderDetail(null)
          setOrderToIssue(order)
        }}
      />

      {/* Modal: A4 Printable Slip */}
      <PrintSlipModal
        order={orderToPrint}
        onClose={() => setOrderToPrint(null)}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
