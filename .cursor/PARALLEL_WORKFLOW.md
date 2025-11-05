# Parallel Agent Workflow Guide

## Visual Workflow: Running 4 Agents in Parallel

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER / CURSOR                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────┐│
│  │  Terminal 1  │  │  Terminal 2  │  │  Terminal 3  │  │Term 4││
│  │  Agent 1     │  │  Agent 2     │  │  Agent 3     │  │Agt 4 ││
│  │              │  │              │  │              │  │      ││
│  │ Metadata &   │  │ Gallery &    │  │ Admin &      │  │Integ ││
│  │ SEO          │  │ UI           │  │ Auth         │  │&Cont ││
│  │              │  │              │  │              │  │      ││
│  │ Worktree 1   │  │ Worktree 2   │  │ Worktree 3   │  │Wtree4 ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──┬───┘│
│         │                  │                  │             │     │
│         └──────────────────┴──────────────────┴─────────────┘     │
│                              │                                    │
│                              ▼                                    │
│                    ┌─────────────────────┐                       │
│                    │  Shared Coordination │                       │
│                    │  .cursor/coordination│                       │
│                    │  .cursor/agent-state│                       │
│                    └─────────────────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step: Daily Parallel Workflow

### Morning Routine (5 minutes)

1. **Open 4 Terminal Windows**
   ```
   PowerShell 1 → Agent 1 (Metadata & SEO)
   PowerShell 2 → Agent 2 (Gallery & UI)
   PowerShell 3 → Agent 3 (Admin & Auth)
   PowerShell 4 → Agent 4 (Integration & Contact)
   ```

2. **Navigate to Project in Each Terminal**
   ```powershell
   cd C:\Users\Udesh\Desktop\DevProjects\PhotographyProject
   ```

3. **Verify All Agents Are Active**
   ```powershell
   # In any terminal:
   .\.cursor\orchestration.ps1 -Action status
   ```
   
   Expected output:
   ```
   Agent Status:
   ================================================================================
   Agent 1: Image Metadata & SEO Agent [metadata-seo] - ACTIVE
     Last heartbeat: 2024-01-15T10:00:00Z (2.3s ago)
   Agent 2: Gallery & UI Agent [gallery-ui] - ACTIVE
     Last heartbeat: 2024-01-15T10:00:01Z (1.2s ago)
   Agent 3: Admin & Authentication Agent [admin-auth] - ACTIVE
     Last heartbeat: 2024-01-15T10:00:02Z (0.1s ago)
   Agent 4: Integration & Contact Agent [integration-contact] - ACTIVE
     Last heartbeat: 2024-01-15T10:00:03Z (0.0s ago)
   ================================================================================
   ```

4. **Start Working!**
   - Each agent remembers its role
   - No need to re-prompt
   - Agents automatically focus on their assigned files

### During Work: Parallel Execution

#### Independent Work (No Coordination Needed)

**Agent 1** works on:
- `assets/js/metadata.js` - EXIF extraction improvements
- `assets/js/seo.js` - SEO optimization
- Metadata sections of `admin.js`

**Agent 2** works on:
- `assets/js/gallery.js` - Gallery filtering
- `assets/css/styles.css` - UI improvements
- Gallery sections of `index.html`

**Agent 3** works on:
- `assets/js/admin.js` - Admin panel features
- `admin.html` - UI updates
- Firebase configuration

**Agent 4** works on:
- `assets/js/contact-form.js` - Form validation
- `assets/js/social-sharing.js` - Social features
- Contact sections of `index.html`

✅ **No conflicts!** Each agent works on different files.

#### Coordinated Work (Using Task Queue)

When agents need to work together:

**Example: New Image Upload Workflow**

1. **Agent 3** (Admin) uploads image
   ```powershell
   # Agent 3 assigns task to Agent 1
   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 1 -Task "extract-metadata" -Payload '{"imageId": "img123", "path": "uploads/image.jpg"}'
   ```

2. **Agent 1** (Metadata) receives task
   ```powershell
   # Agent 1 checks for tasks
   .\.cursor\orchestration.ps1 -Action get-tasks
   
   # Agent 1 processes the task:
   # - Extracts EXIF data
   # - Generates SEO metadata
   # - Updates Firestore
   ```

3. **Agent 1** notifies Agent 2
   ```powershell
   # Agent 1 assigns task to Agent 2
   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "refresh-gallery" -Payload '{"action": "update", "imageId": "img123"}'
   ```

4. **Agent 2** (Gallery) updates display
   - Refreshes gallery view
   - Updates filters
   - Shows new image

5. **Agent 2** notifies Agent 4
   ```powershell
   # Agent 2 assigns task to Agent 4
   .\.cursor\orchestration.ps1 -Action assign-task -AgentId 4 -Task "add-sharing" -Payload '{"imageId": "img123"}'
   ```

6. **Agent 4** (Integration) adds sharing
   - Adds social sharing buttons
   - Updates sharing metadata

### Monitoring During Work

