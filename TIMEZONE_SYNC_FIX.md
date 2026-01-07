# Timezone Synchronization Fix

## Issue
Local reports and GitHub/Netlify reports show different times because:
1. **Local development**: Shows times in user's local timezone
2. **GitHub Actions**: Processes files in UTC timezone  
3. **Netlify deployment**: Serves files with UTC timestamps
4. **Filename extraction**: Assumes timestamps are in UTC

## Root Cause
The `generate-index-enhanced.js` script extracts timestamps from filenames like `gct-20260102-195445.json` and assumes they're in UTC, but when files are created locally, they might use local timezone.

## Solution

### 1. Standardize All Timestamps to UTC
All timestamps in the system should be stored and processed in UTC:
- ✅ ReportUploader.vue already uses `new Date().toISOString()` (UTC)
- ✅ GitHub Actions runs in UTC timezone
- ✅ Index generation now explicitly handles UTC

### 2. Display Times in User's Local Timezone
The UI should show times in the user's local timezone:
- ✅ `formatDate()` function already converts UTC to local time for display
- ✅ This is correct behavior for user experience

### 3. Filename Consistency
Ensure filenames reflect the actual execution time:
- When uploading locally: Use UTC time for filename
- When processing in GitHub Actions: Files already have correct UTC timestamps

## Implementation

### Updated generate-index-enhanced.js
- Added explicit UTC handling comments
- Improved timestamp extraction logging
- Consistent UTC assumption for all timestamps

### Verification Steps
1. Upload a report locally
2. Check the timestamp in the UI (should show local time)
3. Push to GitHub and wait for deployment
4. Check the same report on GitHub Pages (should show same local time when viewed)

## Expected Behavior
- **Local UI**: Shows "Jan 7, 2026 10:54 AM" (user's local timezone)
- **GitHub Pages**: Shows "Jan 7, 2026 10:54 AM" (same local time when viewed by same user)
- **Internal storage**: Uses "2026-01-07T15:54:45.000Z" (UTC format)
- **Filenames**: Use "gct-20260107-155445.json" (UTC-based naming)

This ensures consistency across all environments while maintaining user-friendly local time display.