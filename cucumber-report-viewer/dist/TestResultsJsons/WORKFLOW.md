# Simplified Workflow for Adding Reports

## The Problem
When you click the upload/publish icon, files download to your Downloads folder, which is inconvenient.

## The Solution
Use the automated scripts instead of the manual download process.

---

## Method 1: Fully Automated (Recommended)

### Step 1: Copy your report to the correct directory
```bash
cp /path/to/your/Cucumber.json cucumber-report-viewer/public/TestResultsJsons/
```

### Step 2: Run the auto-update script
```bash
npm run add-report
```

**That's it!** This single command will:
- ✅ Regenerate index.json
- ✅ Update stats.json  
- ✅ Commit changes to git
- ✅ Push to GitHub
- ✅ Your report will be live in 2-3 minutes

---

## Method 2: Step-by-Step Control

### If you want more control over each step:

```bash
# 1. Copy report
cp /path/to/your/Cucumber.json cucumber-report-viewer/public/TestResultsJsons/

# 2. Update index only (no commit)
npm run auto-index

# 3. Review changes
git status
git diff

# 4. Commit when ready
npm run auto-index:commit

# 5. Push when ready
git push origin main
```

---

## Method 3: Manual (Old Way)

If you still want to use the upload feature:

1. Upload report via web interface
2. Click publish icon
3. **Two files download to Downloads folder**:
   - `index.json`
   - `stats.json`
4. **Move them** to `cucumber-report-viewer/public/TestResultsJsons/`
5. Commit and push

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run auto-index` | Update index only, no git operations |
| `npm run auto-index:commit` | Update index + commit to git |
| `npm run auto-index:push` | Update index + commit + push to GitHub |
| `npm run add-report` | Same as auto-index:push (full automation) |
| `npm run update-index` | Just regenerate index (verbose output) |

---

## Recommended Daily Workflow

### Morning: Add new test results
```bash
# Copy latest test results
cp E:/Automation/IdeaProjects/qa-automation-v4/target/cucumber-reports/Cucumber.json cucumber-report-viewer/public/TestResultsJsons/

# Auto-update and push
npm run add-report
```

### That's it! Your report is live in 2-3 minutes.

---

## Troubleshooting

**Q: Script says "No new reports found"**
A: Make sure you copied the report file to `TestResultsJsons/` directory

**Q: Git push fails**
A: Run `git pull origin main` first, then try again

**Q: Want to see what changed?**
A: Use `npm run auto-index` (no commit), then review with `git diff`

**Q: Made a mistake?**
A: Before pushing, you can undo with `git reset HEAD~1`

---

## Benefits of Automated Workflow

✅ **No manual file moving** - Files stay in the correct directory  
✅ **No forgetting to update index** - Automatic regeneration  
✅ **No missing files** - Both index.json and stats.json always updated  
✅ **Faster** - One command instead of multiple steps  
✅ **Fewer errors** - Automated process is consistent  
✅ **Git-friendly** - Proper commit messages automatically generated  

---

## Setting Up (One-Time)

Make the auto-update script executable:

```bash
chmod +x cucumber-report-viewer/public/TestResultsJsons/auto-update-index.js
```

That's it! Now you can use `npm run add-report` anytime.
