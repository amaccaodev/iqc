import type { OrderListQuery, PagedOrders, ProductionOrder } from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";
import type { IOrderService } from "../../interfaces/services";

export class OrderApiService extends BaseApiService implements IOrderService {
  private listeners: Array<(orders: ProductionOrder[]) => void> = [];
  private cache: ProductionOrder[] = [];

  subscribe(fn: (orders: ProductionOrder[]) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.cache));
  }

  async refresh(): Promise<void> {
    this.cache = await this.get<ProductionOrder[]>("/orders");
    this.notify();
  }

  getCached(): ProductionOrder[] {
    return this.cache;
  }

  async getAll(): Promise<ProductionOrder[]> {
    await this.refresh();
    return this.cache;
  }

  async list(query: OrderListQuery = {}): Promise<PagedOrders> {
    const params = new URLSearchParams();
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    if (query.dateField) params.set("dateField", query.dateField);
    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    params.set("page", String(query.page ?? 1));
    params.set("pageSize", String(query.pageSize ?? 20));
    try {
      const raw = await this.get<PagedOrders | ProductionOrder[]>(`/orders?${params.toString()}`);
      if (Array.isArray(raw)) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        return { items: raw.slice(start, start + pageSize), total: raw.length, page, pageSize };
      }
      return {
        items: raw.items ?? [],
        total: raw.total ?? raw.items?.length ?? 0,
        page: raw.page ?? query.page ?? 1,
        pageSize: raw.pageSize ?? query.pageSize ?? 20,
      };
    } catch {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    }
  }

  getById(id: string): Promise<ProductionOrder> {
    return this.get<ProductionOrder>(`/orders/${id}`);
  }

  async create(order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const created = await this.post<ProductionOrder>("/orders", order);
    await this.refresh();
    return created;
  }

  async approve(id: string): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(`/orders/${id}/approve`);
    await this.refresh();
    return updated;
  }

  async reject(id: string): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(`/orders/${id}/reject`);
    await this.refresh();
    return updated;
  }

  async assignBOM(orderId: string, bomId: string, teamId: string): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(
      `/orders/${orderId}/boms/${bomId}/assign`,
      { teamId },
    );
    await this.refresh();
    return updated;
  }

  async assignWorkers(
    orderId: string,
    bomId: string,
    workerNames: string[],
  ): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(
      `/orders/${orderId}/boms/${bomId}/assign-workers`,
      { workerNames },
    );
    await this.refresh();
    return updated;
  }

  async submitTeamReport(
    orderId: string,
    bomId: string,
    summary: { passQty: number; failQty: number; note: string; reportedBy: string },
  ): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(
      `/orders/${orderId}/boms/${bomId}/team-report`,
      summary,
    );
    await this.refresh();
    return updated;
  }

  async submitQCReport(
    orderId: string,
    bomId: string,
    report: {
      passQty: number;
      failQty: number;
      complaint: string;
      status: string;
      inspectedBy: string;
    },
    passed: boolean,
  ): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(
      `/orders/${orderId}/boms/${bomId}/qc-report`,
      { report, passed },
    );
    await this.refresh();
    return updated;
  }

  async submitWorkerRow(
    orderId: string,
    bomId: string,
    data: { workerId: string; workerName: string; dims: string[] },
  ): Promise<{ order: ProductionOrder; row: { tt: number; dims: string[]; ngoaiQuan: string } }> {
    const result = await this.post<{ order: ProductionOrder; row: { tt: number; dims: string[]; ngoaiQuan: string } }>(
      `/orders/${orderId}/boms/${bomId}/worker-row`,
      data,
    );
    await this.refresh();
    return result;
  }

  async submitWorkerEntry(
    orderId: string,
    bomId: string,
    entry: { workerId: string; workerName: string; rows: unknown[] },
  ): Promise<ProductionOrder> {
    const updated = await this.post<ProductionOrder>(
      `/orders/${orderId}/boms/${bomId}/worker-entry`,
      entry,
    );
    await this.refresh();
    return updated;
  }

  async setOrdersLocally(updater: (orders: ProductionOrder[]) => ProductionOrder[]): Promise<void> {
    this.cache = updater(this.cache);
    this.notify();
  }
}

export const orderApi = new OrderApiService();
