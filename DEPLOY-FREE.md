# Deploy miễn phí — GitHub Actions + Render

## Cách hoạt động

**GitHub Actions** (mỗi push `main`):
- Build frontend + backend
- Migrate DB Supabase
- Thử deploy GitHub Pages (chỉ khi repo **public**)

**Render** (free, setup 1 lần):
- Backend API: `iqc-api-amaccaodev`
- Frontend static: `iqc-frontend` *(repo private cần cái này)*

---

## ⚠️ Repo đang PRIVATE

GitHub Pages **miễn phí chỉ cho repo public**.  
Repo `amaccaodev/iqc` private → Pages không deploy được.

**Chọn 1:**

| Cách | Frontend URL |
|------|----------------|
| **A. Public repo** (đơn giản nhất) | https://amaccaodev.github.io/iqc/login |
| **B. Giữ private + Render frontend** | https://iqc-frontend.onrender.com/login |

---

## Setup Render (1 lần, ~5 phút)

1. Mở **https://render.com/deploy?repo=https://github.com/amaccaodev/iqc**
2. Blueprint tạo **2 service**: `iqc-api-amaccaodev` + `iqc-frontend`
3. Backend env (bắt buộc):
   - `SUPABASE_URL` = `https://mobroigpqtsfbfbvmvwa.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = từ `backend/.env`
4. Deploy → đợi cả 2 service **Live**
5. Kiểm tra:
   - API: https://iqc-api-amaccaodev.onrender.com/health → `{"status":"ok"}`
   - App: https://iqc-frontend.onrender.com/login

Render **tự deploy lại** mỗi khi push `main` (connect GitHub).

---

## GitHub Secrets

| Secret | Mô tả |
|--------|--------|
| `SUPABASE_DB_PASSWORD` | Mật khẩu Postgres (migrate DB) |
| `RENDER_DEPLOY_HOOK` | *(tuỳ chọn)* Deploy hook URL |

Variable: `VITE_API_URL` = `https://iqc-api-amaccaodev.onrender.com/api`

---

## Test login

- **Render:** https://iqc-frontend.onrender.com/login
- **GitHub Pages** *(nếu public repo):* https://amaccaodev.github.io/iqc/login
- User: `NV001` / Pass: `123456`

---

## Local

```powershell
pnpm dev:all
# http://localhost:8443
```
