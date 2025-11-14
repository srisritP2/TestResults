# Download Button Location Guide

## Where to Find the Download Button

### Step 1: Upload a Report
1. Click "Select or drag a Cucumber JSON file"
2. Choose your JSON file
3. Click "Upload"

### Step 2: Open the Management Section
1. Scroll down to "Previously Uploaded Reports"
2. Click the "Manage" button to expand the list

### Step 3: Find the Download Button
You'll see three buttons for each report:

```
[Report Name]
[Date] • [Size] • [Storage Type]

[👁️ View] [⬇️ Download] [🗑️ Delete]
  Blue      Green        Red
```

### Button Details

| Icon | Color | Action | Tooltip |
|------|-------|--------|---------|
| 👁️ (eye) | Blue | View the report | "View Report" |
| ⬇️ (download) | **Green** | Download JSON file | "Download JSON file for GitHub" |
| 🗑️ (trash) | Red | Delete the report | "Delete Report" |

## What Happens When You Click Download

1. **File Downloads**: The JSON file downloads to your Downloads folder
2. **Success Message**: Shows instructions:
   > "Downloaded report-xxxxx.json! Copy this file to cucumber-report-viewer/public/TestResultsJsons/ and push to GitHub."
3. **File Name**: Format is `report-[timestamp].json` or the original name

## If You Don't See the Button

### Option 1: Restart Dev Server (if running locally)
```bash
# Stop the server (Ctrl+C)
cd cucumber-report-viewer
npm run serve
```

### Option 2: Hard Refresh Browser
- **Windows**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Option 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 4: Check if Reports Exist
- The "Previously Uploaded Reports" section only shows if you have uploaded reports
- If you don't see any reports, upload one first

## Visual Layout

```
┌─────────────────────────────────────────────────┐
│ Upload Cucumber JSON Report                     │
│ [Select or drag a Cucumber JSON file]           │
│ [Upload]                                         │
├─────────────────────────────────────────────────┤
│ Previously Uploaded Reports        [Manage ▼]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Cucumber Test Report                        │ │
│ │ 11/14/2025 3:30 PM • 540 KB • Saved         │ │
│ │                                              │ │
│ │ [👁️] [⬇️] [🗑️]                              │ │
│ │  View Download Delete                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Another Test Report                         │ │
│ │ 11/14/2025 2:15 PM • 268 KB • Saved         │ │
│ │                                              │ │
│ │ [👁️] [⬇️] [🗑️]                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [Clear All]                                      │
└─────────────────────────────────────────────────┘
```

## After Downloading

Once you download the file:

1. **Find the file** in your Downloads folder
2. **Copy it** to: `cucumber-report-viewer/public/TestResultsJsons/`
3. **Push to GitHub**:
   ```bash
   git add cucumber-report-viewer/public/TestResultsJsons/report-*.json
   git commit -m "Add new test report"
   git push
   ```
4. **GitHub Actions** will automatically update the index
5. **Wait 2-3 minutes** for deployment to GitHub Pages

## Troubleshooting

### Button Not Visible
- ✅ Check if you're looking in the "Previously Uploaded Reports" section
- ✅ Click "Manage" to expand the list
- ✅ Restart dev server or hard refresh browser
- ✅ Check browser console for errors (F12)

### Button Visible But Not Working
- ✅ Check browser console for errors
- ✅ Verify the report exists in localStorage
- ✅ Try re-uploading the report

### Download Not Starting
- ✅ Check browser's download settings
- ✅ Check if pop-ups are blocked
- ✅ Try a different browser

## Need Help?

If the button still doesn't appear after trying all the above:
1. Check the browser console (F12) for errors
2. Verify you're on the latest version of the code
3. Try uploading a new report to test
