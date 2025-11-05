# Using Agents Within Cursor Desktop App

This guide shows you how to use the 4-agent system **directly within Cursor** without needing console scripts.

## 🎯 The Cursor-Native Approach

Instead of running scripts, you can:

1. **Use Cursor's chat** with agent prompts
2. **Open multiple Cursor windows** (one per agent)
3. **Use `.cursorrules` file** for automatic context
4. **Leverage Cursor's built-in features** for multi-agent work

## 🚀 Quick Start (3 Steps)

### Step 1: Open Multiple Cursor Windows

1. **Open 4 Cursor windows**:

   - Window 1: `File → New Window` (or `Cmd/Ctrl + Shift + N`)
   - Window 2: `File → New Window`
   - Window 3: `File → New Window`
   - Window 4: `File → New Window`

2. **Open the same project** in each window:
   - `File → Open Folder`
   - Navigate to your PhotographyProject folder

### Step 2: Activate Each Agent

In each Cursor window, open the chat (`Cmd/Ctrl + L`) and paste the agent prompt:

**Window 1 - Agent 1 (Metadata & SEO):**

```
I am Agent 1: Image Metadata & SEO Management Specialist. My responsibilities include:
- Extracting and managing EXIF data from images
- Creating and optimizing image metadata (titles, descriptions, alt text, keywords)
- Generating SEO-friendly structured data (JSON-LD Schema.org)
- Managing Open Graph meta tags
- Ensuring proper keyword management and categorization
- Validating metadata quality and completeness

I focus on: assets/js/metadata.js, assets/js/seo.js, assets/js/admin.js (metadata sections)
My focus areas are: EXIF extraction, Metadata management, SEO optimization, Structured data

Please remember this role and maintain it throughout our session.
```

**Window 2 - Agent 2 (Gallery & UI):**

```
I am Agent 2: Gallery & UI Specialist. My responsibilities include:
- Gallery display and rendering
- Image filtering and search functionality
- Lightbox/modal interactions
- UI/UX improvements
- Responsive design optimization
- Performance optimization for image loading

I focus on: assets/js/gallery.js, index.html (gallery sections), assets/css/styles.css
My focus areas are: Gallery display, Filtering & search, UI/UX, Performance

Please remember this role and maintain it throughout our session.
```

**Window 3 - Agent 3 (Admin & Auth):**

```
I am Agent 3: Admin & Authentication Specialist. My responsibilities include:
- Admin panel functionality
- Firebase authentication and authorization
- User role management
- Image upload and management
- Firestore database operations
- Security and access control

I focus on: assets/js/admin.js, admin.html, assets/js/config.js
My focus areas are: Authentication, Admin panel, Firebase integration, Security

Please remember this role and maintain it throughout our session.
```

**Window 4 - Agent 4 (Integration & Contact):**

```
I am Agent 4: Integration & Contact Specialist. My responsibilities include:
- Contact form functionality and validation
- Social media sharing integration
- External service integrations (Formspree, etc.)
- Form validation and error handling
- Email/notification handling
- Third-party API integrations

I focus on: assets/js/contact-form.js, assets/js/social-sharing.js, index.html (contact sections)
My focus areas are: Contact forms, Social sharing, External integrations, Form validation

Please remember this role and maintain it throughout our session.
```

### Step 3: Start Working!

Each Cursor window now has an agent with its own identity:

- **Agent remembers its role** throughout the session
- **Focuses on assigned files** automatically
- **Maintains context** across conversations

## 📋 Using .cursorrules File

The `.cursorrules` file in your project root automatically provides context to Cursor:

- **Agent definitions** are loaded automatically
- **File assignments** are known to Cursor
- **Focus areas** guide agent behavior
- **No need to paste prompts** if using `.cursorrules`

**How it works:**

1. Cursor reads `.cursorrules` automatically
2. Agent context is available in chat
3. You can reference: "I am Agent 1" and Cursor knows the context

## 💡 Best Practices

### ✅ DO:

- **Use separate Cursor windows** for each agent
- **Paste agent prompt at start** of each session
- **Reference agent files** when working
- **Use chat to coordinate** between agents
- **Let Cursor remember context** - it maintains agent identity

### ❌ DON'T:

- **Don't mix agents** in the same window
- **Don't skip the prompt** - it sets agent identity
- **Don't work on other agents' files** without coordination

## 🔄 Daily Workflow

### Morning Setup

1. Open 4 Cursor windows
2. Open project in each window
3. Paste agent prompt in each chat
4. Start working!

### During Work

- Each agent works in its own window
- Agent maintains identity throughout session
- Chat naturally coordinates between agents
- No scripts needed!

### Coordination

When agents need to work together:

- **Use chat** to communicate
- **Reference specific files** and tasks
- **Agent remembers its role** and focuses accordingly

## 🎨 Advanced: Using Cursor Features

### Composer (Multi-File Editing)

- **Agent 1** can use Composer to edit `metadata.js` and `seo.js` together
- **Agent 2** can use Composer to edit `gallery.js` and `styles.css` together
- Each agent's Composer respects its file assignments

### Terminal Integration

- **Optional**: Use Cursor's integrated terminal for status checks
- **Not required**: Everything works through chat and `.cursorrules`

### Workspace Settings

- Cursor automatically reads `.cursorrules`
- No additional configuration needed
- Agent context is available everywhere

## 📊 Monitoring (Optional)

If you want to check agent status (optional, not required):

**Using Cursor's Terminal:**

```powershell
# In any Cursor window's integrated terminal
.\.cursor\orchestration.ps1 -Action status
```

**Or just check in chat:**

- Ask: "What agent am I?"
- Cursor will tell you based on context

## 🔗 Coordination Between Agents

### Method 1: Chat Communication

In Agent 1's window:

```
Agent 2, I've updated the metadata structure. Please update the gallery to use the new format.
```

### Method 2: Task Queue (Optional)

If you want to use the task queue system:

```powershell
# In Cursor's integrated terminal
.\.cursor\orchestration.ps1 -Action assign-task -AgentId 2 -Task "update-gallery"
```

But **chat is often simpler** for coordination!

## 🎯 Benefits of Cursor-Native Approach

✅ **No console scripts needed** - Everything in Cursor UI  
✅ **Natural chat interface** - Talk to agents directly  
✅ **Multiple windows** - Visual separation of agents  
✅ **Automatic context** - `.cursorrules` provides context  
✅ **Persistent identity** - Agents remember roles in chat  
✅ **Integrated workflow** - No switching between tools

## 🚀 Quick Reference

**Open new window**: `Cmd/Ctrl + Shift + N`  
**Open chat**: `Cmd/Ctrl + L`  
**Agent prompts**: See `.cursor/agent-prompts.md`  
**Rules file**: `.cursorrules` (auto-loaded)

## 📝 Example Session

**Window 1 (Agent 1):**

```
You: [Paste Agent 1 prompt]
Agent 1: I understand. I'm Agent 1, focusing on metadata and SEO.

You: Update the metadata extraction to include GPS coordinates
Agent 1: [Works on metadata.js]
```

**Window 2 (Agent 2):**

```
You: [Paste Agent 2 prompt]
Agent 2: I understand. I'm Agent 2, focusing on gallery and UI.

You: Improve the gallery filtering performance
Agent 2: [Works on gallery.js]
```

Both agents work in parallel, each maintaining their identity!

---

**This is the Cursor-native way!** No scripts needed - just use Cursor's built-in features. 🎉
