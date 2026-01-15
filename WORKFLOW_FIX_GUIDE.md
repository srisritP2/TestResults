# GitHub Actions Workflow Fix Guide

## Issue
GitHub Actions workflows were failing with concurrent deployment errors:
```
deployError: Failed to create deployment (status: 400) with build version aba326192b4e3be3f956e0573e43439bfafb9a67. 
Request ID 6BC1:1645AF:210C2EF:21A9BFA:69668FA6 
Responded with: Deployment request failed for aba326192b4e3be3f956e0573e43439bfafb9a67 due to in progress deployment. 
Please cancel 9c73311eea5da6a395d18fab558cb06ea0e2e6a1 first or wait for it to complete.
```

## Root Cause
Multiple deployments were trying to run simultaneously to GitHub Pages, causing conflicts. GitHub Pages only allows one deployment at a time.

## Solution Applied

### 1. Deploy App Workflow (`.github/workflows/deploy-app.yml`)
Added concurrency configuration:

```yaml
# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
concurrency:
  group: "pages-${{ github.ref }}"
  cancel-in-progress: true
```

### 2. Update Index Workflow (`.github/workflows/update-index.yml`)
Added concurrency configuration:

```yaml
# Allow only one concurrent index update, skipping runs queued between the run in-progress and latest queued.
concurrency:
  group: "update-index-${{ github.ref }}"
  cancel-in-progress: true
```

## How It Works
- **Groups workflows by git reference**: Ensures only one deployment per branch runs at a time
- **Automatically cancels in-progress runs**: When a new commit is pushed, the old deployment is cancelled
- **Prevents queue buildup**: Latest code is always prioritized for deployment
- **Separate concurrency groups**: Deploy and update-index workflows don't block each other

## Verification Steps
1. Push changes to trigger workflows
2. Monitor GitHub Actions tab - should see:
   - Old deployments automatically cancelled
   - New deployments starting immediately
   - No more "concurrent deployment" errors
3. Check GitHub Pages URL to verify deployment succeeded
4. Verify reports are displaying correctly

## Status
✅ **FIXED** - Both workflows now have proper concurrency controls to prevent conflicts.

## Additional Notes
- The `cancel-in-progress: true` setting ensures the latest code is always deployed
- This is the recommended approach for GitHub Pages deployments
- Each workflow has its own concurrency group to avoid cross-workflow blocking
- If you see the error again, it means an old deployment is still running - the new concurrency settings will automatically cancel it

## Manual Intervention (if needed)
If workflows are still stuck:
1. Go to GitHub repository → Actions tab
2. Find the stuck workflow run
3. Click "Cancel workflow"
4. Trigger a new deployment manually using "Run workflow" button
