# CI/CD — GitHub Actions

Repo: **https://github.com/amaccaodev/iqc**  
Frontend test: **https://amaccaodev.github.io/iqc/**

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
