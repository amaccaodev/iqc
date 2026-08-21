import type {
  Attachment,
  CreateOrderFromProductRequest,
  EntityListQuery,
  Machine,
  MachineChangeRequest,
  PagedResult,
  Product,
  ProductBomLine,
  SemiProduct,
  WarehouseMovement,
  WarehouseStock,
} from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";

class CatalogApiService extends BaseApiService {
  listProducts() {
    return this.get<Product[]>("/products");
  }

  searchProducts(query: EntityListQuery = {}): Promise<PagedResult<Product>> {
    return this.listPaged<Product>("/products", query);
  }

  createProduct(body: Partial<Product>) {
    return this.post<Product>("/products", body);
  }
  updateProduct(id: string, body: Partial<Product>) {
    return this.patch<Product>(`/products/${id}`, body);
  }
  deleteProduct(id: string) {
    return this.request<Product>(`/products/${id}`, { method: "DELETE" });
  }
  listBom(productId: string) {
    return this.get<ProductBomLine[]>(`/products/${productId}/bom`);
  }
  setBom(productId: string, lines: Array<{ semiProductId: string; qtyPerUnit: number }>) {
    return this.request<ProductBomLine[]>(`/products/${productId}/bom`, {
      method: "PUT",
      body: JSON.stringify({ lines }),
    });
  }

  listSemiProducts() {
    return this.get<SemiProduct[]>("/semi-products");
  }

  searchSemiProducts(query: EntityListQuery = {}): Promise<PagedResult<SemiProduct>> {
    return this.listPaged<SemiProduct>("/semi-products", query);
  }

  createSemi(body: Partial<SemiProduct>) {
    return this.post<SemiProduct>("/semi-products", body);
  }
  updateSemi(id: string, body: Partial<SemiProduct>) {
    return this.patch<SemiProduct>(`/semi-products/${id}`, body);
  }

  listStock() {
    return this.get<Array<WarehouseStock & { semiProduct?: SemiProduct }>>("/warehouse-stock");
  }

  searchStock(
    query: EntityListQuery = {},
  ): Promise<PagedResult<WarehouseStock & { semiProduct?: SemiProduct }>> {
    return this.listPaged<WarehouseStock & { semiProduct?: SemiProduct }>("/warehouse-stock", query);
  }

  setStock(semiProductId: string, qty: number, note?: string, createdBy?: string) {
    return this.patch<WarehouseStock>(`/warehouse-stock/${semiProductId}`, { qty, note, createdBy });
  }
  adjustStock(semiProductId: string, delta: number, note?: string, createdBy?: string) {
    return this.post<{ stock: WarehouseStock; movement: WarehouseMovement }>(
      `/warehouse-stock/${semiProductId}/adjust`,
      { delta, note, createdBy },
    );
  }
  listMovements(limit = 50) {
    return this.get<Array<WarehouseMovement & { semiProduct?: SemiProduct }>>(
      `/warehouse-movements?limit=${limit}`,
    );
  }
  importStock(rows: Array<{ code: string; qty: number }>) {
    return this.post<{ updated: number; errors: string[]; total: number }>(
      "/warehouse-stock/import",
      { rows },
    );
  }

  listMachines() {
    return this.get<Machine[]>("/machines");
  }
  createMachine(body: Partial<Machine>) {
    return this.post<Machine>("/machines", body);
  }
  updateMachine(id: string, body: Partial<Machine>) {
    return this.patch<Machine>(`/machines/${id}`, body);
  }
  deleteMachine(id: string) {
    return this.request<Machine>(`/machines/${id}`, { method: "DELETE" });
  }

  listChangeRequests(params?: { status?: string; target?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.target) q.set("target", params.target);
    const qs = q.toString();
    return this.get<MachineChangeRequest[]>(`/machine-change-requests${qs ? `?${qs}` : ""}`);
  }
  createChangeRequest(body: {
    orderId?: string;
    bomId?: string;
    requestedBy: string;
    requestedName: string;
    reason: string;
    target: "teamlead" | "mechanic";
    fromMachine?: string;
    toMachine?: string;
  }) {
    return this.post<MachineChangeRequest>("/machine-change-requests", body);
  }
  reviewChangeRequest(
    id: string,
    body: { approved: boolean; reviewedBy: string; reviewedName: string; note?: string },
  ) {
    return this.post<MachineChangeRequest>(`/machine-change-requests/${id}/review`, body);
  }

  createOrderFromProduct(body: CreateOrderFromProductRequest & { createdBy: string }) {
    return this.post("/orders/from-product", body);
  }

  listProductAttachments(productId: string) {
    return this.get<Attachment[]>(`/products/${productId}/attachments`);
  }
  addProductAttachment(productId: string, body: Omit<Attachment, "id">) {
    return this.post<Attachment>(`/products/${productId}/attachments`, body);
  }
  removeProductAttachment(productId: string, attId: string) {
    return this.request<void>(`/products/${productId}/attachments/${attId}`, { method: "DELETE" });
  }

  listSemiAttachments(semiId: string) {
    return this.get<Attachment[]>(`/semi-products/${semiId}/attachments`);
  }
  addSemiAttachment(semiId: string, body: Omit<Attachment, "id">) {
    return this.post<Attachment>(`/semi-products/${semiId}/attachments`, body);
  }
  removeSemiAttachment(semiId: string, attId: string) {
    return this.request<void>(`/semi-products/${semiId}/attachments/${attId}`, { method: "DELETE" });
  }
}

export const catalogApi = new CatalogApiService();
