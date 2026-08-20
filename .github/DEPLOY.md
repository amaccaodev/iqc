# CI/CD — GitHub Actions

Repo: **https://github.com/amaccaodev/iqc**

| URL | Mô tả |
|-----|--------|
| https://amaccaodev.github.io/iqc/login | Frontend (GitHub Pages) |
| https://iqc-api-amaccaodev.onrender.com/api | Backend API (Render free) |

Workflow: [`.github/workflows/ci-cd.yml`](../workflows/ci-cd.yml)

## Push → `main` tự động

1. Build frontend + backend
2. Migrate DB Supabase
3. Deploy GitHub Pages
4. Trigger Render deploy (nếu có hook)

Chi tiết setup: [`DEPLOY-FREE.md`](../../DEPLOY-FREE.md)
