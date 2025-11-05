# Setup Script: Create 4 Parallel Agent Worktrees
# This script helps you set up all 4 agents in parallel worktrees

param(
    [Parameter(Mandatory=$false)]
    [switch]$AutoCreate,
    
    [Parameter(Mandatory=$false)]
    [string]$BasePath = "."
)

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Parallel Agent Setup for Photography Project" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository. Please run this from the project root." -ForegroundColor Red
    exit 1
}

# Check if agents.json exists
if (-not (Test-Path ".cursor/agents.json")) {
    Write-Host "Error: Agent configuration not found. Please ensure .cursor/agents.json exists." -ForegroundColor Red
    exit 1
}

$agents = Get-Content ".cursor/agents.json" -Raw | ConvertFrom-Json

Write-Host "This script will help you set up 4 agents:" -ForegroundColor Yellow
foreach ($agent in $agents.agents) {
    Write-Host "  Agent $($agent.id): $($agent.name) [$($agent.role)]" -ForegroundColor White
}

Write-Host "`nOptions:" -ForegroundColor Cyan
Write-Host "  1. Manual Setup Guide (Recommended - shows you how to set up each worktree)" -ForegroundColor White
Write-Host "  2. Check Current Status (see which agents are already active)" -ForegroundColor White
Write-Host "  3. Cleanup Stale Agents (remove inactive agent locks)" -ForegroundColor White
Write-Host "  4. Exit" -ForegroundColor White

$choice = Read-Host "`nSelect an option (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "Manual Setup Guide" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "To run 4 agents in parallel, you need 4 separate terminal windows." -ForegroundColor Yellow
        Write-Host "Each terminal will have its own worktree with an assigned agent.`n" -ForegroundColor Yellow
        
        Write-Host "STEP 1: Open 4 Terminal Windows" -ForegroundColor Green
        Write-Host "Open 4 separate PowerShell or terminal windows.`n" -ForegroundColor White
        
        Write-Host "STEP 2: Create Worktrees" -ForegroundColor Green
        Write-Host "In each terminal, navigate to the project and the worktree setup will:" -ForegroundColor White
        Write-Host "  • Assign an agent ID (1-4)" -ForegroundColor White
        Write-Host "  • Load the agent configuration automatically" -ForegroundColor White
        Write-Host "  • Start the heartbeat system`n" -ForegroundColor White
        
        Write-Host "For each terminal, run:" -ForegroundColor Yellow
        Write-Host "  cd $((Get-Location).Path)" -ForegroundColor Cyan
        Write-Host "  # The worktree setup will run automatically when Cursor creates the worktree`n" -ForegroundColor Gray
        
        Write-Host "STEP 3: Verify Setup" -ForegroundColor Green
        Write-Host "In any terminal, check agent status:" -ForegroundColor White
        Write-Host "  .\.cursor\orchestration.ps1 -Action status`n" -ForegroundColor Cyan
        
        Write-Host "STEP 4: Start Working" -ForegroundColor Green
        Write-Host "Each agent will:" -ForegroundColor White
        Write-Host "  • Remember its role and responsibilities" -ForegroundColor White
        Write-Host "  • Focus on its assigned files" -ForegroundColor White
        Write-Host "  • Coordinate with other agents via task queue`n" -ForegroundColor White
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Agent Assignments:" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        
        foreach ($agent in $agents.agents) {
            Write-Host "`nAgent $($agent.id): $($agent.name)" -ForegroundColor Yellow
            Write-Host "  Role: $($agent.role)" -ForegroundColor White
            Write-Host "  Files:" -ForegroundColor White
            foreach ($file in $agent.assignedFiles) {
                Write-Host "    • $file" -ForegroundColor Gray
            }
            Write-Host "  Focus:" -ForegroundColor White
            foreach ($area in $agent.focusAreas) {
                Write-Host "    • $area" -ForegroundColor Gray
            }
        }
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "Tips for Effective Parallel Work:" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "1. Each agent works on different files (no conflicts!)" -ForegroundColor Green
        Write-Host "2. Use task queue for coordination:" -ForegroundColor Green
        Write-Host "   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task `"update-gallery`"" -ForegroundColor Cyan
        Write-Host "3. Monitor all agents:" -ForegroundColor Green
        Write-Host "   .\.cursor\orchestration.ps1 -Action status" -ForegroundColor Cyan
        Write-Host "4. Check pending tasks:" -ForegroundColor Green
        Write-Host "   .\.cursor\orchestration.ps1 -Action get-tasks" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host "`nChecking agent status...`n" -ForegroundColor Cyan
        & "$PSScriptRoot/orchestration.ps1" -Action status
    }
    
    "3" {
        Write-Host "`nCleaning up stale agents...`n" -ForegroundColor Cyan
        & "$PSScriptRoot/orchestration.ps1" -Action cleanup
        
        # Also clean up lock files
        $coordParent = ".."
        $cleaned = 0
        for ($i = 1; $i -le 8; $i++) {
            $lockFile = "$coordParent/.coord-$i.lock"
            if (Test-Path $lockFile) {
                try {
                    $lockContent = Get-Content $lockFile -Raw -ErrorAction SilentlyContinue
                    if ($lockContent) {
                        $lockTime = [DateTime]::Parse($lockContent.Trim())
                        $age = ((Get-Date).ToUniversalTime() - $lockTime).TotalMinutes
                        if ($age -gt 30) {
                            Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
                            $cleaned++
                            Write-Host "Removed stale lock: Agent $i (${age} minutes old)" -ForegroundColor Yellow
                        }
                    }
                } catch {
                    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
                    $cleaned++
                }
            }
        }
        Write-Host "`n✓ Cleanup complete. Removed $cleaned stale locks." -ForegroundColor Green
    }
    
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

