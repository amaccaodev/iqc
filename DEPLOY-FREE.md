# Deploy miễn phí qua GitHub

## Luồng tự động (push → `main`)

| Bước | GitHub Actions làm gì |
|------|------------------------|
| 1 | Build **frontend** + **backend** |
| 2 | Chạy SQL migration Supabase |
| 3 | Deploy frontend → **GitHub Pages** |
| 4 | (Tuỳ chọn) Trigger deploy backend Render |

**Frontend:** https://amaccaodev.github.io/iqc/login  
**Backend API:** https://iqc-api-amaccaodev.onrender.com/api

---

## Setup 1 lần

### 1. GitHub Secrets (Settings → Secrets → Actions)

| Secret | Mô tả |
|--------|--------|
| `SUPABASE_DB_PASSWORD` | Mật khẩu Postgres Supabase |
| `RENDER_DEPLOY_HOOK` | *(tuỳ chọn)* URL deploy hook từ Render |

### 2. GitHub Variables

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://iqc-api-amaccaodev.onrender.com/api` |

### 3. Backend Render (free) — bắt buộc cho login

GitHub Pages **chỉ host frontend**. Backend chạy trên Render (free):

1. Mở **https://render.com/deploy?repo=https://github.com/amaccaodev/iqc**
2. Chọn repo → Blueprint dùng `render.yaml` (Docker build backend)
3. Thêm env trên Render:
   - `SUPABASE_URL` = `https://mobroigpqtsfbfbvmvwa.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = copy từ `backend/.env`
4. Deploy → đợi **Live**
5. Kiểm tra: https://iqc-api-amaccaodev.onrender.com/health → `{"status":"ok"}`

**Render tự deploy backend mỗi khi push `main`** (nếu đã connect GitHub).

Deploy hook (tuỳ chọn): Render → Service → Settings → Deploy Hook → copy URL → paste vào secret `RENDER_DEPLOY_HOOK`.

### 4. Bật GitHub Pages

Repo → **Settings → Pages → Source: GitHub Actions**

---

## Test login

- URL: https://amaccaodev.github.io/iqc/login
- User: `NV001` / Pass: `123456`

---

## Local

```powershell
pnpm dev:all
# http://localhost:8443
```
