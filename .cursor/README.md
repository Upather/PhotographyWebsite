# Agent Orchestration System - Documentation Index

This directory contains everything you need to run 4 Cursor agents in parallel without re-instantiating or re-prompting them.

## 📚 Documentation

### Start Here
- **[CURSOR_NATIVE_GUIDE.md](./CURSOR_NATIVE_GUIDE.md)** - ⭐ **START HERE!** Use Cursor's built-in features (no scripts needed!)
- **[QUICK_START.md](./QUICK_START.md)** - Worktree + scripts method (advanced)
- **[PARALLEL_WORKFLOW.md](./PARALLEL_WORKFLOW.md)** - Detailed workflow patterns and best practices

### Reference
- **[AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)** - Complete system documentation
- **[agents.json](./agents.json)** - Agent definitions and configuration

## 🚀 Quick Commands

### Setup
```powershell
# Interactive setup guide
.\.cursor\setup-parallel-agents.ps1

# Check agent status
.\.cursor\orchestration.ps1 -Action status
```

### Daily Use
```powershell
# Real-time monitoring (recommended)
.\.cursor\monitor-agents.ps1

# Assign task to agent
.\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "update-gallery"

# Check pending tasks
.\.cursor\orchestration.ps1 -Action get-tasks
```

### Coordination Examples
```powershell
# See coordination examples
.\.cursor\coordinate-example.ps1 -Action example

# Learn how to assign tasks
.\.cursor\coordinate-example.ps1 -Action assign
```

## 📋 The 4 Agents

1. **Agent 1: Image Metadata & SEO** - EXIF, metadata, SEO optimization
2. **Agent 2: Gallery & UI** - Gallery display, filtering, UI/UX
3. **Agent 3: Admin & Authentication** - Admin panel, Firebase auth
4. **Agent 4: Integration & Contact** - Contact forms, social sharing

## 🎯 How It Works

1. **Worktree Setup** - Each agent gets its own worktree (automatically assigned ID 1-4)
2. **Auto-Loading** - Agent configuration loads automatically when worktree is created
3. **Heartbeat** - Agents send periodic signals to show they're active
4. **Task Queue** - Agents can assign tasks to each other for coordination
5. **Persistent State** - Agents remember their identity across sessions

## 📁 File Structure

```
.cursor/
├── README.md                    # This file
├── agents.json                  # Agent definitions
├── worktrees.json              # Worktree setup (with agent loading)
├── orchestration.ps1           # Main orchestration script (Windows)
├── orchestration.sh            # Main orchestration script (Unix)
├── load-agent.ps1              # Agent loader (Windows)
├── load-agent.sh               # Agent loader (Unix)
├── setup-parallel-agents.ps1   # Setup helper script
├── monitor-agents.ps1          # Real-time monitor
├── coordinate-example.ps1      # Coordination examples
├── coordination/               # Task queue (runtime)
├── agent-state/                # Agent heartbeats (runtime)
└── Documentation/
    ├── QUICK_START.md          # Quick start guide
    ├── PARALLEL_WORKFLOW.md    # Workflow patterns
    └── AGENT_ORCHESTRATION.md  # Full documentation
```

## 🎓 Learning Path

1. **Beginner**: Read [QUICK_START.md](./QUICK_START.md)
2. **Intermediate**: Read [PARALLEL_WORKFLOW.md](./PARALLEL_WORKFLOW.md)
3. **Advanced**: Read [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)

## 💡 Tips

- **Start with setup script** - `setup-parallel-agents.ps1` guides you through everything
- **Use monitor** - `monitor-agents.ps1` shows real-time status of all agents
- **Check status regularly** - Know which agents are active
- **Use task queue** - When agents need to coordinate
- **Let agents work independently** - They're designed to avoid conflicts

## 🔧 Troubleshooting

See [QUICK_START.md](./QUICK_START.md) for common issues and solutions.

## 📝 Notes

- All runtime files (coordination/, agent-state/) are git-ignored
- Agent configuration (agents.json) is tracked in git
- Each worktree maintains its own agent identity
- Agents automatically load their configuration when worktree is created

---

**Need help?** Start with [QUICK_START.md](./QUICK_START.md) - it has everything you need to get started!

