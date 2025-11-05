#!/bin/bash
# Load Agent Configuration and Initialize Persistent Session
# This script loads agent configuration and sets up environment for persistent agent use

set -e

AGENT_ID="${1:-0}"
AGENTS_CONFIG=".cursor/agents.json"

# Get agent ID from file if not provided
if [ "$AGENT_ID" = "0" ]; then
    if [ -f ".agent-id" ]; then
        AGENT_ID=$(cat .agent-id | tr -d '\n')
    else
        echo "No agent ID found. Run setup-worktree first." >&2
        exit 1
    fi
fi

# Load agent configuration
if [ ! -f "$AGENTS_CONFIG" ]; then
    echo "Agents configuration not found: $AGENTS_CONFIG" >&2
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    AGENT_NAME=$(jq -r ".agents[] | select(.id == $AGENT_ID) | .name" "$AGENTS_CONFIG")
    AGENT_ROLE=$(jq -r ".agents[] | select(.id == $AGENT_ID) | .role" "$AGENTS_CONFIG")
    AGENT_PROMPT=$(jq -r ".agents[] | select(.id == $AGENT_ID) | .prompt" "$AGENTS_CONFIG")
    
    if [ -z "$AGENT_NAME" ]; then
        echo "Agent ID $AGENT_ID not found in configuration." >&2
        exit 1
    fi
    
    echo ""
    echo "========================================"
    echo "Agent $AGENT_ID: $AGENT_NAME"
    echo "Role: $AGENT_ROLE"
    echo "========================================"
    echo ""
    
    echo "Agent Prompt/Instructions:"
    echo "$AGENT_PROMPT"
    echo ""
    
    echo "Assigned Files:"
    jq -r ".agents[] | select(.id == $AGENT_ID) | .assignedFiles[]" "$AGENTS_CONFIG" | while read -r file; do
        if [ -f "$file" ]; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (not found)"
        fi
    done
    
    echo ""
    echo "Focus Areas:"
    jq -r ".agents[] | select(.id == $AGENT_ID) | .focusAreas[]" "$AGENTS_CONFIG" | while read -r area; do
        echo "  • $area"
    done
    
    echo ""
    echo "========================================"
    
    # Initialize orchestration
    echo ""
    echo "Initializing orchestration..."
    bash "$(dirname "$0")/orchestration.sh" start
    
    # Save agent info
    jq ".agents[] | select(.id == $AGENT_ID)" "$AGENTS_CONFIG" > ".cursor/current-agent.json"
    
    echo ""
    echo "✓ Agent configuration loaded and orchestration started"
    echo ""
    echo "You can now continue working with this agent. The agent will:"
    echo "  • Maintain its identity and role"
    echo "  • Send heartbeat signals to show it's active"
    echo "  • Receive tasks from other agents"
    echo "  • Coordinate with other agents"
    echo ""
    echo "Useful commands:"
    echo "  • Check status: ./.cursor/orchestration.sh status"
    echo "  • Get tasks: ./.cursor/orchestration.sh get-tasks"
    echo "  • Stop agent: ./.cursor/orchestration.sh stop"
else
    echo "Error: jq is required. Install with: brew install jq (Mac) or apt-get install jq (Linux)" >&2
    exit 1
fi

