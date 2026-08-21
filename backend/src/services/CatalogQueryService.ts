import type {
  EntityListQuery,
  PagedResult,
  ProcessStage,
  Product,
  SemiProduct,
  WarehouseStock,
} from "../../../shared/src/types/index.js";
import { catalogStore } from "./CatalogMemoryStore.js";

type StockRow = WarehouseStock & { semiProduct?: SemiProduct };

/**
 * CatalogQueryService — facade đọc danh mục + kho (search/paged).
 * Tách khỏi route để dễ thay CatalogMemoryStore bằng Supabase repository sau này.
 */
export class CatalogQueryService {
  listAllProducts(): Product[] {
    return catalogStore.listAllProducts();
  }

  searchProducts(query: EntityListQuery): PagedResult<Product> {
    return catalogStore.searchProducts({
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      activeOnly: query.activeOnly,
    });
  }

  listAllSemiProducts(): SemiProduct[] {
    return catalogStore.listAllSemiProducts();
  }

  searchSemiProducts(query: EntityListQuery): PagedResult<SemiProduct> {
    return catalogStore.searchSemiProducts({
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      stage: query.stage as ProcessStage | "all" | undefined,
    });
  }

  listAllStock(): StockRow[] {
    return catalogStore.listStock();
  }

  searchStock(query: EntityListQuery): PagedResult<StockRow> {
    return catalogStore.searchStock({
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      stage: query.stage as ProcessStage | "all" | undefined,
    });
  }
}

export const catalogQueryService = new CatalogQueryService();
