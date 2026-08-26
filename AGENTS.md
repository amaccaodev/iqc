# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

## List / search / pagination architecture

Dùng **cùng một stack** cho mọi màn hình có danh sách lớn (NV, SP, BTP, kho…). Không tự viết fetch + debounce + phân trang trong page.

### Layer (bottom → top)

| Layer | Path | Vai trò |
|-------|------|---------|
| **Contracts** | `shared/src/types` (`PagedResult`, `EntityListQuery`), `shared/src/constants/pagination.ts`, `shared/src/utils/listQuery.ts`, `shared/src/utils/pagedList.ts` | Query string, page size, in-memory slice — dùng chung FE + BE |
| **Backend query services** | `backend/src/services/*QueryService.ts` (`UserQueryService`, `CatalogQueryService`) | Business read logic; route chỉ delegate |
| **Backend routes** | `backend/src/routes/api.ts` (mount) + `*Routes.ts` theo feature | `wantsPagedListQuery` → service; không nhét filter/paginate inline |
| **API client** | `src/core/BaseApiService.ts` → `listPaged()` / `listPagedSafe()`; `src/services/api/*ApiService.ts` | Một dòng `return this.listPaged("/users", query)` |
| **Page data hook** | `src/hooks/usePagedList.ts` + `useStableFetch` | Search debounce, page state, loading, refresh |
| **Picker helper** | `src/core/entityPicker.ts` → `createEntityPickerSearch()` | `SearchPicker` onSearch cho dropdown lớn |
| **UI** | `SearchPicker`, `ResponsiveDataList`, `PaginationBar` | Mobile = card; `lg+` = table |

### Thêm entity list mới

1. **BE**: Repository/Store `searchPaged` → `*QueryService.listPaged` → route GET với `parseListQueryFromRequest`
2. **FE**: `*ApiService.list/search*` gọi `listPaged`
3. **Page**: `usePagedList({ fetchPage: useStableFetch(...), filters })` + `ResponsiveDataList`
4. **Form chọn entity**: `createEntityPickerSearch(api.list, mapItem, extraFilters)`

### Cây đo kiểm (IQC)

```
Sản phẩm (ProductionOrder / Product)
 └── Linh kiện (chi tiết sheet Mẫu van)
      └── Quy trình / nguyên công = 1 BOM (processSeq tuần tự)
           └── Thông số (materialSpecs[])
```

- Mỗi nguyên công ĐMKT = **1 BOM = 1 quy trình**; hết QT trước mới mở QT sau (`shared/src/utils/bomProcess.ts`).
- Tổ trưởng phân công: **tên quy trình + máy + người** (`TeamLeadAssignPage`).
- Đề xuất CN: chỉ **Thay máy / Thêm máy / Báo hỏng** (bỏ “Xin phê duyệt”); nút đồng bộ style (`ProposalActionButtons`).
- Checklist: `buildMaterialSpecsFromChecklist()` + `checklistToSpecCols()` trong `shared/src/utils/specValidation.ts`.
- Demo: `LSX-2024-005` Van góc NOVO 15 (Nắp / Thân — từng nguyên công một BOM).
- Theo dõi GĐ / Quản đốc: `/director/production`, `/supervisor/production` (`productionProgress.ts`).
- File ĐMKT: `documents/*.xlsx` (Mẫu van = chi tiết + nguyên công).
- Import BOM CSV: Admin → **Import BOM** — `downloadProductBomTemplate` / `parseProductBomCsv` (`src/utils/productBomImport.ts`); API `POST /products/import-bom`. Mỗi dòng = 1 quy trình của 1 linh kiện thuộc 1 SP.
- Bản vẽ / thông số: Base64/WebP trong DB (`contentBase64`); FE `fileToAttachment` + `AttachmentUploader`.

### Scale-up path

- Catalog hiện dùng `CatalogMemoryStore` → thay `CatalogQueryService` bằng Supabase repository mà **không đổi route/FE**
- Index DB: `supabase/migrations/*_list_search_indexes.sql`
- `DEFAULT_PAGE_SIZE` / `MAX_PAGE_SIZE` chỉnh một chỗ trong `shared/src/constants/pagination.ts`
