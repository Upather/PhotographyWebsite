# Quick Start: Using 4 Agents in Cursor (No Scripts Needed!)

**This is the easiest way to use the 4-agent system!**

## 🚀 3 Simple Steps

### Step 1: Open 4 Cursor Windows

1. Open Cursor
2. Create 3 more windows: `File → New Window` (or `Cmd/Ctrl + Shift + N`)
3. Open your project in each window: `File → Open Folder` → PhotographyProject

You now have 4 Cursor windows, each ready for an agent!

### Step 2: Activate Each Agent

In each window, open chat (`Cmd/Ctrl + L`) and paste the agent prompt:

#### Window 1 - Agent 1 (Metadata & SEO)
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

#### Window 2 - Agent 2 (Gallery & UI)
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

#### Window 3 - Agent 3 (Admin & Auth)
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

#### Window 4 - Agent 4 (Integration & Contact)
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

That's it! Each Cursor window now has an agent:
- ✅ Agent remembers its role
- ✅ Focuses on assigned files
- ✅ Maintains identity throughout session
- ✅ No scripts needed!

## 💡 Tips

### Quick Agent Prompts
Save time - copy prompts from `.cursor/agent-prompts.md`

### Daily Workflow
1. Open 4 windows in the morning
2. Paste agent prompts (takes 30 seconds)
3. Work all day - agents remember their roles!

### Coordination
When agents need to work together:
- Just chat normally: "Agent 2, I've updated the metadata format"
- Or reference files: "Please update gallery.js to use the new metadata structure"

## 🎯 What Each Agent Does

- **Agent 1**: Works on `metadata.js`, `seo.js`, SEO parts of `admin.js`
- **Agent 2**: Works on `gallery.js`, `styles.css`, gallery in `index.html`
- **Agent 3**: Works on `admin.js`, `admin.html`, Firebase config
- **Agent 4**: Works on `contact-form.js`, `social-sharing.js`, contact sections

**No conflicts!** Each agent has different files.

## ✅ Benefits

✅ **No scripts** - Everything in Cursor UI  
✅ **Natural chat** - Talk to agents directly  
✅ **Visual separation** - Each agent in its own window  
✅ **Persistent identity** - Agents remember roles  
✅ **Easy coordination** - Just chat between windows  

## 🚀 That's It!

You're ready to work with 4 agents in parallel, all within Cursor! No terminal, no scripts, just Cursor's chat interface.

**For more details, see [CURSOR_NATIVE_GUIDE.md](./CURSOR_NATIVE_GUIDE.md)**

