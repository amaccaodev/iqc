# IQC Backend — C# .NET 8 + EF Core + MySQL

Backend thay thế Node.js/Express, giữ nguyên API contract cho frontend React.

## Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Runtime | .NET 8 |
| ORM | EF Core 8 + Pomelo MySQL |
| Database | MySQL 8.0 |
| Cache | Redis 7 (optional) |
| Container | Docker Compose |

## Chạy bằng Docker Compose (khuyến nghị)

```bash
cd backend-dotnet

# Tùy chọn: copy và chỉnh biến môi trường
cp .env.example .env

# Build + chạy MySQL + Redis + API
docker compose up --build -d

# Xem log
docker compose logs -f api
```

Sau khi chạy:
- **API**: http://localhost:3001
- **Health**: http://localhost:3001/health
- **MySQL**: localhost:3306 (user/pass: `iqc`/`iqc`)
- **Redis**: localhost:6379

Migration + seed tự động khi container API khởi động (`Database__AutoMigrate=true`).

**Tài khoản demo** (password: `123`): GD001, QD001, TT001, CN001, QC001

```bash
# Dừng
docker compose down

# Dừng + xóa volume DB
docker compose down -v
```

## Chạy local (không Docker)

Yêu cầu: .NET 8 SDK, MySQL 8.

```bash
cd backend-dotnet

# Tạo DB
mysql -u root -p -e "CREATE DATABASE iqc CHARACTER SET utf8mb4; CREATE USER 'iqc'@'%' IDENTIFIED BY 'iqc'; GRANT ALL ON iqc.* TO 'iqc'@'%';"

# Cấu hình connection trong IQC.Api/appsettings.Development.json
dotnet ef database update --project IQC.Infrastructure --startup-project IQC.Api
dotnet run --project IQC.Api
```

Hoặc từ root project: `pnpm dev:backend:dotnet`

## Kiến trúc

```
IQC.Api/              → Controllers, Middleware, Docker
IQC.Application/      → DTOs, Interfaces, BaseService
IQC.Domain/           → Entities, Enums, IRepository
IQC.Infrastructure/   → EF Core MySQL, Cache, Auth, Services
docker/               → MySQL init scripts
docker-compose.yml    → MySQL + Redis + API
```

## EF Core Migrations

```bash
# Thêm migration mới
dotnet ef migrations add <TenMigration> --project IQC.Infrastructure --startup-project IQC.Api

# Apply vào DB
dotnet ef database update --project IQC.Infrastructure --startup-project IQC.Api
```

## Docker services

| Service | Image | Port |
|---------|-------|------|
| `mysql` | mysql:8.0 | 3306 |
| `redis` | redis:7-alpine | 6379 |
| `api` | build from Dockerfile | 3001 |
