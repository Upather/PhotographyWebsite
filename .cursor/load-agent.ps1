# Load Agent Configuration and Initialize Persistent Session
# This script loads agent configuration and sets up environment for persistent agent use

param(
    [Parameter(Mandatory=$false)]
    [int]$AgentId = 0
)

$ErrorActionPreference = "Stop"
$AgentsConfig = ".cursor/agents.json"

# Get agent ID from file if not provided
if ($AgentId -eq 0) {
    if (Test-Path ".agent-id") {
        $AgentId = [int](Get-Content ".agent-id" -Raw).Trim()
    } else {
        Write-Host "No agent ID found. Run setup-worktree first." -ForegroundColor Red
        exit 1
    }
}

# Load agent configuration
if (-not (Test-Path $AgentsConfig)) {
    Write-Host "Agents configuration not found: $AgentsConfig" -ForegroundColor Red
    exit 1
}

$config = Get-Content $AgentsConfig -Raw | ConvertFrom-Json
$agent = $config.agents | Where-Object { $_.id -eq $AgentId }

if (-not $agent) {
    Write-Host "Agent ID $AgentId not found in configuration." -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Agent $($agent.id): $($agent.name)" -ForegroundColor Cyan
Write-Host "Role: $($agent.role)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Agent Prompt/Instructions:" -ForegroundColor Yellow
Write-Host $agent.prompt -ForegroundColor White
Write-Host "`n"

Write-Host "Assigned Files:" -ForegroundColor Yellow
foreach ($file in $agent.assignedFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (not found)" -ForegroundColor Red
    }
}

Write-Host "`nFocus Areas:" -ForegroundColor Yellow
foreach ($area in $agent.focusAreas) {
    Write-Host "  • $area" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan

# Initialize orchestration
Write-Host "`nInitializing orchestration..." -ForegroundColor Cyan
& "$PSScriptRoot/orchestration.ps1" -Action start

# Save agent info to environment for Cursor to use
$agentInfo = @{
    agentId = $agent.id
    agentName = $agent.name
    agentRole = $agent.role
    prompt = $agent.prompt
    assignedFiles = $agent.assignedFiles
    focusAreas = $agent.focusAreas
} | ConvertTo-Json -Depth 10

Set-Content -Path ".cursor/current-agent.json" -Value $agentInfo -NoNewline

Write-Host "`n✓ Agent configuration loaded and orchestration started" -ForegroundColor Green
Write-Host "`nYou can now continue working with this agent. The agent will:" -ForegroundColor Cyan
Write-Host "  • Maintain its identity and role" -ForegroundColor White
Write-Host "  • Send heartbeat signals to show it's active" -ForegroundColor White
Write-Host "  • Receive tasks from other agents" -ForegroundColor White
Write-Host "  • Coordinate with other agents" -ForegroundColor White
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  • Check status: .\.cursor\orchestration.ps1 -Action status" -ForegroundColor White
Write-Host "  • Get tasks: .\.cursor\orchestration.ps1 -Action get-tasks" -ForegroundColor White
Write-Host "  • Stop agent: .\.cursor\orchestration.ps1 -Action stop" -ForegroundColor White

