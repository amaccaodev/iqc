import type { ValidateEntryPayload, ValidateEntryResponse } from "../../../shared/src/types/spec.js";
import { validateEntryRows } from "../../../shared/src/utils/specValidation.js";

/** Kiểm tra thông số Sản xuất — Single Responsibility */
export class SpecValidationService {
  validate(payload: ValidateEntryPayload): ValidateEntryResponse {
    return validateEntryRows(payload.specCols, payload.rows, payload.materialSpecs);
  }
}

export const specValidationService = new SpecValidationService();
