# Test Results Directory

This directory contains Cucumber JSON test reports and the index file that catalogs them.

## Files

- `index.json` - Catalog of all available reports with metadata
- `generate-index.js` - Script to regenerate the index after adding new reports
- Individual JSON report files (when added)

## Adding New Reports

1. Copy your Cucumber JSON report files to this directory
2. Run the index generator: `node generate-index.js`
3. Refresh the web application to see the new reports

## File Naming

Report files can have any name ending in `.json`. The system will automatically:
- Generate sequential IDs
- Extract metadata (features, scenarios, steps, etc.)
- Calculate pass/fail statistics
- Create user-friendly display names

## Index Structure

The `index.json` file contains:
```json
{
  "reports": [
    {
      "id": 1,
      "filename": "report.json",
      "name": "Report Name",
      "timestamp": "2025-01-01T00:00:00.000Z",
      "features": 5,
      "scenarios": 25,
      "steps": 100,
      "passed": 20,
      "failed": 5,
      "status": "failed"
    }
  ],
  "lastUpdated": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "totalReports": 1
}
```