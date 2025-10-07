/**
 * Diagnostic Tools for Cucumber Report Analysis
 * Provides debugging capabilities and comparison tools
 */

import CucumberJsonValidator from './CucumberJsonValidator';
import TestStatusCalculator from './TestStatusCalculator';
import DataIntegrityValidator from './DataIntegrityValidator';

class DiagnosticTools {
  constructor() {
    this.validator = new CucumberJsonValidator({ logLevel: 'info' });
    this.statusCalculator = new TestStatusCalculator({ logLevel: 'info' });
    this.integrityValidator = new DataIntegrityValidator({ logLevel: 'info' });
  }

  /**
   * Generate comprehensive diagnostic report
   */
  generateDiagnosticReport(reportData, originalJson = null, expectedCounts = null) {
    const report = {
      timestamp: new Date().toISOString(),
      reportId: this.generateReportId(),
      summary: {
        dataSize: this.calculateDataSize(reportData),
        processingTime: null,
        overallHealth: 'unknown'
      },
      validation: null,
      statusAnalysis: null,
      integrityCheck: null,
      comparison: null,
      recommendations: [],
      debugInfo: {}
    };

    const startTime = Date.now();

    try {
      // 1. Validation Analysis
      if (originalJson) {
        report.validation = this.analyzeValidation(originalJson);
      }

      // 2. Status Analysis
      report.statusAnalysis = this.analyzeStatusCalculation(reportData);

      // 3. Integrity Check
      if (Array.isArray(reportData)) {
        const counts = this.extractCounts(reportData);
        report.integrityCheck = this.integrityValidator.generateIntegrityReport(
          counts, 
          originalJson, 
          expectedCounts
        );
      }

      // 4. Comparison Analysis
      if (expectedCounts) {
        report.comparison = this.compareWithExpected(reportData, expectedCounts);
      }

      // 5. Generate Recommendations
      report.recommendations = this.generateDiagnosticRecommendations(report);

      // 6. Debug Information
      report.debugInfo = this.collectDebugInfo(reportData, originalJson);

      // Calculate processing time
      report.summary.processingTime = Date.now() - startTime;

      // Determine overall health
      report.summary.overallHealth = this.determineOverallHealth(report);

    } catch (error) {
      report.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      report.summary.overallHealth = 'error';
    }

    return report;
  }

  /**
   * Compare parsed results with IDE output
   */
  compareWithIdeOutput(reportData, ideOutput) {
    const comparison = {
      timestamp: new Date().toISOString(),
      source: 'IDE Comparison',
      matches: {},
      discrepancies: [],
      confidence: 'unknown'
    };

    try {
      const parsedCounts = this.extractCounts(reportData);
      
      // Compare each metric
      const metrics = ['scenarios', 'passed', 'failed', 'skipped'];
      metrics.forEach(metric => {
        const ideValue = ideOutput[metric] || 0;
        const parsedValue = parsedCounts[metric] || 0;
        
        if (ideValue === parsedValue) {
          comparison.matches[metric] = {
            value: ideValue,
            status: 'match'
          };
        } else {
          comparison.discrepancies.push({
            metric,
            ideValue,
            parsedValue,
            difference: parsedValue - ideValue,
            severity: this.calculateDiscrepancySeverity(metric, ideValue, parsedValue)
          });
        }
      });

      // Calculate confidence level
      const totalMetrics = metrics.length;
      const matchingMetrics = Object.keys(comparison.matches).length;
      const confidencePercentage = (matchingMetrics / totalMetrics) * 100;
      
      if (confidencePercentage === 100) {
        comparison.confidence = 'high';
      } else if (confidencePercentage >= 75) {
        comparison.confidence = 'medium';
      } else {
        comparison.confidence = 'low';
      }

      // Add analysis
      comparison.analysis = this.analyzeIdeDiscrepancies(comparison.discrepancies);

    } catch (error) {
      comparison.error = error.message;
      comparison.confidence = 'error';
    }

    return comparison;
  }

  /**
   * Generate validation report with detailed analysis
   */
  generateValidationReport(jsonData, filename = 'report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      filename,
      summary: {
        isValid: false,
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0
      },
      details: {
        structureAnalysis: null,
        contentAnalysis: null,
        recommendations: []
      },
      rawValidation: null
    };