**Option 1: Continuous Monitor (Recommended)**
```powershell
# In a 5th terminal window (optional)
.\.cursor\monitor-agents.ps1
```

This shows:
- Real-time agent status
- Pending tasks
- Auto-refreshes every 5 seconds

**Option 2: Periodic Status Checks**
```powershell
# Check status anytime
.\.cursor\orchestration.ps1 -Action status

# Check for pending tasks
.\.cursor\orchestration.ps1 -Action get-tasks
```

### End of Day

**Option 1: Keep Agents Active (Recommended)**
- Agents stay active with heartbeat
- No need to restart tomorrow
- Just check status: `.\orchestration.ps1 -Action status`

**Option 2: Stop Agents**
```powershell
# In each terminal:
.\.cursor\orchestration.ps1 -Action stop
```

## Common Patterns

### Pattern 1: Feature Development
```
Agent 1 → Creates metadata component
Agent 2 → Integrates into gallery
Agent 3 → Adds admin controls
Agent 4 → Adds sharing functionality
```
All work in parallel, then coordinate final integration.

### Pattern 2: Bug Fixing
```
Agent 2 → Finds bug in gallery
Agent 2 → Asks Agent 1: "Is metadata causing this?"
Agent 1 → Checks and responds
Agents → Coordinate fix
```

### Pattern 3: Performance Optimization
```
All 4 agents work independently:
- Agent 1: Optimizes metadata queries
- Agent 2: Optimizes image loading
- Agent 3: Optimizes Firebase calls
- Agent 4: Optimizes form submissions
Then coordinate to test together.
```

### Pattern 4: Code Review
```
Agent 1 → Reviews metadata changes
Agent 2 → Reviews gallery changes
Agent 3 → Reviews admin changes
Agent 4 → Reviews integration changes
All provide feedback via task queue.
```

## Best Practices

### ✅ DO:
- **Keep agents focused** - Each agent has clear responsibilities
- **Use task queue for coordination** - When agents need to work together
- **Monitor regularly** - Check status every 30-60 minutes
- **Let agents work independently** - When possible, avoid coordination overhead
- **Use the same agent for same work** - Consistency matters

### ❌ DON'T:
- **Don't have agents edit same files** - Each agent has assigned files
- **Don't skip coordination** - When agents need to work together, use task queue
- **Don't ignore focus areas** - They're set for a reason
- **Don't manually edit agent files** - Let the system manage them

## Troubleshooting Parallel Execution

### Issue: Agent not showing as active
**Solution:**
```powershell
# Restart the agent
.\.cursor\orchestration.ps1 -Action stop
.\.cursor\orchestration.ps1 -Action start
```

### Issue: Can't see other agents
**Solution:**
```powershell
# Check if all agents are in same coordination directory
# Verify .cursor/coordination/ and .cursor/agent-state/ exist
# Check status
.\.cursor\orchestration.ps1 -Action status
```

### Issue: Tasks not appearing
**Solution:**
```powershell
# Verify task file created
Get-ChildItem .cursor/coordination/task-*.json

# Check task status
.\.cursor\orchestration.ps1 -Action get-tasks

# Verify agent ID is correct (1-4)
```

### Issue: All slots occupied
**Solution:**
```powershell
# Clean up stale locks
.\.cursor\orchestration.ps1 -Action cleanup

# Or use setup script
.\.cursor\setup-parallel-agents.ps1
# Choose option 3: Cleanup Stale Agents
```

## Quick Reference Commands

### Setup
```powershell
# Interactive setup guide
.\.cursor\setup-parallel-agents.ps1

# Check status
.\.cursor\orchestration.ps1 -Action status
```

### Coordination
```powershell
# Assign task
.\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "update-gallery" -Payload '{"action": "refresh"}'

# Check tasks
.\.cursor\orchestration.ps1 -Action get-tasks

# See coordination examples
.\.cursor\coordinate-example.ps1 -Action example
```

### Monitoring
```powershell
# Real-time monitor
.\.cursor\monitor-agents.ps1

# One-time status check
.\.cursor\orchestration.ps1 -Action status
```

### Maintenance
```powershell
# Cleanup old files
.\.cursor\orchestration.ps1 -Action cleanup

# Stop agent
.\.cursor\orchestration.ps1 -Action stop

# Start agent
.\.cursor\orchestration.ps1 -Action start
```

## Success Metrics

You're using agents effectively when:
- ✅ All 4 agents show as ACTIVE in status check
- ✅ Each agent works on its assigned files
- ✅ Tasks are assigned and completed via task queue
- ✅ No file conflicts between agents
- ✅ Agents coordinate when needed
- ✅ Status checks show all agents active

## Next Steps

1. **Run the setup script**: `.\setup-parallel-agents.ps1`
2. **Open 4 terminals** and set up worktrees
3. **Verify all agents are active**
4. **Start working** - agents remember their roles!
5. **Monitor regularly** - use `monitor-agents.ps1` for real-time view

Happy parallel development! 🚀

