# Agent Orchestration System

This system allows you to orchestrate 4 persistent Cursor agents without re-instantiating or re-prompting them. Each agent maintains its identity, role, and state across sessions.

## Overview

The orchestration system consists of:

1. **Agent Configuration** (`.cursor/agents.json`) - Defines 4 agents with their roles, prompts, and assigned files
2. **Orchestration Scripts** - Manage agent state, heartbeat, and task coordination
3. **Worktree Integration** - Automatically loads agent config when worktree is set up
4. **Persistent State** - Agents maintain identity through heartbeat signals

## The 4 Agents

1. **Agent 1: Image Metadata & SEO** - Manages EXIF data, metadata, SEO optimization
2. **Agent 2: Gallery & UI** - Handles gallery display, filtering, UI/UX
3. **Agent 3: Admin & Authentication** - Manages admin panel, Firebase auth, user management
4. **Agent 4: Integration & Contact** - Handles contact forms, social sharing, integrations

## Quick Start

**📖 For detailed parallel setup instructions, see [QUICK_START.md](./QUICK_START.md)**

### 1. Initial Setup

When a worktree is created, the system automatically:
- Acquires an agent ID (1-4)
- Loads the agent configuration
- Starts the heartbeat system

### 2. Setting Up Parallel Agents

To run all 4 agents in parallel:

**Option A: Use the setup script (recommended)**
```powershell
.\.cursor\setup-parallel-agents.ps1
```

**Option B: Manual setup**
1. Open 4 separate terminal windows
2. In each terminal, navigate to project root
3. Create worktrees (Cursor will automatically assign agent IDs)
4. Each agent loads its configuration automatically

### 3. Using an Agent

Once an agent is loaded, it will:
- **Remember its role** - No need to re-prompt with instructions
- **Maintain state** - Heartbeat signals keep it "alive"
- **Receive tasks** - Other agents can assign tasks via the orchestration system
- **Coordinate** - Communicate with other agents through shared state

### 3. Check Agent Status

**Windows (PowerShell):**
```powershell
.\.cursor\orchestration.ps1 -Action status
```

**Unix/Linux/Mac:**
```bash
./.cursor/orchestration.sh status
```

This shows:
- Which agents are active
- Last heartbeat time
- Agent roles and names

### 4. Manual Agent Loading

If you need to manually load an agent configuration:

**Windows:**
```powershell
.\.cursor\load-agent.ps1
```

**Unix/Linux/Mac:**
```bash
./.cursor/load-agent.sh
```

## Orchestration Commands

### Start Agent
Initializes the agent and starts heartbeat monitoring:
```powershell
.\.cursor\orchestration.ps1 -Action start
```

### Stop Agent
Stops the agent and cleans up:
```powershell
.\.cursor\orchestration.ps1 -Action stop
```

### Update Heartbeat
Manually update heartbeat (usually automatic):
```powershell
.\.cursor\orchestration.ps1 -Action heartbeat
```

### Assign Task to Agent
Assign a task to a specific agent:
```powershell
.\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "update-gallery" -Payload '{"action": "refresh"}'
```

### Get Pending Tasks
View tasks assigned to agents:
```powershell
.\.cursor\orchestration.ps1 -Action get-tasks
# Or for specific agent:
.\.cursor\orchestration.ps1 -Action get-tasks -AgentId 2
```

### Cleanup Old Files
Remove old tasks and stale heartbeats:
```powershell
.\.cursor\orchestration.ps1 -Action cleanup
```

## How It Works

### 1. Agent Identity Persistence

Each agent maintains its identity through:
- **Agent ID file** (`.agent-id`) - Stored in each worktree
- **Agent configuration** (`.cursor/agents.json`) - Shared across all worktrees
- **Current agent state** (`.cursor/current-agent.json`) - Loaded in each session

### 2. Heartbeat System

Agents send periodic heartbeat signals:
- **Interval**: Every 10 seconds (configurable)
- **Timeout**: 60 seconds (agent considered inactive if no heartbeat)
- **Location**: `.cursor/agent-state/agent-{id}.heartbeat`

### 3. Task Coordination

Agents can communicate via task queue:
- **Location**: `.cursor/coordination/task-*.json`
- **Format**: JSON with task type, payload, target agent
- **Status**: pending → completed

### 4. State Management

All agent state is stored in:
- `.cursor/agent-state/` - Heartbeats and agent state
- `.cursor/coordination/` - Task queue and inter-agent messages
- `.cursor/current-agent.json` - Currently active agent in this worktree

## Benefits

### ✅ No Re-Instantiation
- Agents maintain identity across sessions
- No need to re-prompt with instructions
- Role and responsibilities persist

### ✅ Better Coordination
- Agents can see each other's status
- Task assignment system for inter-agent communication
- Shared state for collaboration

### ✅ Persistent State
- Heartbeat system tracks active agents
- Automatic cleanup of stale states
- Clear visibility into agent status

### ✅ Organized Workflow
- Each agent has clear responsibilities
- Assigned files prevent conflicts
- Focus areas guide agent actions

## Example Workflow

1. **Agent 1 starts** (Metadata & SEO)
   - Loads its configuration automatically
   - Starts heartbeat
   - Shows its role and assigned files

2. **Agent 2 starts** (Gallery & UI)
   - Can see Agent 1 is active via status check
   - Can assign tasks to Agent 1 if needed
   - Maintains its own identity

3. **Agent 3 starts** (Admin & Auth)
   - All three agents can see each other
   - Can coordinate work through task queue
   - Each maintains its specialized role

4. **Agent 4 starts** (Integration & Contact)
   - Full orchestration active
   - All agents can coordinate
   - No need to re-explain roles

## Configuration

Edit `.cursor/agents.json` to:
- Modify agent prompts
- Change assigned files
- Update focus areas
- Adjust orchestration settings

## Troubleshooting

### Agent not loading
- Check if `.agent-id` exists in worktree
- Verify `.cursor/agents.json` exists
- Run `load-agent.ps1` or `load-agent.sh` manually

### Heartbeat not working
- Check if orchestration script is running
- Verify directory permissions
- Check for background job/process

### Tasks not appearing
- Verify task file created in `.cursor/coordination/`
- Check task status (should be "pending")
- Ensure target agent ID is correct

## Files Overview

```
.cursor/
├── agents.json              # Agent definitions and configuration
├── worktrees.json           # Worktree setup (now includes agent loading)
├── orchestration.ps1        # Windows orchestration script
├── orchestration.sh         # Unix orchestration script
├── load-agent.ps1          # Windows agent loader
├── load-agent.sh           # Unix agent loader
├── coordination/            # Task queue and inter-agent messages
│   └── task-*.json
├── agent-state/            # Agent heartbeats and state
│   └── agent-*.heartbeat
└── current-agent.json      # Current agent in this worktree
```

## Next Steps

1. **Start using agents** - The system is ready to use
2. **Monitor status** - Regularly check agent status
3. **Assign tasks** - Use task queue for coordination
4. **Customize** - Modify agent prompts and roles as needed

This orchestration system enables true multi-agent collaboration without the overhead of re-instantiating and re-prompting agents for each session.