    try {
      // Perform validation
      report.rawValidation = this.validator.validateReport(jsonData, filename);
      
      // Analyze structure
      report.details.structureAnalysis = this.analyzeJsonStructure(jsonData);
      
      // Analyze content
      report.details.contentAnalysis = this.analyzeJsonContent(jsonData);
      
      // Calculate summary
      report.summary.isValid = report.rawValidation.isValid;
      report.summary.criticalIssues = report.rawValidation.errors?.length || 0;
      report.summary.warnings = report.rawValidation.warnings?.length || 0;
      report.summary.totalIssues = report.summary.criticalIssues + report.summary.warnings;
      
      // Generate recommendations
      report.details.recommendations = this.generateValidationRecommendations(report);

    } catch (error) {
      report.error = error.message;
    }

    return report;
  }

  /**
   * Create comparison tool between different parsing methods
   */
  createComparisonTool(reportData, originalJson, expectedCounts = null) {
    const comparison = {
      timestamp: new Date().toISOString(),
      methods: {
        directParsing: null,
        enhancedParsing: null,
        expectedCounts: expectedCounts
      },
      analysis: {
        consistency: null,
        discrepancies: [],
        recommendations: []
      }
    };

    try {
      // Method 1: Direct parsing from original JSON
      if (originalJson) {
        comparison.methods.directParsing = this.parseDirectly(originalJson);
      }

      // Method 2: Enhanced parsing from processed data
      if (reportData) {
        comparison.methods.enhancedParsing = this.extractCounts(reportData);
      }

      // Analyze consistency
      comparison.analysis = this.analyzeMethodConsistency(comparison.methods);

    } catch (error) {
      comparison.error = error.message;
    }

    return comparison;
  }

  /**
   * Enable diagnostic mode with detailed logging
   */
  enableDiagnosticMode(reportData, options = {}) {
    const diagnosticSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      options: {
        verboseLogging: options.verboseLogging || false,
        trackPerformance: options.trackPerformance || false,
        validateEachStep: options.validateEachStep || false,
        ...options
      },
      logs: [],
      metrics: {},
      results: null
    };

    try {
      this.log(diagnosticSession, 'info', 'Diagnostic session started', { sessionId: diagnosticSession.sessionId });

      // Step-by-step processing with logging
      if (diagnosticSession.options.validateEachStep) {
        diagnosticSession.results = this.processWithStepValidation(reportData, diagnosticSession);
      } else {
        diagnosticSession.results = this.processNormally(reportData, diagnosticSession);
      }

      // Collect performance metrics
      if (diagnosticSession.options.trackPerformance) {
        diagnosticSession.metrics = this.collectPerformanceMetrics(reportData);
      }

      diagnosticSession.endTime = new Date().toISOString();
      diagnosticSession.duration = new Date(diagnosticSession.endTime) - new Date(diagnosticSession.startTime);

      this.log(diagnosticSession, 'info', 'Diagnostic session completed', { 
        duration: diagnosticSession.duration,
        totalLogs: diagnosticSession.logs.length
      });

    } catch (error) {
      this.log(diagnosticSession, 'error', 'Diagnostic session failed', { error: error.message });
      diagnosticSession.error = error.message;
    }

    return diagnosticSession;
  }

  /**
   * Analyze validation results
   */
  analyzeValidation(jsonData) {
    const analysis = {
      structureValid: true,
      contentIssues: [],
      suggestions: []
    };

    try {
      // Check basic structure
      if (!Array.isArray(jsonData)) {
        analysis.structureValid = false;
        analysis.suggestions.push('JSON should be an array of features');
        return analysis;
      }

      // Analyze each feature
      jsonData.forEach((feature, featureIndex) => {
        if (!feature.name || feature.name.trim() === '') {
          analysis.contentIssues.push({
            type: 'missing_name',
            location: `Feature ${featureIndex}`,
            severity: 'warning'
          });
        }

        if (feature.elements && Array.isArray(feature.elements)) {
          feature.elements.forEach((scenario, scenarioIndex) => {
            if (!scenario.name || scenario.name.trim() === '') {
              analysis.contentIssues.push({
                type: 'missing_name',
                location: `Feature ${featureIndex}, Scenario ${scenarioIndex}`,
                severity: 'warning'
              });
            }

            if (scenario.steps && Array.isArray(scenario.steps)) {
              scenario.steps.forEach((step, stepIndex) => {
                if (!step.result && !step.status) {
                  analysis.contentIssues.push({
                    type: 'missing_result',
                    location: `Feature ${featureIndex}, Scenario ${scenarioIndex}, Step ${stepIndex}`,
                    severity: 'error'
                  });
                }
              });
            }
          });
        }
      });

      // Generate suggestions based on issues
      if (analysis.contentIssues.length > 0) {
        analysis.suggestions.push('Consider improving test data quality to reduce validation warnings');
      }

    } catch (error) {
      analysis.error = error.message;
    }

    return analysis;
  }

  /**
   * Analyze status calculation accuracy
   */
  analyzeStatusCalculation(reportData) {
    const analysis = {
      totalScenarios: 0,
      statusBreakdown: {
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 0,
        unknown: 0
      },
      setupFailures: 0,
      teardownFailures: 0,
      issues: []
    };

    try {
      if (!Array.isArray(reportData)) {
        analysis.issues.push('Report data is not in expected array format');
        return analysis;
      }

      reportData.forEach((feature, featureIndex) => {
        if (feature.elements && Array.isArray(feature.elements)) {
          feature.elements.forEach((scenario, scenarioIndex) => {
            if (scenario.type === 'background') return;

            analysis.totalScenarios++;

            // Analyze status calculation
            const statusResult = this.statusCalculator.calculateScenarioStatus(scenario);
            analysis.statusBreakdown[statusResult.status] = (analysis.statusBreakdown[statusResult.status] || 0) + 1;

            // Check for setup failures
            if (scenario.before && Array.isArray(scenario.before)) {
              const hasSetupFailure = scenario.before.some(hook => 
                hook.result && hook.result.status === 'failed'
              );
              if (hasSetupFailure) {
                analysis.setupFailures++;
              }
            }

            // Check for teardown failures
            if (scenario.after && Array.isArray(scenario.after)) {
              const hasTeardownFailure = scenario.after.some(hook => 
                hook.result && hook.result.status === 'failed'
              );
              if (hasTeardownFailure) {
                analysis.teardownFailures++;
              }
            }

            // Check for inconsistencies
            if (statusResult.status === 'unknown') {
              analysis.issues.push({
                type: 'unknown_status',
                location: `Feature ${featureIndex}, Scenario ${scenarioIndex}`,
                reason: statusResult.reason
              });
            }
          });
        }
      });

    } catch (error) {
      analysis.error = error.message;
    }

    return analysis;
  }

  /**
   * Helper methods
   */
  
  extractCounts(reportData) {
    const counts = {
      features: 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0
    };

    if (!Array.isArray(reportData)) return counts;

    reportData.forEach(feature => {
      counts.features++;
      
      if (feature.elements && Array.isArray(feature.elements)) {
        feature.elements.forEach(scenario => {
          if (scenario.type === 'background') return;
          
          counts.scenarios++;
          
          // Use enhanced status if available
          let status;
          if (scenario._calculatedStatus) {
            status = scenario._calculatedStatus.status;
          } else {
            const statusResult = this.statusCalculator.calculateScenarioStatus(scenario);
            status = statusResult.status;
          }
          
          switch (status) {
            case 'passed': counts.passed++; break;
            case 'failed': counts.failed++; break;
            case 'skipped': counts.skipped++; break;
            default: counts.errors++; break;
          }
          
          if (scenario.steps && Array.isArray(scenario.steps)) {
            counts.steps += scenario.steps.length;
          }
        });
      }
    });

    return counts;
  }

  parseDirectly(jsonData) {
    // Simple direct parsing without enhancements
    const counts = {
      features: 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    if (!Array.isArray(jsonData)) return counts;

    jsonData.forEach(feature => {
      counts.features++;
      
      if (feature.elements && Array.isArray(feature.elements)) {
        feature.elements.forEach(scenario => {
          if (scenario.type === 'background') return;
          
          counts.scenarios++;
          
          // Simple status determination
          if (scenario.steps && Array.isArray(scenario.steps)) {
            counts.steps += scenario.steps.length;
            
            const hasFailedSteps = scenario.steps.some(step => {
              const status = step.result ? step.result.status : step.status;
              return status === 'failed';
            });
            
            const hasPassedSteps = scenario.steps.some(step => {
              const status = step.result ? step.result.status : step.status;
              return status === 'passed';
            });
            
            if (hasFailedSteps) {
              counts.failed++;
            } else if (hasPassedSteps) {
              counts.passed++;
            } else {
              counts.skipped++;
            }
          }
        });
      }
    });

    return counts;
  }

  calculateDataSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  generateReportId() {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(session, level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
    
    session.logs.push(logEntry);
    
    if (session.options.verboseLogging) {
      console[level] ? console[level](`[Diagnostic] ${message}`, context) : console.log(`[Diagnostic] ${message}`, context);
    }
  }

  calculateDiscrepancySeverity(metric, expected, actual) {
    const difference = Math.abs(actual - expected);
    const percentage = expected > 0 ? (difference / expected) * 100 : 100;
    
    if (percentage === 0) return 'none';
    if (percentage <= 5) return 'low';
    if (percentage <= 15) return 'medium';
    return 'high';
  }

  analyzeIdeDiscrepancies(discrepancies) {
    const analysis = {
      possibleCauses: [],
      recommendations: []
    };

    discrepancies.forEach(discrepancy => {
      if (discrepancy.metric === 'failed' && discrepancy.parsedValue > discrepancy.ideValue) {
        analysis.possibleCauses.push('Setup or teardown failures may be counted as test failures in parsed data');
        analysis.recommendations.push('Check for before/after hook failures that should be treated as test failures');
      }
      
      if (discrepancy.metric === 'skipped' && discrepancy.parsedValue < discrepancy.ideValue) {
        analysis.possibleCauses.push('Tests marked as skipped in IDE may be counted differently in JSON');
        analysis.recommendations.push('Review how skipped tests are represented in the JSON structure');
      }
    });

    return analysis;
  }

  analyzeJsonStructure(jsonData) {
    const analysis = {
      isArray: Array.isArray(jsonData),
      featureCount: 0,
      hasElements: false,
      hasSteps: false,
      hasHooks: false,
      structure: 'unknown'
    };

    if (analysis.isArray && jsonData.length > 0) {
      analysis.featureCount = jsonData.length;
      
      const firstFeature = jsonData[0];
      if (firstFeature.elements && Array.isArray(firstFeature.elements)) {
        analysis.hasElements = true;
        
        const firstScenario = firstFeature.elements.find(el => el.type !== 'background');
        if (firstScenario) {
          if (firstScenario.steps && Array.isArray(firstScenario.steps)) {
            analysis.hasSteps = true;
          }
          
          if (firstScenario.before || firstScenario.after) {
            analysis.hasHooks = true;
          }
        }
      }
      
      analysis.structure = 'cucumber_json';
    }

    return analysis;
  }

  analyzeJsonContent(jsonData) {
    const analysis = {
      nullNames: 0,
      emptyNames: 0,
      missingResults: 0,
      totalElements: 0
    };

    if (Array.isArray(jsonData)) {
      jsonData.forEach(feature => {
        if (!feature.name) analysis.nullNames++;
        if (feature.name === '') analysis.emptyNames++;
        
        if (feature.elements && Array.isArray(feature.elements)) {
          feature.elements.forEach(scenario => {
            analysis.totalElements++;
            
            if (!scenario.name) analysis.nullNames++;
            if (scenario.name === '') analysis.emptyNames++;
            
            if (scenario.steps && Array.isArray(scenario.steps)) {
              scenario.steps.forEach(step => {
                if (!step.result && !step.status) {
                  analysis.missingResults++;
                }
              });
            }
          });
        }
      });
    }

    return analysis;
  }

  generateValidationRecommendations(report) {
    const recommendations = [];

    if (report.summary.criticalIssues > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Fix critical validation errors before processing reports',
        action: 'Review and correct JSON structure issues'
      });
    }

    if (report.details.contentAnalysis?.nullNames > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'Replace null test names with meaningful placeholders',
        action: 'Enable placeholder generation in validator settings'
      });
    }

    if (report.details.contentAnalysis?.missingResults > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'Add missing step results for accurate status calculation',
        action: 'Ensure all test steps have result objects with status'
      });
    }

    return recommendations;
  }

  generateDiagnosticRecommendations(report) {
    const recommendations = [];

    if (report.integrityCheck?.overallStatus === 'critical') {
      recommendations.push({
        priority: 'critical',
        message: 'Critical data integrity issues detected',
        action: 'Manual verification required before using results'
      });
    }

    if (report.statusAnalysis?.setupFailures > 0) {
      recommendations.push({
        priority: 'high',
        message: `${report.statusAnalysis.setupFailures} setup failures detected`,
        action: 'Verify that setup failures are being counted as test failures'
      });
    }

    if (report.comparison?.confidence === 'low') {
      recommendations.push({
        priority: 'medium',
        message: 'Low confidence in result accuracy',
        action: 'Review parsing logic and validation rules'
      });
    }

    return recommendations;
  }

  determineOverallHealth(report) {
    if (report.error) return 'error';
    if (report.integrityCheck?.overallStatus === 'critical') return 'critical';
    if (report.validation?.summary?.criticalIssues > 0) return 'poor';
    if (report.statusAnalysis?.issues?.length > 0) return 'fair';
    return 'good';
  }

  analyzeMethodConsistency(methods) {
    const analysis = {
      consistency: 'unknown',
      discrepancies: [],
      recommendations: []
    };

    if (methods.directParsing && methods.enhancedParsing) {
      const direct = methods.directParsing;
      const enhanced = methods.enhancedParsing;
      
      const metrics = ['scenarios', 'passed', 'failed', 'skipped'];
      let matchingMetrics = 0;
      
      metrics.forEach(metric => {
        if (direct[metric] === enhanced[metric]) {
          matchingMetrics++;
        } else {
          analysis.discrepancies.push({
            metric,
            directValue: direct[metric],
            enhancedValue: enhanced[metric],
            difference: enhanced[metric] - direct[metric]
          });
        }
      });
      
      const consistencyPercentage = (matchingMetrics / metrics.length) * 100;
      if (consistencyPercentage === 100) {
        analysis.consistency = 'high';
      } else if (consistencyPercentage >= 75) {
        analysis.consistency = 'medium';
      } else {
        analysis.consistency = 'low';
      }
    }

    return analysis;
  }

  processWithStepValidation(reportData, session) {
    // Process with validation at each step
    this.log(session, 'info', 'Starting step-by-step validation');
    
    const results = {
      validationResults: [],
      statusResults: [],
      finalCounts: null
    };

    try {
      // Step 1: Validate structure
      this.log(session, 'info', 'Step 1: Validating structure');
      // Implementation would go here
      
      // Step 2: Calculate statuses
      this.log(session, 'info', 'Step 2: Calculating statuses');
      // Implementation would go here
      
      // Step 3: Extract final counts
      this.log(session, 'info', 'Step 3: Extracting final counts');
      results.finalCounts = this.extractCounts(reportData);
      
    } catch (error) {
      this.log(session, 'error', 'Step validation failed', { error: error.message });
      throw error;
    }

    return results;
  }

  processNormally(reportData, session) {
    this.log(session, 'info', 'Processing normally');
    return {
      finalCounts: this.extractCounts(reportData)
    };
  }

  collectPerformanceMetrics(reportData) {
    return {
      dataSize: this.calculateDataSize(reportData),
      featureCount: Array.isArray(reportData) ? reportData.length : 0,
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null
    };
  }

  collectDebugInfo(reportData, originalJson) {
    return {
      reportDataType: Array.isArray(reportData) ? 'array' : typeof reportData,
      reportDataLength: Array.isArray(reportData) ? reportData.length : 0,
      originalJsonType: Array.isArray(originalJson) ? 'array' : typeof originalJson,
      originalJsonLength: Array.isArray(originalJson) ? originalJson.length : 0,
      hasValidationInfo: reportData && reportData._validation ? true : false,
      hasIntegrityInfo: reportData && reportData._integrity ? true : false,
      timestamp: new Date().toISOString()
    };
  }
}

export default DiagnosticTools;