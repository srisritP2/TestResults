#!/usr/bin/env node
/**
 * Enhanced Cucumber Reports Index Generator
 * Features:
 * - Rich metadata extraction
 * - Performance analytics
 * - Error handling and validation
 * - Multiple output formats
 * - Automatic file organization
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CucumberIndexGenerator {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || process.cwd();
    this.outputFile = options.outputFile || 'index.json';
    this.verbose = options.verbose || false;
    this.validateReports = options.validateReports !== false;
    this.generateStats = options.generateStats !== false;
  }

  log(message) {
    if (this.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  /**
   * Transform feature name to custom report name
   * Customize this function to change how feature names are displayed
   */
  transformFeatureName(featureName) {
    // Replace "Admin Client Settings Page Test Scenarios" with custom name
    if (featureName.includes('Admin Client Settings Page')) {
      return 'GeoCall Automation Test Results Report';
    }
    
    // You can add more transformations here
    // Example: featureName.replace('Old Name', 'New Name')
    
    // Return original name if no transformation matches
    return featureName;
  }

  /**
   * Sanitize string for use in filenames
   */
  sanitizeFilename(str) {
    return str
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  }

  /**
   * Extract comprehensive metadata from Cucumber JSON
   */
  extractMetadata(json, filename) {
    const metadata = {
      id: filename.replace(/\.json$/, ''),
      name: 'Automation Test Results',
      date: null,
      size: 0,
      features: 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tags: new Set(),
      environment: null,
      tool: null,
      version: null,
      hash: null
    };

    try {
      const fileContent = JSON.stringify(json);
      metadata.size = Buffer.byteLength(fileContent, 'utf8');
      metadata.hash = crypto.createHash('md5').update(fileContent).digest('hex');

      if (!Array.isArray(json)) {
        throw new Error('Invalid Cucumber JSON format: root should be an array');
      }

      metadata.features = json.length;

      // Extract data from each feature
      json.forEach(feature => {
        // Feature name (use first feature name as report name)
        if (feature.name && metadata.name === 'Automation Test Results') {
          // Transform feature name to custom report name
          metadata.name = this.transformFeatureName(feature.name);
        }

        // Feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => {
            const cleanTag = typeof tag === 'string' ? tag.replace(/[@{}]/g, '') : tag.name?.replace(/[@{}]/g, '');
            if (cleanTag) metadata.tags.add(cleanTag);
          });
        }

        // Process scenarios/elements
        const elements = feature.elements || feature.scenarios || [];
        elements.forEach(scenario => {
          if (scenario.type === 'background') return;

          metadata.scenarios++;

          // Scenario tags
          if (scenario.tags) {
            scenario.tags.forEach(tag => {
              const cleanTag = typeof tag === 'string' ? tag.replace(/[@{}]/g, '') : tag.name?.replace(/[@{}]/g, '');
              if (cleanTag) metadata.tags.add(cleanTag);
            });
          }

          // Extract timestamp (use earliest)
          if (scenario.start_timestamp) {
            const timestamp = new Date(scenario.start_timestamp);
            if (!metadata.date || timestamp < new Date(metadata.date)) {
              metadata.date = scenario.start_timestamp;
            }
          }

          // Process steps
          if (scenario.steps) {
            scenario.steps.forEach(step => {
              metadata.steps++;
              
              const status = step.result?.status || step.status || 'unknown';
              switch (status) {
                case 'passed': metadata.passed++; break;
                case 'failed': metadata.failed++; break;
                case 'skipped': metadata.skipped++; break;
              }

              // Add duration
              if (step.result?.duration) {
                metadata.duration += step.result.duration;
              }
            });
          }
        });

        // Extract environment info from metadata
        if (feature.metadata) {
          metadata.environment = feature.metadata.environment || metadata.environment;
          metadata.tool = feature.metadata.tool || metadata.tool;
          metadata.version = feature.metadata.version || metadata.version;
          if (feature.metadata.timestamp && !metadata.date) {
            metadata.date = feature.metadata.timestamp;
          }
        }
      });

      // Convert duration from nanoseconds to seconds
      if (metadata.duration > 1000000) {
        metadata.duration = metadata.duration / 1e9;
      }

      // Convert tags Set to Array
      metadata.tags = Array.from(metadata.tags).sort();

      // Try to extract timestamp from report ID first (prioritize filename timestamp)
      if (filename.startsWith('report-')) {
        const timestampMatch = filename.match(/report-(\d+)\.json$/);
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          if (timestamp && timestamp > 1000000000000) { // Valid timestamp
            metadata.date = new Date(timestamp).toISOString();
            this.log(`Extracted timestamp from filename: ${filename} -> ${metadata.date}`);
          }
        }
      }

      // Fallback to file modification time if no timestamp found
      if (!metadata.date) {
        const stats = fs.statSync(path.join(this.reportsDir, filename));
        metadata.date = stats.mtime.toISOString();
      }

      // Generate suggested filename
      const timestamp = metadata.date.replace(/[:.]/g, '-');
      const sanitizedName = this.sanitizeFilename(metadata.name);
      metadata.suggestedFilename = `${sanitizedName}-${timestamp}.json`;

    } catch (error) {
      this.log(`Error processing ${filename}: ${error.message}`);
      throw error;
    }

    return metadata;
  }

  /**
   * Validate Cucumber JSON structure
   */
  validateReport(json, filename) {
    const errors = [];

    if (!Array.isArray(json)) {
      errors.push('Root element must be an array');
      return errors;
    }

    json.forEach((feature, featureIndex) => {
      if (!feature.name) {
        errors.push(`Feature ${featureIndex}: Missing name`);
      }

      const elements = feature.elements || feature.scenarios || [];
      elements.forEach((scenario, scenarioIndex) => {
        if (!scenario.name) {
          errors.push(`Feature ${featureIndex}, Scenario ${scenarioIndex}: Missing name`);
        }

        if (scenario.steps && Array.isArray(scenario.steps)) {
          scenario.steps.forEach((step, stepIndex) => {
            if (!step.name) {
              errors.push(`Feature ${featureIndex}, Scenario ${scenarioIndex}, Step ${stepIndex}: Missing name`);
            }
            if (!step.result && !step.status) {
              errors.push(`Feature ${featureIndex}, Scenario ${scenarioIndex}, Step ${stepIndex}: Missing result/status`);
            }
          });
        }
      });
    });

    return errors;
  }

  /**
   * Generate comprehensive statistics
   */
  generateStatistics(reports) {
    const stats = {
      totalReports: reports.length,
      totalFeatures: 0,
      totalScenarios: 0,
      totalSteps: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration: 0,
      totalSize: 0,
      averageDuration: 0,
      passRate: 0,
      failRate: 0,
      skipRate: 0,
      oldestReport: null,
      newestReport: null,
      allTags: new Set(),
      environments: new Set(),
      tools: new Set()
    };

    reports.forEach(report => {
      stats.totalFeatures += report.features || 0;
      stats.totalScenarios += report.scenarios || 0;
      stats.totalSteps += report.steps || 0;
      stats.totalPassed += report.passed || 0;
      stats.totalFailed += report.failed || 0;
      stats.totalSkipped += report.skipped || 0;
      stats.totalDuration += report.duration || 0;
      stats.totalSize += report.size || 0;

      if (report.tags) {
        report.tags.forEach(tag => stats.allTags.add(tag));
      }
      if (report.environment) stats.environments.add(report.environment);
      if (report.tool) stats.tools.add(report.tool);

      const reportDate = new Date(report.date);
      if (!stats.oldestReport || reportDate < new Date(stats.oldestReport.date)) {
        stats.oldestReport = report;
      }
      if (!stats.newestReport || reportDate > new Date(stats.newestReport.date)) {
        stats.newestReport = report;
      }
    });

    if (stats.totalSteps > 0) {
      stats.passRate = ((stats.totalPassed / stats.totalSteps) * 100).toFixed(2);
      stats.failRate = ((stats.totalFailed / stats.totalSteps) * 100).toFixed(2);
      stats.skipRate = ((stats.totalSkipped / stats.totalSteps) * 100).toFixed(2);
    }

    if (reports.length > 0) {
      stats.averageDuration = (stats.totalDuration / reports.length).toFixed(2);
    }

    stats.allTags = Array.from(stats.allTags).sort();
    stats.environments = Array.from(stats.environments).sort();
    stats.tools = Array.from(stats.tools).sort();

    return stats;
  }

  /**
   * Organize files by renaming them to consistent format
   */
  organizeFiles(reports) {
    const renames = [];

    reports.forEach(report => {
      const currentFilename = `${report.id}.json`;
      const suggestedFilename = report.suggestedFilename;

      if (currentFilename !== suggestedFilename) {
        const currentPath = path.join(this.reportsDir, currentFilename);
        const newPath = path.join(this.reportsDir, suggestedFilename);

        try {
          if (!fs.existsSync(newPath)) {
            fs.renameSync(currentPath, newPath);
            report.id = suggestedFilename.replace(/\.json$/, '');
            renames.push({ from: currentFilename, to: suggestedFilename });
            this.log(`Renamed: ${currentFilename} → ${suggestedFilename}`);
          }
        } catch (error) {
          this.log(`Failed to rename ${currentFilename}: ${error.message}`);
        }
      }
    });

    return renames;
  }

  /**
   * Load deleted reports list
   */
  async getDeletedReports() {
    try {
      const deletedPath = path.join(this.reportsDir, '.deleted-reports.json');
      if (!fs.existsSync(deletedPath)) {
        return [];
      }
      const data = fs.readFileSync(deletedPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.log(`Error loading deleted reports: ${error.message}`);
      return [];
    }
  }

  /**
   * Main generation method
   */
  async generate() {
    this.log('Starting enhanced index generation...');

    try {
      // Find all JSON files
      const files = fs.readdirSync(this.reportsDir)
        .filter(f => f.endsWith('.json') && 
                    f !== 'index.json' && 
                    !f.startsWith('generate-index') &&
                    f !== 'stats.json' &&
                    !f.startsWith('.deleted-reports'));

      this.log(`Found ${files.length} report files`);

      // Load deleted reports list
      const deletedReports = await this.getDeletedReports();
      const deletedFilenames = deletedReports.map(r => r.filename);
      this.log(`Found ${deletedReports.length} deleted reports`);

      const reports = [];
      const errors = [];

      // Process each file
      for (const filename of files) {
        try {
          // Skip deleted reports (soft delete)
          if (deletedFilenames.includes(filename)) {
            this.log(`Skipping deleted report: ${filename}`);
            continue;
          }

          const filePath = path.join(this.reportsDir, filename);
          const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          // Validate if enabled
          if (this.validateReports) {
            const validationErrors = this.validateReport(json, filename);
            if (validationErrors.length > 0) {
              errors.push({ file: filename, errors: validationErrors });
              this.log(`Validation errors in ${filename}: ${validationErrors.join(', ')}`);
            }
          }

          // Extract metadata
          const metadata = this.extractMetadata(json, filename);
          
          // Add deletion status
          metadata.status = 'active';
          metadata.isDeleted = false;
          
          reports.push(metadata);

        } catch (error) {
          errors.push({ file: filename, errors: [error.message] });
          this.log(`Failed to process ${filename}: ${error.message}`);
        }
      }

      // Sort reports by date (newest first)
      reports.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Organize files if requested
      const renames = this.organizeFiles(reports);

      // Generate statistics
      let statistics = null;
      if (this.generateStats) {
        statistics = this.generateStatistics(reports);
      }

      // Create enhanced index
      const index = {
        generated: new Date().toISOString(),
        version: '2.1.0',
        reports: reports.map(r => ({
          id: r.id,
          name: r.name,
          date: r.date,
          features: r.features,
          scenarios: r.scenarios,
          steps: r.steps,
          passed: r.passed,
          failed: r.failed,
          skipped: r.skipped,
          duration: r.duration,
          size: r.size,
          tags: r.tags,
          environment: r.environment,
          tool: r.tool,
          hash: r.hash,
          status: r.status,
          isDeleted: r.isDeleted
        })),
        deletionInfo: {
          deletedCount: deletedReports.length,
          pendingCleanup: deletedReports.filter(r => r.needsCleanup).length,
          lastDeletionAt: deletedReports.length > 0 ? 
            Math.max(...deletedReports.map(r => new Date(r.deletedAt).getTime())) : null
        },
        statistics,
        errors: errors.length > 0 ? errors : undefined,
        renames: renames.length > 0 ? renames : undefined
      };

      // Write index file
      const indexPath = path.join(this.reportsDir, this.outputFile);
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

      // Write separate stats file if enabled
      if (this.generateStats && statistics) {
        const statsPath = path.join(this.reportsDir, 'stats.json');
        fs.writeFileSync(statsPath, JSON.stringify(statistics, null, 2));
      }

      this.log(`✅ Generated ${this.outputFile} with ${reports.length} active reports`);
      if (deletedReports.length > 0) {
        this.log(`🗑️  Excluded ${deletedReports.length} deleted reports from index`);
      }
      if (errors.length > 0) {
        this.log(`⚠️  Found ${errors.length} files with validation errors`);
      }
      if (renames.length > 0) {
        this.log(`📁 Renamed ${renames.length} files for consistency`);
      }

      return {
        success: true,
        reportsCount: reports.length,
        errorsCount: errors.length,
        renamesCount: renames.length,
        statistics
      };

    } catch (error) {
      this.log(`❌ Generation failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    validateReports: !args.includes('--no-validate'),
    generateStats: !args.includes('--no-stats')
  };

  const generator = new CucumberIndexGenerator(options);
  
  generator.generate()
    .then(result => {
      console.log(`\n✅ Index generation completed successfully!`);
      console.log(`📊 Reports: ${result.reportsCount}`);
      if (result.errorsCount > 0) {
        console.log(`⚠️  Errors: ${result.errorsCount}`);
      }
      if (result.renamesCount > 0) {
        console.log(`📁 Files renamed: ${result.renamesCount}`);
      }
      if (result.statistics) {
        console.log(`📈 Pass rate: ${result.statistics.passRate}%`);
      }
    })
    .catch(error => {
      console.error(`❌ Generation failed:`, error.message);
      process.exit(1);
    });
}

module.exports = CucumberIndexGenerator;