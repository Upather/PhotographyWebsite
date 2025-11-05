# Agent Orchestration Script for Windows
# Manages persistent agent state, heartbeat, and task coordination

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "heartbeat", "assign-task", "get-tasks", "cleanup")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [int]$AgentId = 0,
    
    [Parameter(Mandatory=$false)]
    [string]$Task = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Payload = ""
)

$ErrorActionPreference = "Stop"
$CoordDir = ".cursor/coordination"
$StateDir = ".cursor/agent-state"
$AgentsConfig = ".cursor/agents.json"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $CoordDir | Out-Null
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

function Get-AgentConfig {
    if (Test-Path $AgentsConfig) {
        return Get-Content $AgentsConfig -Raw | ConvertFrom-Json
    }
    return $null
}

function Get-AgentId {
    if (Test-Path ".agent-id") {
        $id = Get-Content ".agent-id" -Raw
        return [int]$id.Trim()
    }
    return $null
}

function Update-Heartbeat {
    $agentId = Get-AgentId
    if (-not $agentId) {
        Write-Host "No agent ID found. Run setup-worktree first." -ForegroundColor Red
        return $false
    }
    
    $heartbeatFile = "$StateDir/agent-$agentId.heartbeat"
    $timestamp = (Get-Date).ToUniversalTime().ToString('o')
    $heartbeat = @{
        agentId = $agentId
        timestamp = $timestamp
        status = "active"
        pid = $PID
    } | ConvertTo-Json
    
    Set-Content -Path $heartbeatFile -Value $heartbeat -NoNewline
    return $true
}

function Get-AgentStatus {
    $config = Get-AgentConfig
    if (-not $config) { return }
    
    $statuses = @()
    foreach ($agent in $config.agents) {
        $heartbeatFile = "$StateDir/agent-$($agent.id).heartbeat"
        $status = @{
            id = $agent.id
            name = $agent.name
            role = $agent.role
            active = $false
            lastHeartbeat = $null
            age = $null
        }
        
        if (Test-Path $heartbeatFile) {
            try {
                $heartbeat = Get-Content $heartbeatFile -Raw | ConvertFrom-Json
                $heartbeatTime = [DateTime]::Parse($heartbeat.timestamp)
                $age = ((Get-Date).ToUniversalTime() - $heartbeatTime).TotalSeconds
                $timeout = $config.orchestration.heartbeatTimeoutSeconds
                
                $status.active = $age -lt $timeout
                $status.lastHeartbeat = $heartbeat.timestamp
                $status.age = [math]::Round($age, 1)
            } catch {
                $status.active = $false
            }
        }
        
        $statuses += $status
    }
    
    return $statuses
}

function Add-Task {
    param(
        [int]$TargetAgentId,
        [string]$TaskType,
        [string]$TaskPayload
    )
    
    $taskFile = "$CoordDir/task-$(Get-Date -Format 'yyyyMMddHHmmss')-$TargetAgentId.json"
    $task = @{
        id = [System.Guid]::NewGuid().ToString()
        targetAgentId = $TargetAgentId
        taskType = $TaskType
        payload = $TaskPayload
        created = (Get-Date).ToUniversalTime().ToString('o')
        status = "pending"
        assignedTo = $null
    } | ConvertTo-Json -Depth 10
    
    Set-Content -Path $taskFile -Value $task -NoNewline
    Write-Host "✓ Task created: $taskFile" -ForegroundColor Green
    return $taskFile
}

function Get-Tasks {
    param([int]$AgentId = 0)
    
    $tasks = @()
    $taskFiles = Get-ChildItem -Path $CoordDir -Filter "task-*.json" | Sort-Object LastWriteTime
    
    foreach ($file in $taskFiles) {
        try {
            $task = Get-Content $file.FullName -Raw | ConvertFrom-Json
            if ($AgentId -eq 0 -or $task.targetAgentId -eq $AgentId) {
                if ($task.status -eq "pending") {
                    $tasks += $task
                }
            }
        } catch {
            # Skip invalid task files
        }
    }
    
    return $tasks
}

function Mark-TaskComplete {
    param(
        [string]$TaskId,
        [string]$Result = ""
    )
    
    $taskFiles = Get-ChildItem -Path $CoordDir -Filter "task-*.json"
    foreach ($file in $taskFiles) {
        try {
            $task = Get-Content $file.FullName -Raw | ConvertFrom-Json
            if ($task.id -eq $TaskId) {
                $task.status = "completed"
                $task.completed = (Get-Date).ToUniversalTime().ToString('o')
                $task.result = $Result
                $task | ConvertTo-Json -Depth 10 | Set-Content -Path $file.FullName -NoNewline
                Write-Host "✓ Task $TaskId marked as completed" -ForegroundColor Green
                return $true
            }
        } catch {
            # Continue
        }
    }
    return $false
}

