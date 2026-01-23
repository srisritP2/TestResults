# Automated Report Upload Guide

## ✅ **New Simplified Workflow**

You can now upload reports to **any location** in the repository and the GitHub Actions workflow will automatically handle everything!

### **How It Works:**

1. **Upload JSON Report** using the upload feature
2. **Click "Upload to GitHub Pages"** button (downloads the JSON file)
3. **Copy the file to ANY location** in `cucumber-report-viewer/public/` folder
   - ✅ `cucumber-report-viewer/public/report-123.json` (root public folder)
   - ✅ `cucumber-report-viewer/public/TestResultsJsons/report-123.json` (correct folder)
   - ✅ Any subfolder works!
4. **Push to GitHub**
5. **GitHub Actions automatically:**
   - 🔍 Detects the new report file
   - 📁 Moves it to the correct `TestResultsJsons/` folder
   - 🏷️ Renames it to proper format (`gct-YYYYMMDD-HHMMSS.json`)
   - 📊 Regenerates the index and statistics
   - ✅ Commits the changes back to the repository
   - 🚀 Deploys to GitHub Pages and Netlify

### **What Changed:**

#### **GitHub Workflow Updates:**
- **New trigger paths**: Now monitors both `TestResultsJsons/*.json` AND `public/report-*.json`
- **Auto-move step**: Automatically moves misplaced files to correct location
- **Smart detection**: Only processes actual report files (ignores index.json, stats.json, etc.)

#### **UI Message Updates:**
- **ReportUploader**: Updated success message to reflect new workflow
- **ReportViewer**: Updated upload button message to reflect new workflow

### **Benefits:**

✅ **No more manual file placement** - drop files anywhere in `/public/`
✅ **Automatic organization** - files are moved to correct location
✅ **Automatic processing** - index generation happens automatically
✅ **Zero manual steps** - just upload, copy, and push
✅ **Error-proof** - workflow handles all the technical details

### **Example Workflow:**

```bash
# 1. Upload report via UI and download JSON
# 2. Copy downloaded file to repository
cp ~/Downloads/report-1234567890.json cucumber-report-viewer/public/

# 3. Commit and push
git add .
git commit -m "add new report"
git push

# 4. GitHub Actions automatically:
#    - Moves file to TestResultsJsons/
#    - Renames to gct-20260123-173634.json
#    - Updates index.json and stats.json
#    - Deploys to GitHub Pages
```

### **Monitoring:**

- Check **GitHub Actions** tab to see the workflow progress
- The workflow will show logs of file movements and processing
- Reports appear in Test Results collection within 2-3 minutes

### **Troubleshooting:**

If reports don't appear:
1. Check GitHub Actions for any workflow failures
2. Ensure the JSON file is valid Cucumber format
3. Verify the file was actually committed to the repository
4. Wait 2-3 minutes for deployment to complete

---

**🎉 Now you have a fully automated report upload and processing system!**