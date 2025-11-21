# GitHub Notifications Guide

## What Changed

The GitHub bot now sends enhanced notifications with your GitHub Pages URL when reports are updated!

## Email Notifications

When you push a new report, you'll receive an email notification that includes:

### Email Content:
```
🥒 Cucumber Reports Updated

Summary:
- 📊 45 reports processed
- 🧪 659 scenarios
- ✅ 99.70% pass rate
- ⏱️ 2.5s average duration

Latest Report: Admin Client Settings Page Test Scenarios

🔗 View Reports on GitHub Pages
   https://srisritP2.github.io/TestResults/

📈 Reports are automatically deployed and available within 2-3 minutes.
```

## How It Works

1. **You push a report** → GitHub detects the new JSON file
2. **Update Index workflow runs** → Updates index.json and stats.json
3. **Bot creates a commit comment** → With the summary and link
4. **GitHub sends email** → To your registered email address
5. **You click the link** → Opens your GitHub Pages site

## Email Settings

To ensure you receive these notifications:

### 1. Check GitHub Email Settings
1. Go to GitHub.com → Settings → Notifications
2. Under "Email notification preferences":
   - ✅ Enable "Comments on Issues and Pull Requests"
   - ✅ Enable "Commits"
3. Verify your email address is confirmed

### 2. Repository Watch Settings
1. Go to your repository: `https://github.com/srisritP2/TestResults`
2. Click "Watch" → "Custom"
3. Enable:
   - ✅ Issues
   - ✅ Pull requests
   - ✅ Releases
   - ✅ Discussions

### 3. Workflow Notifications
GitHub automatically sends emails for:
- ✅ Workflow failures
- ✅ Workflow successes (if enabled)
- ✅ Commit comments (what we're using)

## Customizing Notifications

### Change the Message
Edit `.github/workflows/update-index.yml` around line 210:

```yaml
const comment = `## 🥒 Cucumber Reports Updated
              
**Summary:**
- 📊 **${stats.totalReports}** reports processed
- 🧪 **${stats.totalScenarios}** scenarios
- ✅ **${stats.passRate}%** pass rate

🔗 **[View Reports](https://srisritP2.github.io/TestResults/)**
`;
```

### Add More Information
You can add:
- Failed test count
- Duration trends
- Comparison with previous run
- Direct link to specific report

### Example Enhanced Message:
```javascript
const comment = `## 🥒 Cucumber Reports Updated

**Summary:**
- 📊 **${stats.totalReports}** reports processed
- 🧪 **${stats.totalScenarios}** scenarios
- ✅ **${stats.passRate}%** pass rate
- ❌ **${stats.failRate}%** fail rate
- ⏱️ **${stats.averageDuration}s** average duration

**Latest Report:** ${stats.newestReport?.name || 'N/A'}
**Status:** ${stats.passRate >= 95 ? '🟢 Excellent' : stats.passRate >= 80 ? '🟡 Good' : '🔴 Needs Attention'}

🔗 **[View All Reports](https://srisritP2.github.io/TestResults/)**
📊 **[View Latest Report](https://srisritP2.github.io/TestResults/#/report/${stats.newestReport?.id})**

📈 Reports are automatically deployed and available within 2-3 minutes.
`;
```

## Testing Notifications

To test if notifications are working:

1. **Add a test report**:
   ```bash
   # Copy an existing report with a new name
   copy cucumber-report-viewer\public\TestResultsJsons\Admin-*.json cucumber-report-viewer\public\TestResultsJsons\test-notification.json
   
   # Push it
   git add cucumber-report-viewer\public\TestResultsJsons\test-notification.json
   git commit -m "Test notification"
   git push
   ```

2. **Check your email** (within 1-2 minutes)
3. **Click the link** in the email to verify it works

## Troubleshooting

### Not Receiving Emails?

**Check 1: GitHub Email Settings**
- Go to GitHub Settings → Notifications
- Verify your email is confirmed
- Check spam/junk folder

**Check 2: Repository Notifications**
- Make sure you're watching the repository
- Check notification settings for the repo

**Check 3: Workflow Logs**
- Go to Actions tab in your repository
- Check if the "Create deployment comment" step ran
- Look for any errors

**Check 4: Email Filters**
- Check if GitHub emails are being filtered
- Look for emails from `notifications@github.com`

### Link Not Working?

**Issue**: Link goes to wrong page
**Solution**: Update the URL in `.github/workflows/update-index.yml`

**Issue**: Link shows 404
**Solution**: Wait 2-3 minutes for deployment to complete

## Additional Features

### Slack/Discord Notifications
You can also send notifications to Slack or Discord by adding steps to the workflow:

```yaml
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🥒 New test report available!",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Cucumber Reports Updated*\n📊 ${{ steps.stats.outputs.totalReports }} reports\n✅ ${{ steps.stats.outputs.passRate }}% pass rate\n\n<https://srisritP2.github.io/TestResults/|View Reports>"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Teams Notifications
Similar setup for Microsoft Teams using webhooks.

## Summary

✅ **Email notifications now include:**
- Report statistics
- Pass rate
- Direct link to GitHub Pages
- Deployment timing info

✅ **Automatic triggers:**
- Every time you push a new report
- When index is updated
- When deployment completes

✅ **Easy to customize:**
- Edit the workflow file
- Add more stats
- Change the message format
- Add additional notification channels

The next time you push a report, check your email for the enhanced notification with the clickable link to your GitHub Pages site! 📧
