import type { ProductionOrder, User } from "../../../shared/src/types/index.js";
import { SEED_ORDERS as DMKT_ORDERS } from "./seedOrders.js";
import { SAMPLE_ORDERS, withInspectionDrawings } from "../../../shared/src/data/sampleInspection.js";

/** Gán việc + số đo demo: Cường đo/nộp/chốt; Nga chờ duyệt (sửa phiếu). */
function enrichDemoFlow(orders: ProductionOrder[]): ProductionOrder[] {
  const now = new Date().toISOString();
  return orders.map((o) => ({
    ...o,
    boms: o.boms.map((b) => {
      if (o.id === "o1" && b.id === "b1" && b.workerEntries.length === 0) {
        return {
          ...b,
          workerEntries: [
            {
              id: "we-o1-b1-u6",
              workerId: "u6",
              workerName: "Cường 2T3",
              submittedAt: now,
              rows: [1, 2, 3, 4].map((tt) => ({
                tt,
                dims: ["20", "9", "1.5", "v", "4", "Đạt", "", "", "", "", ""],
                ngoaiQuan: "Đạt",
              })),
            },
          ],
        };
      }
      if (o.id === "o1" && b.id === "b-p1-sp-novo-vg-15-02-1") {
        return {
          ...b,
          assignedWorkers: ["Nga 3/43"],
          workerAssignments: [{ workerId: "u7", workerName: "Nga 3/43", machineName: b.machine || "CP" }],
          status: "in_progress" as const,
          passQty: 40,
          workerEntries: [
            {
              id: "we-o1-than-u7",
              workerId: "u7",
              workerName: "Nga 3/43",
              submittedAt: now,
              rows: [1, 2].map((tt) => ({
                tt,
                dims: ["40", "Đạt", "", "", "", "", "", "", "", "", ""],
                ngoaiQuan: "Đạt",
              })),
            },
          ],
        };
      }
      return b;
    }),
  }));
}

export const SEED_ORDERS = enrichDemoFlow(withInspectionDrawings([...DMKT_ORDERS, ...SAMPLE_ORDERS]));

export const SEED_USERS: User[] = [
  { id: "u1", employeeId: "NV001", name: "Nguyễn Văn An", password: "123456", role: "director", teamId: "", department: "Ban Giám Đốc", phone: "0901234567", active: true },
  { id: "u2", employeeId: "NV002", name: "Trần Thị Bình", password: "123456", role: "director", teamId: "", department: "Ban Giám Đốc", phone: "0901234568", active: true },
  { id: "u3", employeeId: "NV010", name: "Lê Văn Quốc", password: "123456", role: "supervisor", teamId: "", department: "Phân xưởng", phone: "0902345678", active: true },
  { id: "u4", employeeId: "NV020", name: "Phạm Văn Chí", password: "123456", role: "teamlead", teamId: "t_hot", department: "Tổ Dập nóng", phone: "0903456789", active: true },
  { id: "u5", employeeId: "NV021", name: "Phạm Văn Sang", password: "123456", role: "teamlead", teamId: "t_auto", department: "Tổ Tự động", phone: "0903456790", active: true },
  { id: "u6", employeeId: "NV030", name: "Cường 2T3", password: "123456", role: "worker", teamId: "t_hot", department: "Tổ Dập nóng", phone: "0904567890", active: true },
  { id: "u7", employeeId: "NV031", name: "Nga 3/43", password: "123456", role: "worker", teamId: "t_hot", department: "Tổ Dập nóng", phone: "0904567891", active: true },
  { id: "u13", employeeId: "NV032", name: "Minh T2", password: "123456", role: "worker", teamId: "t_auto", department: "Tổ Tự động", phone: "0904567892", active: true },
  { id: "u14", employeeId: "NV033", name: "Hùng T2", password: "123456", role: "worker", teamId: "t_auto", department: "Tổ Tự động", phone: "0904567893", active: true },
  { id: "u15", employeeId: "NV034", name: "Lan LR", password: "123456", role: "worker", teamId: "t_asm", department: "Tổ Lắp ráp", phone: "0904567894", active: true },
  { id: "u16", employeeId: "NV035", name: "Đức LR", password: "123456", role: "worker", teamId: "t_asm", department: "Tổ Lắp ráp", phone: "0904567895", active: true },
  { id: "u8", employeeId: "NV040", name: "T.V.Huấn", password: "123456", role: "qc", teamId: "", department: "Phòng QC", phone: "0905678901", active: true },
  { id: "u9", employeeId: "NV050", name: "Nguyễn Thị Lan", password: "123456", role: "stats", teamId: "", department: "Phòng Kế hoạch", phone: "0906789012", active: true },
  { id: "u10", employeeId: "NV000", name: "Admin", password: "admin123", role: "admin", teamId: "", department: "IT", phone: "0900000000", active: true },
  { id: "u11", employeeId: "NV060", name: "Trần Cơ Điện", password: "123456", role: "mechanic", teamId: "", department: "Cơ điện", phone: "0907890123", active: true },
  { id: "u12", employeeId: "NV022", name: "Nguyễn Thị Hoa", password: "123456", role: "teamlead", teamId: "t_asm", department: "Tổ Lắp ráp", phone: "0903456791", active: true },
];