function Cleanup-OldFiles {
    $config = Get-AgentConfig
    if (-not $config) { return }
    
    $retentionHours = $config.communication.messageRetentionHours
    $cutoffTime = (Get-Date).AddHours(-$retentionHours)
    $cleaned = 0
    
    # Clean old tasks
    $taskFiles = Get-ChildItem -Path $CoordDir -Filter "task-*.json"
    foreach ($file in $taskFiles) {
        try {
            $task = Get-Content $file.FullName -Raw | ConvertFrom-Json
            $taskTime = [DateTime]::Parse($task.created)
            if ($taskTime -lt $cutoffTime -and $task.status -ne "pending") {
                Remove-Item $file.FullName -Force
                $cleaned++
            }
        } catch {
            # Remove invalid files
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            $cleaned++
        }
    }
    
    # Clean stale heartbeats
    $heartbeatFiles = Get-ChildItem -Path $StateDir -Filter "agent-*.heartbeat"
    foreach ($file in $heartbeatFiles) {
        try {
            $heartbeat = Get-Content $file.FullName -Raw | ConvertFrom-Json
            $heartbeatTime = [DateTime]::Parse($heartbeat.timestamp)
            $age = ((Get-Date).ToUniversalTime() - $heartbeatTime).TotalSeconds
            if ($age -gt ($config.orchestration.heartbeatTimeoutSeconds * 2)) {
                Remove-Item $file.FullName -Force
                $cleaned++
            }
        } catch {
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            $cleaned++
        }
    }
    
    Write-Host "✓ Cleaned $cleaned old files" -ForegroundColor Green
}

# Main action handler
switch ($Action) {
    "start" {
        $agentId = Get-AgentId
        if (-not $agentId) {
            Write-Host "No agent ID found. Run setup-worktree first." -ForegroundColor Red
            exit 1
        }
        Update-Heartbeat | Out-Null
        Write-Host "✓ Agent $agentId started and heartbeat initialized" -ForegroundColor Green
        
        # Start background heartbeat loop
        $heartbeatScript = @"
while (`$true) {
    `$config = Get-Content '$AgentsConfig' -Raw | ConvertFrom-Json
    Update-Heartbeat
    Start-Sleep -Seconds `$config.orchestration.heartbeatIntervalSeconds
}
"@
        $scriptBlock = [scriptblock]::Create($heartbeatScript)
        Start-Job -ScriptBlock $scriptBlock -Name "Agent-Heartbeat-$agentId" | Out-Null
        Write-Host "✓ Background heartbeat started" -ForegroundColor Green
    }
    
    "stop" {
        $agentId = Get-AgentId
        if ($agentId) {
            Get-Job -Name "Agent-Heartbeat-$agentId" | Stop-Job
            Get-Job -Name "Agent-Heartbeat-$agentId" | Remove-Job
            $heartbeatFile = "$StateDir/agent-$agentId.heartbeat"
            if (Test-Path $heartbeatFile) {
                Remove-Item $heartbeatFile -Force
            }
            Write-Host "✓ Agent $agentId stopped" -ForegroundColor Green
        }
    }
    
    "heartbeat" {
        if (Update-Heartbeat) {
            Write-Host "✓ Heartbeat updated" -ForegroundColor Green
        }
    }
    
    "status" {
        $statuses = Get-AgentStatus
        Write-Host "`nAgent Status:" -ForegroundColor Cyan
        Write-Host ("=" * 80)
        foreach ($status in $statuses) {
            $statusColor = if ($status.active) { "Green" } else { "Red" }
            $activeText = if ($status.active) { "ACTIVE" } else { "INACTIVE" }
            Write-Host ("Agent $($status.id): $($status.name) [$($status.role)] - $activeText" -ForegroundColor $statusColor)
            if ($status.lastHeartbeat) {
                Write-Host ("  Last heartbeat: $($status.lastHeartbeat) ($($status.age)s ago)" -ForegroundColor Gray)
            }
        }
        Write-Host ("=" * 80) -ForegroundColor Cyan
    }
    
    "assign-task" {
        if (-not $AgentId -or -not $Task) {
            Write-Host "Usage: .\orchestration.ps1 -Action assign-task -AgentId <id> -Task <task-type> [-Payload <json>]" -ForegroundColor Yellow
            exit 1
        }
        Add-Task -TargetAgentId $AgentId -TaskType $Task -TaskPayload $Payload
    }
    
    "get-tasks" {
        $tasks = Get-Tasks -AgentId $AgentId
        if ($tasks.Count -eq 0) {
            Write-Host "No pending tasks found" -ForegroundColor Yellow
        } else {
            Write-Host "`nPending Tasks:" -ForegroundColor Cyan
            foreach ($task in $tasks) {
                Write-Host ("  Task: $($task.taskType) -> Agent $($task.targetAgentId) [ID: $($task.id)]" -ForegroundColor White)
                if ($task.payload) {
                    Write-Host ("    Payload: $($task.payload)" -ForegroundColor Gray)
                }
            }
        }
    }
    
    "cleanup" {
        Cleanup-OldFiles
    }
}

