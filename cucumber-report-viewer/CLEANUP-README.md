# Report Cleanup and Import

This guide explains how to clean up all local reports and import fresh reports from the Git repository.

## Quick Start

### Windows
```bash
cleanup-and-import.bat
```

### Linux/Mac
```bash
./cleanup-and-import.sh
```

## What the cleanup does

1. **Removes all existing report files** (except scripts and .gitkeep)
2. **Scans for all .json report files** in the TestResultsJsons folder
3. **Processes each report** and extracts metadata
4. **Generates a fresh index.json** with proper chronological numbering
5. **Provides browser cleanup instructions**

## Manual Process

If you prefer to run the cleanup manually:

1. Navigate to the TestResultsJsons folder:
   ```bash
   cd cucumber-report-viewer/public/TestResultsJsons
   ```

2. Run the cleanup script:
   ```bash
   node cleanup-and-import-from-git.js
   ```

3. Clear browser storage:
   - Open your browser
   - Open Developer Console (F12)
   - Run: `localStorage.clear(); location.reload();`

## Report Numbering

After cleanup, reports will be numbered based on their chronological order:
- **Report 1**: Oldest report by timestamp
- **Report 2**: Second oldest report
- **Report N**: Newest report

The numbering is based on the exact timestamp (down to seconds) extracted from:
1. Step result timestamps (most accurate)
2. Filename timestamp patterns
3. File creation time (fallback)

## Troubleshooting

### No reports found
- Make sure you have .json report files in the TestResultsJsons folder
- Check that the files are valid JSON format
- Ensure files are not in subdirectories

### Invalid JSON errors
- Check that report files are properly formatted JSON
- Remove any corrupted or incomplete files
- Re-run the cleanup script

### Browser still shows old reports
- Make sure you cleared localStorage: `localStorage.clear()`
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Check browser console for any errors

## Files Created/Modified

- `index.json` - Fresh index with all reports and statistics
- Browser localStorage - Cleared (requires manual step)
- Report numbering - Recalculated based on chronological order

## What Gets Preserved

- All .json report files in the TestResultsJsons folder
- Script files (cleanup-and-import-from-git.js, generate-*.js)
- .gitkeep and .git files