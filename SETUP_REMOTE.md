# Setting Up a Remote Repository

## Option 1: Create GitHub Repository (Recommended)

### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `PhotographyProject` (or your preferred name)
3. Description: "Professional fashion photography portfolio with metadata management"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have files)
6. Click **Create repository**

### Step 2: Copy the Repository URL
After creating, GitHub will show you the repository URL. It will look like:
- HTTPS: `https://github.com/YOUR_USERNAME/PhotographyProject.git`
- SSH: `git@github.com:YOUR_USERNAME/PhotographyProject.git`

### Step 3: Add Remote and Push
Once you have the URL, run:
```bash
cd C:\Users\Udesh\.cursor\worktrees\PhotographyProject\PPkrN
git remote add origin https://github.com/YOUR_USERNAME/PhotographyProject.git
git push -u origin feat-parallel-agent-coord-PPkrN
```

## Option 2: Other Git Hosting Services

### GitLab
1. Go to https://gitlab.com/projects/new
2. Create project and follow similar steps

### Bitbucket
1. Go to https://bitbucket.org/repo/create
2. Create repository and follow similar steps

## Current Git Configuration
- **Name**: Udesh Pather
- **Email**: udesh.pather@gmail.com

This information will be used for commits.

