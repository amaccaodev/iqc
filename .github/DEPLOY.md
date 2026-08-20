# Deploy IQC

## Khuyến nghị: Vercel (frontend + API cùng domain — không CORS)

1. Vào **https://vercel.com/new** → Import repo `amaccaodev/iqc`
2. Thêm **Environment Variables**:
   - `SUPABASE_URL` = `https://mobroigpqtsfbfbvmvwa.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (từ `backend/.env`)
3. Deploy → app chạy tại `https://iqc-xxx.vercel.app`
4. Login: `NV001` / `123456`

API gọi `/api/...` cùng domain — **không cần Render**.

---

## GitHub Pages (chỉ frontend tĩnh)

URL: **https://amaccaodev.github.io/iqc/login**

Cần backend Render riêng — hiện **`iqc-api-amaccaodev.onrender.com` chưa deploy** (`404 no-server`).

1. **https://render.com/deploy?repo=https://github.com/amaccaodev/iqc**
2. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. Kiểm tra: `https://iqc-api-amaccaodev.onrender.com/health` → `{"status":"ok"}`

---

## Local

```bash
pnpm dev:all
# Frontend http://localhost:8443 — API proxy /api → :3001
```
