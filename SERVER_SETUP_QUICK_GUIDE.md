# Quick Server Setup Guide - Fix Report Deletion Issue

## The Problem
When you delete reports using the bulk delete feature, they disappear from the UI but reappear after refreshing the page. This happens because the **backend server is not running**.

## The Solution
Start the backend server to enable permanent report deletion.

## Quick Fix (Choose One)

### Option 1: Run Backend + Frontend Together (Recommended)
```bash
cd cucumber-report-viewer
npm run dev
```
This starts both the frontend (Vue app) and backend server simultaneously.

### Option 2: Run Backend Only
```bash
cd cucumber-report-viewer
npm run server
```
Then in another terminal, run the frontend:
```bash
cd cucumber-report-viewer
npm run serve
```

### Option 3: Alternative Backend Start
```bash
cd cucumber-report-viewer
npm start
```

## How to Verify It's Working

1. **Check the Server Status Button**: In the Test Reports section, you'll see a server status button:
   - 🟢 **Green "Server"** = Backend is running (deletions will be permanent)
   - 🟡 **Yellow "No Server"** = Backend is offline (deletions are temporary)

2. **Click the Server Status Button**: It will tell you if the server is running and provide instructions if it's not.

3. **Test Deletion**: Try deleting a report. If the server is running, it should stay deleted after refreshing the page.

## What the Backend Server Does

- **Permanent Deletion**: Actually removes report files from the server
- **Index Updates**: Updates the main index.json file that lists all reports
- **Proper Cleanup**: Handles both hard deletion (localhost) and soft deletion (production)

## Troubleshooting

### If you get "EADDRINUSE" error:
```bash
# Kill any process using port 3001
npx kill-port 3001
# Then try again
npm run dev
```

### If you get "command not found" errors:
```bash
# Install dependencies first
npm install
# Then try again
npm run dev
```

### If the server starts but reports still reappear:
1. Check the server status button in the UI
2. Make sure you're accessing the app through the correct URL
3. Try refreshing the page after starting the server

## Server Endpoints (For Reference)

When the server is running on `http://localhost:3001`, these endpoints are available:

- `GET /api/health` - Check if server is running
- `DELETE /api/reports/:filename` - Delete a report permanently
- `POST /api/regenerate-index` - Regenerate the reports index
- `GET /api/reports` - Get list of all reports

## Current Status Check

Run this command to see if the server is already running:
```bash
curl http://localhost:3001/api/health
```

If you get a response, the server is running. If you get "connection refused", you need to start it.

---

**TL;DR**: Run `npm run dev` in the cucumber-report-viewer folder, then try deleting reports again. The green "Server" button in the UI will confirm it's working.