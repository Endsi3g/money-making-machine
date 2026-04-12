# Backup Script for PostgreSQL (Windows PowerShell)
# Usage: .\scripts\backup-postgres.ps1

$Date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupFolder = "backups"
$Filename = "mmm_postgres_$Date.sql"
$CompressedFile = "$Filename.gz"

# Create backup folder if not exists
if (!(Test-Path $BackupFolder)) {
    New-Item -ItemType Directory $BackupFolder
}

# Ensure pg_dump is in PATH or use direct path
# If using Docker, use: docker exec -t <container_name> pg_dumpall -c -U <user> > $BackupFolder\$Filename
# Here we assume a local or connection string approach

$DbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL")

if (-not $DbUrl) {
    Write-Error "DATABASE_URL environment variable is missing"
    exit 1
}

Write-Host "Starting backup to $BackupFolder\$Filename..."

# Simple pg_dump (requires postgresql-client installed)
# We use --no-owner --no-privileges to make it portable
& pg_dump "$DbUrl" --no-owner --no-privileges > "$BackupFolder\$Filename"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful. Compressing..."
    # requires 7zip or builtin Compress-Archive (PowerShell 5+)
    Compress-Archive -Path "$BackupFolder\$Filename" -DestinationPath "$BackupFolder\$CompressedFile" -Force
    Remove-Item "$BackupFolder\$Filename"
    Write-Host "Success: $BackupFolder\$CompressedFile"
} else {
    Write-Error "Backup failed (Exit Code: $LASTEXITCODE)"
}
