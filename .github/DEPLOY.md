# CI/CD — GitHub Actions

Repo: **https://github.com/amaccaodev/iqc**

| URL | Mô tả |
|-----|--------|
| https://iqc-frontend.onrender.com/login | Frontend DEMO UI (Render — không cần API) |
| https://amaccaodev.github.io/iqc/login | GitHub Pages *(chỉ khi repo public)* |
| https://iqc-api-amaccaodev.onrender.com/api | Backend API *(tuỳ chọn)* |

Workflow: [`.github/workflows/ci-cd.yml`](../workflows/ci-cd.yml)

## Push → `main`

1. Build frontend + backend (typecheck)
2. Deploy UI demo (`VITE_DEMO_MODE=true`) — Pages / Render static
3. Migrate DB + trigger Render API — không chặn UI nếu fail

Chi tiết: [`DEPLOY-FREE.md`](../../DEPLOY-FREE.md)
