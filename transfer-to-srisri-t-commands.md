# Transfer TestResults to srisri-t Account - Custom Commands

## 🎯 Your Specific Transfer Commands

**Source:** `https://github.com/srisritP2/TestResults`  
**Destination:** `https://github.com/srisri-t/TestResults`

---

## 🚀 Method 1: Mirror Clone (Recommended)

### Step 1: Create Bare Clone
```bash
# Navigate to a temporary directory
cd /tmp
# or
cd C:\temp

# Clone with full history (bare repository)
git clone --bare https://github.com/srisritP2/TestResults.git

# Navigate to the cloned directory
cd TestResults.git
```

### Step 2: Create New Repository
1. **Login to GitHub account:** `srisri-t`
2. **Go to:** https://github.com/new
3. **Repository name:** `TestResults`
4. **Description:** `Automation Test Results Viewer - Interactive web interface for viewing and analyzing test reports`
5. **Visibility:** Public (or Private if preferred)
6. **DON'T check:** Initialize with README, .gitignore, or license
7. **Click:** "Create repository"

### Step 3: Push Everything to New Repository
```bash
# Push all branches, tags, and history to new repository
git push --mirror https://github.com/srisri-t/TestResults.git

# Clean up temporary bare repository
cd ..
rm -rf TestResults.git
# On Windows: rmdir /s TestResults.git
```

### Step 4: Clone Your New Repository
```bash
# Navigate to your projects directory
cd E:\Projects
# or wherever you keep your projects

# Clone your new repository for development
git clone https://github.com/srisri-t/TestResults.git
cd TestResults

# Verify everything transferred correctly
git log --oneline -10
git branch -a
git tag
```

---

## 🔧 Method 2: Update Current Repository

If you want to update your current local repository to point to the new account:

```bash
# Navigate to your current project
cd E:\Projects\AutomationTestResultsWebSite

# Update remote URL to new account
git remote set-url origin https://github.com/srisri-t/TestResults.git

# Push all branches and tags
git push -u origin --all
git push -u origin --tags

# Verify new remote
git remote -v
```

---

## 📝 Files to Update After Transfer

### 1. Update vue.config.js
```javascript
module.exports = {
  publicPath: "/TestResults/",  // Keep this the same for GitHub Pages
  // ... rest of config
  pwa: {
    name: "Automation Test Results Viewer",
    short_name: "Test Results",
    description: "View and analyze automation test results with an interactive web interface",
    manifestOptions: {
      name: "Automation Test Results Viewer",
      short_name: "Test Results",
      description: "View and analyze automation test results with an interactive web interface",
      start_url: "/TestResults/",
      scope: "/TestResults/",
      // ... rest of manifest
    }
  }
}
```

### 2. Update package.json (if exists)
```json
{
  "name": "automation-test-results-viewer",
  "repository": {
    "type": "git",
    "url": "https://github.com/srisri-t/TestResults.git"
  },
  "bugs": {
    "url": "https://github.com/srisri-t/TestResults/issues"
  },
  "homepage": "https://srisri-t.github.io/TestResults"
}
```

### 3. Update README.md
```markdown
# Automation Test Results Viewer

🔗 **Live Demo:** https://srisri-t.github.io/TestResults  
📊 **Repository:** https://github.com/srisri-t/TestResults  
🐛 **Issues:** https://github.com/srisri-t/TestResults/issues  
```

---

## ⚙️ GitHub Pages Setup for New Repository

### Step 1: Enable GitHub Pages
1. **Go to:** https://github.com/srisri-t/TestResults/settings/pages
2. **Source:** Deploy from a branch
3. **Branch:** main
4. **Folder:** / (root)
5. **Click:** Save

### Step 2: Verify Deployment
- **Your new site will be available at:** https://srisri-t.github.io/TestResults
- **Deployment usually takes 2-5 minutes**

---

## 🔄 GitHub Actions Update

Your GitHub Actions should work automatically, but verify:

1. **Check workflow file:** `.github/workflows/deploy-app.yml`
2. **Ensure it references the correct paths**
3. **No hardcoded repository names should need changing**

---

## 🎯 Quick Verification Commands

After transfer, run these to verify everything worked:

```bash
# Check commit history is preserved
git log --oneline | head -10

# Check all branches transferred
git branch -a

# Check tags transferred
git tag

# Check remote is correct
git remote -v

# Check file structure
ls -la
# On Windows: dir
```

---

## 🚀 Your Complete Transfer Script

Here's a complete script you can run:

```bash
#!/bin/bash
# Complete transfer script for TestResults

echo "🚀 Starting transfer to srisri-t account..."

# Step 1: Create temporary directory and clone
cd /tmp
git clone --bare https://github.com/srisritP2/TestResults.git
cd TestResults.git

echo "📦 Bare repository cloned successfully"

# Step 2: Push to new repository (you need to create it first on GitHub)
echo "🔄 Pushing to new repository..."
git push --mirror https://github.com/srisri-t/TestResults.git

echo "✅ Transfer complete!"

# Step 3: Clean up
cd ..
rm -rf TestResults.git

echo "🧹 Cleanup complete"
echo "🎉 Your repository is now available at: https://github.com/srisri-t/TestResults"
echo "🌐 GitHub Pages will be available at: https://srisri-t.github.io/TestResults"
```

---

## 📋 Post-Transfer Checklist

- [ ] **Repository created** on srisri-t account
- [ ] **All commits transferred** (check git log)
- [ ] **All branches transferred** (check git branch -a)
- [ ] **GitHub Pages enabled** in repository settings
- [ ] **Site accessible** at https://srisri-t.github.io/TestResults
- [ ] **GitHub Actions working** (check Actions tab)
- [ ] **Update bookmarks** to new repository URL
- [ ] **Update any external references**

---

## 🎉 Final URLs

After successful transfer:

- **Repository:** https://github.com/srisri-t/TestResults
- **Live Site:** https://srisri-t.github.io/TestResults
- **Issues:** https://github.com/srisri-t/TestResults/issues
- **Actions:** https://github.com/srisri-t/TestResults/actions

---

## 🆘 If Something Goes Wrong

### Repository Not Found Error:
```bash
# Make sure you created the repository on GitHub first
# Repository must exist before pushing
```

### Permission Denied:
```bash
# Make sure you're logged into the correct GitHub account
# You may need to authenticate:
git config --global user.name "srisri-t"
git config --global user.email "your-email@example.com"
```

### GitHub Pages Not Working:
1. Check repository settings → Pages
2. Ensure branch is set to "main"
3. Wait 5-10 minutes for deployment
4. Check Actions tab for deployment status

---

**🎯 Ready to transfer? Just follow the steps above and you'll have your complete project with full history on the srisri-t account!**