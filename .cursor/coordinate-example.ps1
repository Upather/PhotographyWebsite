# Example: How to Coordinate Between Agents
# This script demonstrates common coordination patterns

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("assign", "check", "example")]
    [string]$Action
)

$ErrorActionPreference = "Stop"

Write-Host "`nAgent Coordination Examples`n" -ForegroundColor Cyan

switch ($Action) {
    "assign" {
        Write-Host "Assign a task to an agent:" -ForegroundColor Yellow
        Write-Host "  .\.cursor\orchestration.ps1 -Action assign-task -AgentId <id> -Task <task-type> -Payload '<json>'" -ForegroundColor White
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        
        Write-Host "`n1. Agent 2 asks Agent 1 to generate SEO metadata:" -ForegroundColor Cyan
        Write-Host '  .\.cursor\orchestration.ps1 -Action assign-task -AgentId 1 -Task "generate-seo" -Payload ''{"imageId": "img123", "title": "Sunset Photo"}''' -ForegroundColor White
        
        Write-Host "`n2. Agent 1 asks Agent 3 to verify admin permissions:" -ForegroundColor Cyan
        Write-Host '  .\.cursor\orchestration.ps1 -Action assign-task -AgentId 3 -Task "check-permissions" -Payload ''{"userId": "user123"}''' -ForegroundColor White
        
        Write-Host "`n3. Agent 3 asks Agent 4 to test contact form:" -ForegroundColor Cyan
        Write-Host '  .\.cursor\orchestration.ps1 -Action assign-task -AgentId 4 -Task "test-form" -Payload ''{"formType": "contact"}''' -ForegroundColor White
    }
    
    "check" {
        Write-Host "Checking for pending tasks...`n" -ForegroundColor Cyan
        & "$PSScriptRoot/orchestration.ps1" -Action get-tasks
    }
    
    "example" {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Common Coordination Scenarios" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "SCENARIO 1: Adding New Image to Gallery" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host "1. Agent 3 (Admin) uploads image → Creates Firestore doc" -ForegroundColor White
        Write-Host "2. Agent 3 assigns task to Agent 1:" -ForegroundColor White
        Write-Host '   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 1 -Task "extract-metadata" -Payload ''{"imageId": "new123"}''' -ForegroundColor Cyan
        Write-Host "3. Agent 1 extracts EXIF and generates SEO metadata" -ForegroundColor White
        Write-Host "4. Agent 1 assigns task to Agent 2:" -ForegroundColor White
        Write-Host '   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "refresh-gallery" -Payload ''{"action": "update"}''' -ForegroundColor Cyan
        Write-Host "5. Agent 2 updates gallery display" -ForegroundColor White
        Write-Host "6. Agent 2 assigns task to Agent 4:" -ForegroundColor White
        Write-Host '   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 4 -Task "add-sharing" -Payload ''{"imageId": "new123"}''' -ForegroundColor Cyan
        Write-Host "7. Agent 4 adds social sharing buttons`n" -ForegroundColor White
        
        Write-Host "SCENARIO 2: Bug Fixing" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host "1. Agent 2 notices gallery filtering bug" -ForegroundColor White
        Write-Host "2. Agent 2 checks if it's related to metadata:" -ForegroundColor White
        Write-Host '   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 1 -Task "check-metadata" -Payload ''{"issue": "filtering"}''' -ForegroundColor Cyan
        Write-Host "3. Agent 1 verifies metadata structure" -ForegroundColor White
        Write-Host "4. Agents coordinate to fix the issue`n" -ForegroundColor White
        
        Write-Host "SCENARIO 3: Performance Optimization" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host "1. All agents work independently on their areas:" -ForegroundColor White
        Write-Host "   • Agent 2 optimizes image loading" -ForegroundColor White
        Write-Host "   • Agent 1 optimizes metadata queries" -ForegroundColor White
        Write-Host "   • Agent 3 optimizes Firebase queries" -ForegroundColor White
        Write-Host "   • Agent 4 optimizes form submissions" -ForegroundColor White
        Write-Host "2. Agents coordinate final integration" -ForegroundColor White
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan

