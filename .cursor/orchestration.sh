#!/bin/bash
# Agent Orchestration Script for Unix/Linux/Mac
# Manages persistent agent state, heartbeat, and task coordination

set -e

ACTION="${1:-}"
AGENT_ID="${2:-0}"
TASK_TYPE="${3:-}"
TASK_PAYLOAD="${4:-}"

COORD_DIR=".cursor/coordination"
STATE_DIR=".cursor/agent-state"
AGENTS_CONFIG=".cursor/agents.json"

# Ensure directories exist
mkdir -p "$COORD_DIR" "$STATE_DIR"

get_agent_id() {
    if [ -f ".agent-id" ]; then
        cat .agent-id | tr -d '\n'
    else
        echo ""
    fi
}

update_heartbeat() {
    local agent_id=$(get_agent_id)
    if [ -z "$agent_id" ]; then
        echo "No agent ID found. Run setup-worktree first." >&2
        return 1
    fi
    
    local heartbeat_file="$STATE_DIR/agent-$agent_id.heartbeat"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
    
    cat > "$heartbeat_file" <<EOF
{
  "agentId": $agent_id,
  "timestamp": "$timestamp",
  "status": "active",
  "pid": $$
}
EOF
    return 0
}

get_agent_status() {
    if [ ! -f "$AGENTS_CONFIG" ]; then
        return
    fi
    
    # Parse JSON (simple approach - requires jq or python)
    if command -v jq >/dev/null 2>&1; then
        local agents=$(jq -r '.agents[] | "\(.id)|\(.name)|\(.role)"' "$AGENTS_CONFIG")
        echo "$agents" | while IFS='|' read -r id name role; do
            local heartbeat_file="$STATE_DIR/agent-$id.heartbeat"
            local active="false"
            local last_heartbeat=""
            local age=""
            
            if [ -f "$heartbeat_file" ]; then
                local timestamp=$(jq -r '.timestamp' "$heartbeat_file" 2>/dev/null || echo "")
                if [ -n "$timestamp" ]; then
                    local heartbeat_epoch=$(date -d "$timestamp" +%s 2>/dev/null || echo 0)
                    local current_epoch=$(date +%s)
                    local age_seconds=$((current_epoch - heartbeat_epoch))
                    local timeout=$(jq -r '.orchestration.heartbeatTimeoutSeconds' "$AGENTS_CONFIG" 2>/dev/null || echo 60)
                    
                    if [ $age_seconds -lt $timeout ]; then
                        active="true"
                        last_heartbeat="$timestamp"
                        age="$age_seconds"
                    fi
                fi
            fi
            
            echo "Agent $id: $name [$role] - $([ "$active" = "true" ] && echo "ACTIVE" || echo "INACTIVE")"
            if [ -n "$last_heartbeat" ]; then
                echo "  Last heartbeat: $last_heartbeat (${age}s ago)"
            fi
        done
    else
        echo "Note: jq is required for status display. Install with: brew install jq (Mac) or apt-get install jq (Linux)"
    fi
}

add_task() {
    local target_agent_id="$1"
    local task_type="$2"
    local task_payload="${3:-}"
    
    local task_file="$COORD_DIR/task-$(date +%Y%m%d%H%M%S)-$target_agent_id.json"
    local task_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(date +%s)-$RANDOM")
    local created=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
    
    cat > "$task_file" <<EOF
{
  "id": "$task_id",
  "targetAgentId": $target_agent_id,
  "taskType": "$task_type",
  "payload": "$task_payload",
  "created": "$created",
  "status": "pending",
  "assignedTo": null
}
EOF
    echo "✓ Task created: $task_file"
}

get_tasks() {
    local agent_id="${1:-0}"
    
    find "$COORD_DIR" -name "task-*.json" -type f | sort | while read -r file; do
        if command -v jq >/dev/null 2>&1; then
            local target_id=$(jq -r '.targetAgentId' "$file" 2>/dev/null || echo "0")
            local status=$(jq -r '.status' "$file" 2>/dev/null || echo "")
            
            if [ "$status" = "pending" ]; then
                if [ "$agent_id" = "0" ] || [ "$target_id" = "$agent_id" ]; then
                    local task_type=$(jq -r '.taskType' "$file" 2>/dev/null || echo "")
                    local task_id=$(jq -r '.id' "$file" 2>/dev/null || echo "")
                    echo "Task: $task_type -> Agent $target_id [ID: $task_id]"
                fi
            fi
        fi
    done
}

