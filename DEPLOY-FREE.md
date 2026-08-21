# Deploy miễn phí — UI demo trên GitHub Pages

## URL test UI (demo, không cần backend)

**https://amaccaodev.github.io/iqc/login**

Login: `NV001` / `123456` (GĐ), `NV030` / `123456` (CN), `NV000` / `admin123` (Admin)…

Repo đã **public** để GitHub Pages free hoạt động. Build dùng `VITE_DEMO_MODE=true` (mock in-memory).

| URL | Mô tả |
|-----|--------|
| https://amaccaodev.github.io/iqc/login | Frontend DEMO (GitHub Pages) |
| https://iqc-frontend.onrender.com/login | Bản Render static (dự phòng) |

Bật demo thủ công: thêm `?demo=1` hoặc nút “Bật chế độ demo UI” trên login.

## Push → `main`

1. Build + typecheck  
2. Deploy GitHub Pages (demo UI)  
3. Migrate DB + Render API — không chặn UI nếu fail  

## Tắt demo / nối API thật sau

1. Trong `.github/workflows/ci-cd.yml` job Pages: bỏ `VITE_DEMO_MODE`, set `VITE_API_URL`  
2. Backend Live trên Render  
3. Push lại  

## Local

```powershell
$env:VITE_DEMO_MODE="true"; pnpm dev
```
