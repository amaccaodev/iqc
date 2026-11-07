import React from "react";
import { WmsIcon } from "./WmsIcons";

export type WmsNavTab =
  | "overview"
  | "inventory"
  | "inbound"
  | "outbound"
  | "transfers"
  | "counts"
  | "approvals"
  | "reports"
  | "warehouses"
  | "products"
  | "suppliers"
  | "settings";

interface WmsNavProps {
  activeTab: WmsNavTab;
  onChangeTab: (tab: WmsNavTab) => void;
  pendingApprovalsCount: number;
}

interface NavItemDef {
  key: WmsNavTab;
  label: string;
  icon: any;
  badge?: number;
}

export const WmsNav: React.FC<WmsNavProps> = ({
  activeTab,
  onChangeTab,
  pendingApprovalsCount,
}) => {
  const items: NavItemDef[] = [
    { key: "overview", label: "Tổng quan", icon: "overview" },
    { key: "inventory", label: "Tồn kho", icon: "inventory" },
    { key: "inbound", label: "Nhập kho", icon: "inbound" },
    { key: "outbound", label: "Xuất kho", icon: "outbound" },
    { key: "transfers", label: "Điều chuyển", icon: "transfer" },
    { key: "counts", label: "Kiểm kê", icon: "count" },
    {
      key: "approvals",
      label: "Phê duyệt",
      icon: "approvals",
      badge: pendingApprovalsCount,
    },
    { key: "reports", label: "Báo cáo & Sổ kho", icon: "reports" },
    { key: "warehouses", label: "Danh mục kho", icon: "warehouse" },
    { key: "products", label: "Hàng hóa", icon: "products" },
    { key: "suppliers", label: "Đơn vị nội bộ", icon: "suppliers" },
    { key: "settings", label: "Cài đặt", icon: "settings" },
  ];

  return (
    <nav className="bg-card border-b border-border px-4 sm:px-6 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 min-w-max py-2">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangeTab(item.key)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/15"
              }`}
            >
              <WmsIcon name={item.icon} size={15} />
              <span>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold leading-tight ${
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

