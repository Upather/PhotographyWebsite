# Quick Start: Running 4 Agents in Parallel

This guide shows you how to effectively use all 4 agents simultaneously in parallel.

## 🎯 Two Methods Available

### Method 1: Cursor-Native (Recommended) ⭐

**Use Cursor's built-in features** - No scripts needed!

- Open 4 Cursor windows
- Paste agent prompts in chat
- Work directly in Cursor UI

**👉 See [CURSOR_NATIVE_GUIDE.md](./CURSOR_NATIVE_GUIDE.md) for full instructions**

### Method 2: Worktree + Scripts (Advanced)

**Use worktrees with orchestration scripts** - For advanced coordination

- Requires PowerShell/Bash
- Uses task queue system
- More setup overhead

**👉 This guide covers Method 2. For Method 1, see CURSOR_NATIVE_GUIDE.md**

## Prerequisites

- Cursor desktop app
- Git repository initialized
- PowerShell (Windows) or Bash (Unix/Mac) - **Only for Method 2**

## Step-by-Step: Setup Parallel Agents

### Method 1: Manual Setup (Recommended for Learning)

#### 1. Create 4 Worktrees (One Per Agent)

Open 4 separate terminal windows/PowerShell sessions. In each, navigate to your project root and create a worktree:

**Terminal 1 - Agent 1 (Metadata & SEO):**

```powershell
cd C:\Users\Udesh\Desktop\DevProjects\PhotographyProject
# Create worktree - this will automatically assign Agent ID 1
# The worktree setup will automatically load agent configuration
```

**Terminal 2 - Agent 2 (Gallery & UI):**

```powershell
cd C:\Users\Udesh\Desktop\DevProjects\PhotographyProject
# Create worktree - will assign Agent ID 2
```

**Terminal 3 - Agent 3 (Admin & Auth):**

```powershell
cd C:\Users\Udesh\Desktop\DevProjects\PhotographyProject
# Create worktree - will assign Agent ID 3
```

**Terminal 4 - Agent 4 (Integration & Contact):**

```powershell
cd C:\Users\Udesh\Desktop\DevProjects\PhotographyProject
# Create worktree - will assign Agent ID 4
```

#### 2. Verify Agent Status

In any terminal, check all agent statuses:

```powershell
.\.cursor\orchestration.ps1 -Action status
```

You should see all 4 agents as ACTIVE.

### Method 2: Automated Setup Script

Use the provided setup script to create all 4 worktrees automatically.

## Effective Parallel Usage Patterns

### Pattern 1: Independent Work Streams

Each agent works on its assigned files independently:

- **Agent 1** focuses on: `metadata.js`, `seo.js`, SEO-related parts of `admin.js`
- **Agent 2** focuses on: `gallery.js`, `styles.css`, gallery sections in `index.html`
- **Agent 3** focuses on: `admin.js` (auth/admin), `admin.html`, Firebase config
- **Agent 4** focuses on: `contact-form.js`, `social-sharing.js`, contact sections

**Benefits:**

- No file conflicts (agents work on different files)
- Natural division of labor
- Fast parallel development

### Pattern 2: Coordinated Tasks

Use the task queue when agents need to coordinate:

**Example: Agent 2 needs Agent 1 to generate SEO metadata for a new gallery item**

```powershell
# From Agent 2's worktree
.\.cursor\orchestration.ps1 -Action assign-task -AgentId 1 -Task "generate-seo-metadata" -Payload '{"imageId": "img123", "title": "Sunset Photo"}'
```

**Agent 1 can check for tasks:**

```powershell
.\.cursor\orchestration.ps1 -Action get-tasks
```

### Pattern 3: Sequential Workflow

Agents work in sequence, each building on the previous:

1. **Agent 3** (Admin) uploads image → Creates Firestore document
2. **Agent 1** (Metadata) extracts EXIF and generates SEO metadata
3. **Agent 2** (Gallery) updates gallery display with new image
4. **Agent 4** (Integration) adds social sharing for new image

## Daily Workflow

### Morning Setup

1. Open 4 terminal windows
2. Navigate to project root in each
3. Each worktree automatically loads its agent
4. Check status: `.\orchestration.ps1 -Action status`

### During Work

- Each agent works in its own terminal
- Agents maintain their identity automatically
- No need to re-explain roles
- Check status periodically to see what others are doing

### Coordination

- Use task queue for inter-agent communication
- Check status to see what agents are working on
- Each agent sees its assigned files and focus areas

### End of Day

- Agents can stay active (heartbeat keeps them alive)
- Or stop them: `.\orchestration.ps1 -Action stop`

## Best Practices

### ✅ DO:

- Keep agents focused on their assigned files
- Use task queue for coordination needs
- Check status regularly to monitor all agents
- Let agents work independently when possible
- Use the same agent for the same type of work

### ❌ DON'T:

- Don't have multiple agents edit the same file simultaneously
- Don't skip the coordination system when agents need to work together
- Don't ignore agent focus areas (they're set for a reason)
- Don't manually edit `.agent-id` files

## Troubleshooting

### Agent not showing as active?

```powershell
# Restart the agent
.\.cursor\orchestration.ps1 -Action stop
.\.cursor\orchestration.ps1 -Action start
```

### Need to reload agent configuration?

```powershell
.\.cursor\load-agent.ps1
```

### All agent slots occupied?

```powershell
# Check for stale locks
.\.cursor\orchestration.ps1 -Action cleanup
# Or manually check lock files in parent directory
```

### Task not appearing?

- Verify task file was created in `.cursor/coordination/`
- Check task status (should be "pending")
- Ensure target agent ID is correct (1-4)

## Example Scenarios

### Scenario 1: Adding New Feature

**Agent 1** creates SEO metadata component
**Agent 2** adds it to gallery display
**Agent 3** ensures admin can configure it
**Agent 4** adds sharing functionality

### Scenario 2: Bug Fixing

**Agent 2** notices gallery filtering bug
**Agent 3** checks if it's related to admin upload
**Agent 1** verifies metadata isn't causing issues
**Agent 4** tests if social sharing still works

### Scenario 3: Performance Optimization

**Agent 2** optimizes image loading
**Agent 1** optimizes metadata queries
**Agent 3** optimizes Firebase queries
**Agent 4** optimizes form submissions

## Monitoring All Agents

Create a monitoring script or use:

```powershell
# Quick status check
.\.cursor\orchestration.ps1 -Action status

# Watch status (refresh every 5 seconds)
while ($true) {
    Clear-Host
    .\.cursor\orchestration.ps1 -Action status
    Start-Sleep -Seconds 5
}
```

## Next Steps

1. Set up your 4 worktrees
2. Verify all agents are active
3. Start working with each agent in its terminal
4. Use task queue for coordination when needed
5. Monitor status regularly

Happy parallel development! 🚀
