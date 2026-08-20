# Deploy miễn phí — IQC

## ✅ Live test (Vercel — miễn phí)

**App:** https://iqc-app-phi.vercel.app/login  
**Login:** `NV001` / `123456`

Frontend + API cùng domain — không CORS.

---

## Tự deploy trên tài khoản Vercel của bạn

**Import 1 click:** https://vercel.com/new/clone?repository-url=https://github.com/amaccaodev/iqc

### Bước làm (5 phút)

1. Mở link trên → **Sign in with GitHub**
2. **Environment Variables** → thêm:
   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | `https://mobroigpqtsfbfbvmvwa.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | copy từ `backend/.env` |
3. Bấm **Deploy** → đợi ~2 phút
4. Mở URL Vercel (vd. `https://iqc-xxx.vercel.app/login`)
5. Login test: **NV001** / **123456**

Frontend + API cùng domain (`/api/...`) — **không cần Render, không CORS**.

---

## Render (chỉ backend — nếu vẫn dùng GitHub Pages)

Blueprint: `deploy/render.yaml`  
Deploy: https://render.com/deploy?repo=https://github.com/amaccaodev/iqc

Frontend GitHub Pages: https://amaccaodev.github.io/iqc/login

---

## Local

```powershell
pnpm dev:all
# http://localhost:8443
```
