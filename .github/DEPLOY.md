# CI/CD — GitHub Actions

Repo: **https://github.com/amaccaodev/iqc**  
Frontend test: **https://amaccaodev.github.io/iqc/**  
Backend API: **https://iqc-api-amaccaodev.onrender.com/api**

### Deploy backend Render (bắt buộc cho login)

1. Mở **[Deploy to Render](https://render.com/deploy?repo=https://github.com/amaccaodev/iqc)**
2. Thêm env:
   - `SUPABASE_URL` = `https://mobroigpqtsfbfbvmvwa.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (từ `backend/.env`)
3. Deploy xong → kiểm tra: `https://iqc-api-amaccaodev.onrender.com/health` → `{"status":"ok"}`

> URL cũ `iqc-backend.onrender.com` **không phải** app IQC — đừng dùng.

Workflow: [`.github/workflows/ci-cd.yml`](../workflows/ci-cd.yml)

## Khi nào chạy

| Sự kiện | Build / typecheck | Migrate DB |
|---------|-------------------|------------|
| Pull request → `main` | ✓ | ✗ |
| Push → `main` | ✓ | ✓ |

## Secrets (Settings → Secrets and variables → Actions)

| Secret | Bắt buộc | Mô tả |
|--------|----------|--------|
| `SUPABASE_DB_PASSWORD` | **Có** | Mật khẩu Postgres (Supabase → Project Settings → Database). **Không commit vào repo.** |

## Push lên GitHub lần đầu

```bash
git init
git add .
git commit -m "Initial commit with CI/CD"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Sau đó vào **Settings → Secrets and variables → Actions → New repository secret**:
- Name: `SUPABASE_DB_PASSWORD`
- Value: mật khẩu DB hiện tại

## Thêm migration mới

1. Tạo file SQL trong `supabase/migrations/`:
   ```
   supabase/migrations/20240820000004_ten_migration.sql
   ```
2. Commit + push lên `main`
3. CI tự chạy migration mới (theo bảng `iqc_schema_migrations`)

## Chạy local

```bash
# Windows PowerShell
$env:SUPABASE_DB_PASSWORD="your-password"
pnpm db:migrate

# Seed demo (lần đầu)
$env:RUN_DB_SEED="true"
pnpm db:migrate
```

## Deploy app

Workflow hiện build frontend và upload artifact `frontend-dist`.  
Backend cần host riêng (Railway, Render, VPS…) — set env giống `backend/.env` khi deploy.
