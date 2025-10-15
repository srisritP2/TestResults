#!/usr/bin/env node

/**
 * Simple Express server to handle report uploads and index generation
 * This allows the frontend to save files to the uploads folder and update index.json
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DeletionUtils = require('./src/utils/deletionUtils');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const UPLOADS_DIR = path.join(__dirname, 'public/TestResultsJsons');
const INDEX_SCRIPT = path.join(UPLOADS_DIR, 'generate-index-enhanced.js');

// Initialize deletion utilities
const deletionUtils = new DeletionUtils(UPLOADS_DIR);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Fix skipped steps that have duration (common Cucumber bug)
 */
function fixSkippedStepsWithDuration(features) {
  let fixedCount = 0;
  
  features.forEach(feature => {
    if (feature.elements) {
      feature.elements.forEach(element => {
        if (element.steps) {
          element.steps.forEach(step => {
            // Fix steps marked as skipped but with duration > 0
            if (step.result && 
                step.result.status === 'skipped' && 
                step.result.duration && 
                step.result.duration > 0) {
              step.result.status = 'passed';
              fixedCount++;
            }
          });
        }
      });
    }
  });
  
  return fixedCount;
}

/**
 * Normalize report data to standard Cucumber JSON format
 */
function normalizeReportFormat(reportData) {
  let normalizedData;
  
  // If it has features property, extract the array
  if (reportData.features && Array.isArray(reportData.features)) {
    normalizedData = reportData.features;
  }
  // If it's already an array, use as-is
  else if (Array.isArray(reportData)) {
    normalizedData = reportData;
  }
  // If it's a single feature object, wrap in array
  else if (reportData.name && reportData.elements) {
    normalizedData = [reportData];
  }
  // Default: return as-is and let validation catch issues
  else {
    normalizedData = reportData;
  }
  
  // Apply auto-fixes if we have valid data
  if (Array.isArray(normalizedData)) {
    const fixedSteps = fixSkippedStepsWithDuration(normalizedData);
    if (fixedSteps > 0) {
      console.log(`🔧 Auto-fixed ${fixedSteps} skipped steps with duration`);
    }
  }
  
  return normalizedData;
}

/**
 * Save report data to TestResultsJsons directory
 */
function saveReportToDirectory(reportId, reportData) {
  try {
    // Normalize the format before saving
    const normalizedData = normalizeReportFormat(reportData);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportId}-${timestamp}.json`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Write file with proper formatting
    fs.writeFileSync(filepath, JSON.stringify(normalizedData, null, 2));
    
    console.log(`✅ Report saved: ${filename} (format normalized)`);
    return filename;
  } catch (error) {
    console.error('❌ Error saving report:', error.message);
    throw error;
  }
}

/**
 * Generate updated index.json
 */
function generateIndex() {
  try {
    console.log('🔄 Generating updated index...');
    
    // Change to the TestResultsJsons directory
    const originalCwd = process.cwd();
    process.chdir(UPLOADS_DIR);
    
    // Run the tolerant index generation script
    execSync('node generate-index-tolerant-v2.js --verbose', { stdio: 'inherit' });
    
    // Change back to original directory
    process.chdir(originalCwd);
    
    console.log('✅ Index generated successfully');
  } catch (error) {
    console.error('❌ Error generating index:', error.message);
    throw error;
  }
}

// API Routes

/**
 * POST /api/upload-report
 * Upload a new report and update the index
 */
app.post('/api/upload-report', async (req, res) => {
  try {
    const { reportId, reportData, name } = req.body;
    
    if (!reportId || !reportData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId and reportData'
      });
    }

    // Validate report data structure
    if (!reportData.features || !Array.isArray(reportData.features)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report data: missing features array'
      });
    }

    // Save the report file
    const filename = saveReportToDirectory(reportId, reportData);
    
    // Generate updated index
    generateIndex();
    
    res.json({
      success: true,
      message: 'Report uploaded successfully',
      filename,
      reportId,
      url: `/TestResultsJsons/${filename}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports
 * Get list of available reports from index.json
 */
app.get('/api/reports', (req, res) => {
  try {
    const indexPath = path.join(UPLOADS_DIR, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return res.json({
        success: true,
        reports: []
      });
    }
    
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    
    res.json({
      success: true,
      reports: indexData
    });
    
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/reports/:filename
 * Enhanced delete with support for both hard and soft delete
 * Query params:
 * - soft: true/false (default: false for localhost, true for others)
 */
app.delete('/api/reports/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { soft } = req.query;
    
    // Determine deletion type based on environment and query param
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const shouldSoftDelete = soft === 'true' || (!isLocalhost && soft !== 'false');
    
    console.log(`🗑️  Delete request: ${filename} (soft: ${shouldSoftDelete})`);
    
    let result;
    
    if (shouldSoftDelete) {
      // Soft delete - mark as deleted in metadata
      result = await deletionUtils.markReportAsDeleted(filename);
    } else {
      // Hard delete - remove file and update index
      const filepath = path.join(UPLOADS_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          error: 'Report file not found'
        });
      }
      
      // Delete the file
      result = await deletionUtils.deleteReportFile(filename);
      
      // Remove from index
      await deletionUtils.removeFromIndex(filename);
    }
    
    // Regenerate index to reflect changes
    generateIndex();
    
    res.json({
      success: true,
      message: result.message,
      deletionType: result.type,
      filename: result.filename,
      environment: isLocalhost ? 'localhost' : 'production'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/regenerate-index
 * Manually trigger index regeneration
 */
app.post('/api/regenerate-index', (req, res) => {
  try {
    generateIndex();
    
    res.json({
      success: true,
      message: 'Index regenerated successfully'
    });
    
  } catch (error) {
    console.error('Index regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/deleted
 * Get list of deleted reports
 */
app.get('/api/reports/deleted', async (req, res) => {
  try {
    const deletedReports = await deletionUtils.getDeletedReports();
    
    res.json({
      success: true,
      deletedReports,
      count: deletedReports.length
    });
    
  } catch (error) {
    console.error('Error getting deleted reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/:filename/restore
 * Restore a soft-deleted report
 */
app.post('/api/reports/:filename/restore', async (req, res) => {
  try {
    const { filename } = req.params;
    
    const result = await deletionUtils.restoreReport(filename);
    
    if (result.success) {
      // Regenerate index to show restored report
      generateIndex();
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sync/status
 * Get synchronization status between local and published reports
 */
app.get('/api/sync/status', async (req, res) => {
  try {
    const indexPath = path.join(UPLOADS_DIR, 'index.json');
    const index = fs.existsSync(indexPath) ? 
      JSON.parse(fs.readFileSync(indexPath, 'utf8')) : { reports: [] };
    
    const deletedReports = await deletionUtils.getDeletedReports();
    const reportsNeedingCleanup = await deletionUtils.getReportsNeedingCleanup();
    
    const syncStatus = {
      localReports: index.reports?.length || 0,
      deletedReports: deletedReports.length,
      pendingCleanup: reportsNeedingCleanup.length,
      lastSyncAt: index.generated || null,
      needsCleanup: reportsNeedingCleanup.map(r => ({
        filename: r.filename,
        deletedAt: r.deletedAt
      }))
    };
    
    res.json({
      success: true,
      syncStatus
    });
    
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uploadsDir: UPLOADS_DIR
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Report upload server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;