# Backup Script for Redis (Windows PowerShell)
# Usage: .\scripts\backup-redis.ps1

$Date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupFolder = "backups"
$Filename = "mmm_redis_$Date.rdb"

# Create backup folder if not exists
if (!(Test-Path $BackupFolder)) {
    New-Item -ItemType Directory $BackupFolder
}

Write-Host "Triggering Redis BGSAVE..."
& redis-cli BGSAVE

Write-Host "Waiting for Redis to finish saving (simple 5s wait)..."
Start-Sleep -Seconds 5

# Assume dump.rdb is in current directory or fixed path
# Usually Redis on Windows (Memurai/MSOpenTech) has a fixed data directory
$RedisDumpPath = "dump.rdb" 

if (Test-Path $RedisDumpPath) {
    Copy-Item $RedisDumpPath "$BackupFolder\$Filename"
    Write-Host "Success: $BackupFolder\$Filename"
} else {
    Write-Error "Redis dump.rdb not found. Ensure redis-cli is in PATH and check redis config for dbfilename/dir."
}
