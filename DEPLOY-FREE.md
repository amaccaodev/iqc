# Deploy miễn phí — UI demo trước, backend tuỳ chọn

## Mục tiêu hiện tại

**Frontend DEMO UI** chạy mock data in-memory — **không cần backend** để test giao diện / workflow.

| URL | Mô tả |
|-----|--------|
| https://iqc-frontend.onrender.com/login | Frontend demo (Render static) |
| `?demo=1` trên URL hoặc nút “Bật chế độ demo UI” | Bật bypass tạm trên mọi bản build |

Login demo: `NV001` / `123456` (GĐ), `NV030` / `123456` (CN), `NV000` / `admin123` (Admin)…

## Push → `main`

1. Build + typecheck FE/BE  
2. Deploy UI (Render static auto / GitHub Pages nếu repo public) với `VITE_DEMO_MODE=true`  
3. Migrate DB + Render API — **không chặn** UI (continue-on-error)

## Repo PRIVATE

GitHub Pages free cần repo **public**. Giữ private → dùng **Render frontend**:  
https://iqc-frontend.onrender.com/login

## Tắt demo / nối API thật sau

1. Đổi `render.yaml` build: bỏ `VITE_DEMO_MODE`, set `VITE_API_URL=.../api`  
2. Đảm bảo backend Live + env Supabase  
3. Push lại

## Local

```powershell
# Demo UI only (không cần backend)
$env:VITE_DEMO_MODE="true"; pnpm dev

# Full stack
pnpm dev:all
```