cleanup_old_files() {
    if [ ! -f "$AGENTS_CONFIG" ]; then
        return
    fi
    
    local retention_hours=$(jq -r '.communication.messageRetentionHours // 24' "$AGENTS_CONFIG" 2>/dev/null || echo 24)
    local cutoff_epoch=$(($(date +%s) - retention_hours * 3600))
    local cleaned=0
    
    # Clean old tasks
    find "$COORD_DIR" -name "task-*.json" -type f | while read -r file; do
        local created=$(jq -r '.created' "$file" 2>/dev/null || echo "")
        if [ -n "$created" ]; then
            local created_epoch=$(date -d "$created" +%s 2>/dev/null || echo 0)
            local status=$(jq -r '.status' "$file" 2>/dev/null || echo "")
            
            if [ $created_epoch -lt $cutoff_epoch ] && [ "$status" != "pending" ]; then
                rm -f "$file"
                cleaned=$((cleaned + 1))
            fi
        fi
    done
    
    echo "✓ Cleaned $cleaned old files"
}

# Main action handler
case "$ACTION" in
    start)
        update_heartbeat || exit 1
        echo "✓ Agent $(get_agent_id) started and heartbeat initialized"
        
        # Start background heartbeat loop
        (
            while true; do
                update_heartbeat
                local interval=$(jq -r '.orchestration.heartbeatIntervalSeconds // 10' "$AGENTS_CONFIG" 2>/dev/null || echo 10)
                sleep "$interval"
            done
        ) &
        echo $! > "$STATE_DIR/heartbeat-$(get_agent_id).pid"
        echo "✓ Background heartbeat started (PID: $(cat "$STATE_DIR/heartbeat-$(get_agent_id).pid"))"
        ;;
        
    stop)
        local agent_id=$(get_agent_id)
        if [ -n "$agent_id" ]; then
            local pid_file="$STATE_DIR/heartbeat-$agent_id.pid"
            if [ -f "$pid_file" ]; then
                kill $(cat "$pid_file") 2>/dev/null || true
                rm -f "$pid_file"
            fi
            rm -f "$STATE_DIR/agent-$agent_id.heartbeat"
            echo "✓ Agent $agent_id stopped"
        fi
        ;;
        
    heartbeat)
        update_heartbeat && echo "✓ Heartbeat updated"
        ;;
        
    status)
        echo ""
        echo "Agent Status:"
        echo "=================================================================================="
        get_agent_status
        echo "=================================================================================="
        ;;
        
    assign-task)
        if [ -z "$AGENT_ID" ] || [ "$AGENT_ID" = "0" ] || [ -z "$TASK_TYPE" ]; then
            echo "Usage: $0 assign-task <agent-id> <task-type> [payload]" >&2
            exit 1
        fi
        add_task "$AGENT_ID" "$TASK_TYPE" "$TASK_PAYLOAD"
        ;;
        
    get-tasks)
        get_tasks "$AGENT_ID"
        ;;
        
    cleanup)
        cleanup_old_files
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status|heartbeat|assign-task|get-tasks|cleanup} [args...]" >&2
        echo "" >&2
        echo "Commands:" >&2
        echo "  start              - Start agent and begin heartbeat" >&2
        echo "  stop               - Stop agent and cleanup" >&2
        echo "  status             - Show status of all agents" >&2
        echo "  heartbeat          - Update heartbeat manually" >&2
        echo "  assign-task <id> <type> [payload] - Assign task to agent" >&2
        echo "  get-tasks [id]     - Get pending tasks (optionally for specific agent)" >&2
        echo "  cleanup            - Clean up old files" >&2
        exit 1
        ;;
esac

