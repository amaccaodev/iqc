# migrate_via_cli.ps1 — Chạy migration SQL qua Supabase CLI
# Cách dùng: .\scripts\migrate_via_cli.ps1

$PROJECT_REF = "mobroigpqtsfbfbvmvwa"
$DB_PASSWORD  = Read-Host -Prompt "Nhập database password (xem trong Supabase > Project Settings > Database)"

$env:PGPASSWORD = $DB_PASSWORD
$HOST = "aws-0-ap-southeast-1.pooler.supabase.com"
$PORT = "6543"
$DB   = "postgres"
$USER = "postgres.$PROJECT_REF"

Write-Host "`nChạy migration 001..." -ForegroundColor Cyan
psql -h $HOST -p $PORT -d $DB -U $USER -f "d:\IQC\supabase\migration_001_iqc.sql"

Write-Host "`nChạy migration 002..." -ForegroundColor Cyan
psql -h $HOST -p $PORT -d $DB -U $USER -f "d:\IQC\supabase\migration_002_workflow.sql"

Write-Host "`nDone!" -ForegroundColor Green
