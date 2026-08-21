# CI/CD — GitHub Actions

Repo: **https://github.com/amaccaodev/iqc** (public)

| URL | Mô tả |
|-----|--------|
| https://amaccaodev.github.io/iqc/login | Frontend DEMO UI (GitHub Pages) |
| https://iqc-api-amaccaodev.onrender.com/api | Backend API *(tuỳ chọn)* |

Workflow: [`.github/workflows/ci-cd.yml`](../workflows/ci-cd.yml)

## Push → `main`

1. Build frontend + backend  
2. Deploy GitHub Pages (`VITE_DEMO_MODE=true`)  
3. Migrate DB + trigger Render API — không chặn UI nếu fail  

Chi tiết: [`DEPLOY-FREE.md`](../../DEPLOY-FREE.md)
