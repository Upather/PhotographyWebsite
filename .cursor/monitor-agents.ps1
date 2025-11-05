# Real-time Agent Monitor
# Shows live status of all agents with auto-refresh

param(
    [Parameter(Mandatory=$false)]
    [int]$RefreshInterval = 5
)

$ErrorActionPreference = "Continue"

Write-Host "Starting Agent Monitor (Press Ctrl+C to stop)`n" -ForegroundColor Cyan

while ($true) {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Agent Status Monitor - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    & "$PSScriptRoot/orchestration.ps1" -Action status
    
    Write-Host ""
    Write-Host "Pending Tasks:" -ForegroundColor Cyan
    & "$PSScriptRoot/orchestration.ps1" -Action get-tasks
    
    Write-Host ""
    Write-Host "Refreshing in $RefreshInterval seconds... (Ctrl+C to stop)" -ForegroundColor Gray
    Start-Sleep -Seconds $RefreshInterval
}

