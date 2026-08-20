import type { ValidateEntryResponse } from "@shared/types/spec";
import { BaseApiService } from "../../core/BaseApiService";

export class SpecApiService extends BaseApiService {
  validate(payload: {
    specCols: string[];
    materialSpecs?: import("@shared/types/spec").MaterialSpec[];
    rows: { tt: number; dims: string[]; ngoaiQuan: string }[];
  }): Promise<ValidateEntryResponse> {
    return this.post<ValidateEntryResponse>("/spec/validate", payload);
  }
}

export const specApi = new SpecApiService();
