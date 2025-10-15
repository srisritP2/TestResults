/**
 * Enhanced Report Service
 * Handles report loading, caching, and statistics
 */

import CucumberJsonValidator from '@/utils/CucumberJsonValidator';
import TestStatusCalculator from '@/utils/TestStatusCalculator';
import ErrorHandler from '@/utils/ErrorHandler';
import DataIntegrityValidator from '@/utils/DataIntegrityValidator';

class ReportService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    // Fix the base URL to match the actual path structure
    this.baseUrl = process.env.VUE_APP_REPORTS_BASE_URL || '/TestResultsJsons/';
    
    // Initialize validation, status calculation, and error handling utilities
    this.validator = new CucumberJsonValidator({
      generatePlaceholders: true,
      logLevel: 'warn'
    });
    this.statusCalculator = new TestStatusCalculator({
      treatSetupFailuresAsFailed: true,
      treatTeardownFailuresAsFailed: true,
      logLevel: 'warn'
    });
    this.errorHandler = new ErrorHandler({
      logLevel: 'warn',
      enableConsoleLogging: true,
      enableLocalStorage: true
    });
    this.integrityValidator = new DataIntegrityValidator({
      tolerancePercentage: 5,
      logLevel: 'warn'
    });
  }

  /**
   * Load enhanced index with statistics (with fallback support)
   */
  async loadIndex() {
    const cacheKey = 'index';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Load both localStorage and server reports, then merge them
    let localReports = [];
    let serverReports = [];
    
    // First, load localStorage reports
    try {
      const localIndex = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      localReports = localIndex.map(report => ({
        ...report,
        features: report.features || 0,
        scenarios: report.scenarios || 0,
        steps: report.steps || 0,
        passed: report.passed || 0,
        failed: report.failed || 0,
        skipped: report.skipped || 0,
        tags: report.tags || [],
        size: report.size || 0,
        source: 'localStorage'
      }));
      console.log(`Loaded ${localReports.length} reports from localStorage`);
    } catch (localError) {
      console.warn('Failed to load from localStorage:', localError);
    }

    // Second, try to load server reports
    const possiblePaths = [
      `${process.env.BASE_URL || '/'}TestResultsJsons/index.json`,
      '/TestResultsJsons/index.json',
      './TestResultsJsons/index.json',
      'TestResultsJsons/index.json'
    ];
    
    for (const indexPath of possiblePaths) {
      try {
        console.log(`Trying to load server index from: ${indexPath}`);
        const response = await fetch(`${indexPath}?t=${Date.now()}`, { cache: 'reload' });
        
        if (!response.ok) {
          throw new Error(`Failed to load index: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle both enhanced and legacy formats
        if (Array.isArray(data)) {
          // Legacy format: array of reports
          serverReports = data.map(report => ({
            ...report,
            features: report.features || 0,
            scenarios: report.scenarios || 0,
            steps: report.steps || 0,
            passed: report.passed || 0,
            failed: report.failed || 0,
            skipped: report.skipped || 0,
            tags: report.tags || [],
            size: report.size || 0,
            source: 'server'
          }));
        } else if (data && data.reports) {
          // Enhanced format: object with reports and statistics
          serverReports = data.reports.map(report => ({
            ...report,
            source: 'server'
          }));
        }
        
        console.log(`Successfully loaded ${serverReports.length} reports from server: ${indexPath}`);
        break; // Successfully loaded, exit loop
        
      } catch (error) {
        console.warn(`Failed to load from ${indexPath}:`, error.message);
        // Continue to next path
      }
    }
    
    // Merge localStorage and server reports
    const mergedReports = this.mergeReports(localReports, serverReports);
    
    const mergedData = {
      reports: mergedReports,
      statistics: this.calculateStatistics(mergedReports),
      version: '1.0.0-merged',
      sources: {
        localStorage: localReports.length,
        server: serverReports.length,
        total: mergedReports.length
      }
    };
    
    // Cache the merged result
    this.cache.set(cacheKey, {
      data: mergedData,
      timestamp: Date.now()
    });
    
    console.log(`✅ Successfully merged reports: ${localReports.length} local + ${serverReports.length} server = ${mergedReports.length} total`);
    return mergedData;
  }

  /**
   * Load specific report with caching and validation
   */
  async loadReport(reportId) {
    const cacheKey = `report-${reportId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${reportId}.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Failed to load report ${reportId}: ${response.status}`);
      }
      
      let rawData;
      try {
        rawData = await response.json();
      } catch (jsonError) {
        const errorResult = this.errorHandler.handleJsonParsingError(`${reportId}.json`, jsonError);
        throw new Error(errorResult.userMessage);
      }
      
      // Validate and sanitize the report data
      let validationResult;
      try {
        validationResult = this.validator.validateReport(rawData, `${reportId}.json`);
      } catch (validationError) {
        this.errorHandler.logError(`Validation failed for ${reportId}`, { reportId }, validationError);
        validationResult = {
          isValid: false,
          errors: [{ message: validationError.message }],
          warnings: [],
          sanitizedData: rawData
        };
      }
      
      // Handle validation results
      if (validationResult.errors && validationResult.errors.length > 0) {
        this.errorHandler.handleValidationError(`${reportId}.json`, validationResult);
      }
      
      let processedData;
      if (validationResult.isValid || validationResult.sanitizedData) {
        // Use sanitized data if available, otherwise use raw data
        processedData = validationResult.sanitizedData || rawData;
        
        // Add validation metadata
        processedData._validation = {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          processedEntryCount: validationResult.processedEntryCount,
          originalEntryCount: validationResult.originalEntryCount
        };
        
        // Enhance with accurate status calculations
        try {
          processedData = this.enhanceReportWithAccurateStatus(processedData);
          
          // Perform data integrity validation
          const integrityReport = this.integrityValidator.generateIntegrityReport(
            this.extractAccurateTestCounts(processedData),
            rawData
          );
          
          processedData._integrity = integrityReport;
          
          if (integrityReport.overallStatus === 'critical') {
            this.errorHandler.logError(`Critical data integrity issues in ${reportId}`, { 
              reportId, 
              criticalIssues: integrityReport.summary.criticalIssues 
            });
          }
          
        } catch (statusError) {
          this.errorHandler.logError(`Status calculation failed for ${reportId}`, { reportId }, statusError);
          // Continue with unenhanced data
        }
        
      } else {
        // Validation failed, but try to provide fallback
        this.errorHandler.logWarning(`Report ${reportId} failed validation, using raw data with warnings`, { reportId });
        processedData = rawData;
        processedData._validation = {
          isValid: false,
          errors: validationResult.errors,
          warnings: ['Report failed validation - results may be inaccurate'],
          processedEntryCount: 0,
          originalEntryCount: validationResult.originalEntryCount
        };
      }
      
      // Cache the processed result
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      return processedData;
    } catch (error) {
      this.errorHandler.logError(`Failed to load report ${reportId}`, { reportId }, error);
      throw error;
    }
  }

  /**
   * Load statistics
   */
  async loadStatistics() {
    try {
      const response = await fetch(`${this.baseUrl}stats.json?t=${Date.now()}`);
      if (!response.ok) {
        // Stats file might not exist, return null
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Statistics not available:', error);
      return null;
    }
  }

  /**
   * Search reports by various criteria
   */
  searchReports(reports, query) {
    if (!query || !reports) return reports;
    
    const searchTerm = query.toLowerCase();
    
    return reports.filter(report => {
      return (
        report.name.toLowerCase().includes(searchTerm) ||
        report.id.toLowerCase().includes(searchTerm) ||
        (report.tags && report.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (report.environment && report.environment.toLowerCase().includes(searchTerm)) ||
        (report.tool && report.tool.toLowerCase().includes(searchTerm))
      );
    });
  }

  /**
   * Filter reports by criteria
   */
  filterReports(reports, filters) {
    if (!reports) return [];
    
    return reports.filter(report => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        const hasStatus = filters.status.some(status => {
          switch (status) {
            case 'passed': return report.failed === 0 && report.passed > 0;
            case 'failed': return report.failed > 0;
            case 'mixed': return report.passed > 0 && report.failed > 0;
            default: return false;
          }
        });
        if (!hasStatus) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const reportDate = new Date(report.date);
        if (filters.dateFrom && reportDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && reportDate > new Date(filters.dateTo)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => 
          report.tags && report.tags.includes(tag)
        );
        if (!hasTag) return false;
      }

      // Environment filter
      if (filters.environment && filters.environment.length > 0) {
        if (!filters.environment.includes(report.environment)) return false;
      }



      return true;
    });
  }

  /**
   * Sort reports by various criteria
   */
  sortReports(reports, sortBy, sortOrder = 'desc') {
    if (!reports) return [];
    
    const sorted = [...reports].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;

        case 'scenarios':
          aVal = a.scenarios || 0;
          bVal = b.scenarios || 0;
          break;
        case 'passRate':
          aVal = a.steps > 0 ? (a.passed / a.steps) : 0;
          bVal = b.steps > 0 ? (b.passed / b.steps) : 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }

  /**
   * Get report trends over time
   */
  getReportTrends(reports, days = 30) {
    if (!reports) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentReports = reports.filter(report => 
      new Date(report.date) >= cutoffDate
    );
    
    // Group by date
    const trendData = {};
    recentReports.forEach(report => {
      const dateKey = new Date(report.date).toISOString().split('T')[0];
      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          date: dateKey,
          reports: 0,
          totalScenarios: 0,
          totalPassed: 0,
          totalFailed: 0,
  
        };
      }
      
      const day = trendData[dateKey];
      day.reports++;
      day.totalScenarios += report.scenarios || 0;
      day.totalPassed += report.passed || 0;
      day.totalFailed += report.failed || 0;

    });
    
    return Object.values(trendData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  /**
   * Merge localStorage and server reports, avoiding duplicates
   */
  mergeReports(localReports, serverReports) {
    const merged = [...localReports];
    const localIds = new Set(localReports.map(r => r.id));
    
    // Add server reports that don't exist in localStorage
    serverReports.forEach(serverReport => {
      if (!localIds.has(serverReport.id)) {
        merged.push(serverReport);
      }
    });
    
    // Sort by date (newest first)
    return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Calculate statistics from merged reports with enhanced accuracy
   */
  calculateStatistics(reports) {
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
        totalScenarios: 0,
        totalSteps: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        totalErrors: 0,
        passRate: '0.00',
        failRate: '0.00',
        skipRate: '0.00',
        errorRate: '0.00',
        validationIssues: 0
      };
    }

    const totals = reports.reduce((acc, report) => ({
      scenarios: acc.scenarios + (report.scenarios || 0),
      steps: acc.steps + (report.steps || 0),
      passed: acc.passed + (report.passed || 0),
      failed: acc.failed + (report.failed || 0),
      skipped: acc.skipped + (report.skipped || 0),
      errors: acc.errors + (report.errors || 0),
      validationIssues: acc.validationIssues + (report.validationIssues || 0)
    }), { scenarios: 0, steps: 0, passed: 0, failed: 0, skipped: 0, errors: 0, validationIssues: 0 });

    // Calculate rates based on scenarios (more accurate than steps for overall status)
    const totalScenarios = totals.scenarios || 1; // Avoid division by zero
    const passRate = ((totals.passed / totalScenarios) * 100).toFixed(2);
    const failRate = ((totals.failed / totalScenarios) * 100).toFixed(2);
    const skipRate = ((totals.skipped / totalScenarios) * 100).toFixed(2);
    const errorRate = ((totals.errors / totalScenarios) * 100).toFixed(2);

    return {
      totalReports: reports.length,
      totalScenarios: totals.scenarios,
      totalSteps: totals.steps,
      totalPassed: totals.passed,
      totalFailed: totals.failed,
      totalSkipped: totals.skipped,
      totalErrors: totals.errors,
      passRate,
      failRate,
      skipRate,
      errorRate,
      validationIssues: totals.validationIssues
    };
  }

  /**
   * Enhance report with accurate status calculations
   */
  enhanceReportWithAccurateStatus(reportData) {
    if (!Array.isArray(reportData)) {
      return reportData;
    }

    const enhancedFeatures = reportData.map(feature => {
      const enhancedFeature = { ...feature };
      
      // Calculate accurate feature status
      const featureStatus = this.statusCalculator.calculateFeatureStatus(feature);
      enhancedFeature._calculatedStatus = featureStatus;
      
      // Enhance scenarios with accurate status
      if (feature.elements && Array.isArray(feature.elements)) {
        enhancedFeature.elements = feature.elements.map(scenario => {
          const enhancedScenario = { ...scenario };
          const scenarioStatus = this.statusCalculator.calculateScenarioStatus(scenario);
          enhancedScenario._calculatedStatus = scenarioStatus;
          return enhancedScenario;
        });
      }
      
      return enhancedFeature;
    });

    return enhancedFeatures;
  }

  /**
   * Extract accurate test counts from enhanced report data
   */
  extractAccurateTestCounts(reportData) {
    const counts = {
      features: 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0
    };

    if (!Array.isArray(reportData)) {
      return counts;
    }

    reportData.forEach(feature => {
      counts.features++;
      
      if (feature.elements && Array.isArray(feature.elements)) {
        feature.elements.forEach(scenario => {
          if (scenario.type === 'background') return;
          
          counts.scenarios++;
          
          // Use calculated status if available, otherwise fallback to original logic
          let scenarioStatus = 'unknown';
          if (scenario._calculatedStatus) {
            scenarioStatus = scenario._calculatedStatus.status;
          } else {
            // Fallback to original status calculation
            const statusResult = this.statusCalculator.calculateScenarioStatus(scenario);
            scenarioStatus = statusResult.status;
          }
          
          // Count scenario status
          switch (scenarioStatus) {
            case 'passed': counts.passed++; break;
            case 'failed': counts.failed++; break;
            case 'skipped': counts.skipped++; break;
            default: counts.errors++; break;
          }
          
          // Count steps
          if (scenario.steps && Array.isArray(scenario.steps)) {
            counts.steps += scenario.steps.length;
          }
        });
      }
    });

    return counts;
  }

  /**
   * Validate report consistency
   */
  validateReportConsistency(reportData, expectedCounts = null) {
    const validation = {
      isConsistent: true,
      issues: [],
      actualCounts: null,
      expectedCounts: expectedCounts
    };

    try {
      validation.actualCounts = this.extractAccurateTestCounts(reportData);
      
      if (expectedCounts) {
        // Check for discrepancies
        Object.keys(expectedCounts).forEach(key => {
          if (validation.actualCounts[key] !== expectedCounts[key]) {
            validation.isConsistent = false;
            validation.issues.push({
              type: 'count_mismatch',
              field: key,
              expected: expectedCounts[key],
              actual: validation.actualCounts[key]
            });
          }
        });
      }
      
      // Check internal consistency
      const totalStatusCounts = validation.actualCounts.passed + 
                               validation.actualCounts.failed + 
                               validation.actualCounts.skipped + 
                               validation.actualCounts.errors;
      
      if (totalStatusCounts !== validation.actualCounts.scenarios) {
        validation.isConsistent = false;
        validation.issues.push({
          type: 'internal_inconsistency',
          message: `Status counts (${totalStatusCounts}) don't match scenario count (${validation.actualCounts.scenarios})`
        });
      }
      
    } catch (error) {
      validation.isConsistent = false;
      validation.issues.push({
        type: 'validation_error',
        message: error.message
      });
    }

    return validation;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary() {
    return this.errorHandler.getErrorSummary();
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    this.errorHandler.clearLogs();
  }

  /**
   * Export error logs for debugging
   */
  exportErrorLogs() {
    return this.errorHandler.exportLogs();
  }

  /**
   * Get data integrity report for a processed report
   */
  getIntegrityReport(reportData, originalJson = null) {
    const counts = this.extractAccurateTestCounts(reportData);
    return this.integrityValidator.generateIntegrityReport(counts, originalJson);
  }

  /**
   * Validate report consistency with expected counts
   */
  validateReportConsistency(reportData, expectedCounts = null) {
    const counts = this.extractAccurateTestCounts(reportData);
    return this.integrityValidator.validateTestCounts(counts, reportData);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

export default new ReportService();