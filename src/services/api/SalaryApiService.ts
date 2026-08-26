import type { EmployeeProductRate, ShiftClose, ShiftUnlockRequest } from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";

class SalaryApiService extends BaseApiService {
  listRates(userId?: string) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return this.get<EmployeeProductRate[]>(`/payroll/rates${q}`);
  }
  upsertRate(userId: string, productId: string, rateVnd: number) {
    return this.put<EmployeeProductRate>("/payroll/rates", { userId, productId, rateVnd });
  }
  importRows(
    rows: Array<{
      employeeId: string;
      name?: string;
      department?: string;
      phone?: string;
      productCode?: string;
      rateVnd?: number;
    }>,
  ) {
    return this.post<{ profileUpdates: number; rateUpdates: number; errors: string[]; total: number }>(
      "/payroll/import",
      { rows },
    );
  }
  listShiftCloses(params?: { status?: string; workerId?: string; orderId?: string; bomId?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.workerId) q.set("workerId", params.workerId);
    if (params?.orderId) q.set("orderId", params.orderId);
    if (params?.bomId) q.set("bomId", params.bomId);
    const qs = q.toString();
    return this.get<ShiftClose[]>(`/shift-closes${qs ? `?${qs}` : ""}`);
  }
  reviewShiftClose(
    id: string,
    body: {
      stage: "teamlead" | "qc" | "supervisor";
      approved: boolean;
      reviewerName: string;
      rejectReason?: string;
    },
  ) {
    return this.post<ShiftClose>(`/shift-closes/${id}/review`, body);
  }
  listShiftUnlocks(params?: { status?: string; workerId?: string; orderId?: string; bomId?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.workerId) q.set("workerId", params.workerId);
    if (params?.orderId) q.set("orderId", params.orderId);
    if (params?.bomId) q.set("bomId", params.bomId);
    const qs = q.toString();
    return this.get<ShiftUnlockRequest[]>(`/shift-unlocks${qs ? `?${qs}` : ""}`);
  }
  requestShiftUnlock(body: {
    orderId: string;
    bomId: string;
    workerId: string;
    workerName: string;
    partName: string;
    reason?: string;
  }) {
    return this.post<ShiftUnlockRequest>("/shift-unlocks", body);
  }
  reviewShiftUnlock(
    id: string,
    body: { approved: boolean; reviewerName: string; rejectReason?: string },
  ) {
    return this.post<ShiftUnlockRequest>(`/shift-unlocks/${id}/review`, body);
  }
}

export const salaryApi = new SalaryApiService();
