# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY IQC.Api/IQC.Api.csproj IQC.Api/
COPY IQC.Application/IQC.Application.csproj IQC.Application/
COPY IQC.Domain/IQC.Domain.csproj IQC.Domain/
COPY IQC.Infrastructure/IQC.Infrastructure.csproj IQC.Infrastructure/

RUN dotnet restore IQC.Api/IQC.Api.csproj

COPY . .
RUN dotnet publish IQC.Api/IQC.Api.csproj -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
COPY IQC.Api/firewall.rules.json ./firewall.rules.json

ENV ASPNETCORE_ENVIRONMENT=Docker
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dotnet", "IQC.Api.dll"]
