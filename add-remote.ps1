# PowerShell script to add remote and push
# Usage: .\add-remote.ps1 <repository-url>

param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryUrl
)

Write-Host "Adding remote origin..." -ForegroundColor Green
git remote add origin $RepositoryUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote added successfully!" -ForegroundColor Green
    Write-Host "Pushing branch to remote..." -ForegroundColor Green
    git push -u origin feat-parallel-agent-coord-PPkrN
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to remote!" -ForegroundColor Green
    } else {
        Write-Host "Push failed. Please check your credentials and try again." -ForegroundColor Red
    }
} else {
    Write-Host "Failed to add remote. It may already exist." -ForegroundColor Yellow
    Write-Host "To update existing remote, run: git remote set-url origin $RepositoryUrl" -ForegroundColor Yellow
}

