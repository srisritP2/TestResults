/**
 * Data Integrity Validator
 * Ensures consistency between parsed data and expected results
 * Performs cross-validation and detects inconsistencies
 */

import ErrorHandler from './ErrorHandler';

class DataIntegrityValidator {
  constructor(options = {}) {
    this.options = {
      tolerancePercentage: options.tolerancePercentage || 5, // 5% tolerance for minor discrepancies
      strictMode: options.strictMode || false,
      logLevel: options.logLevel || 'warn'
    };
    
    this.errorHandler = new ErrorHandler({
      logLevel: this.options.logLevel,
      enableConsoleLogging: true
    });
    
    this.validationHistory = [];
  }

  /**
   * Validate test counts for consistency
   */
  validateTestCounts(summary, reportData = null) {
    const validation = {
      isValid: true,
      issues: [],
      summary: {
        totalTests: summary.scenarios || 0,
        passed: summary.passed || 0,
        failed: summary.failed || 0,
        skipped: summary.skipped || 0,
        errors: summary.errors || 0
      },
      calculatedSummary: null,
      discrepancies: []
    };

    try {
      // Calculate expected totals
      const expectedTotal = validation.summary.passed + 
                           validation.summary.failed + 
                           validation.summary.skipped + 
                           validation.summary.errors;

      // Check internal consistency
      if (expectedTotal !== validation.summary.totalTests) {
        const discrepancy = {
          type: 'count_mismatch',
          field: 'total_scenarios',
          expected: validation.summary.totalTests,
          calculated: expectedTotal,
          difference: expectedTotal - validation.summary.totalTests
        };
        
        validation.discrepancies.push(discrepancy);
        validation.isValid = false;
        
        this.errorHandler.handleDataInconsistency(
          'Total scenario count mismatch',
          validation.summary.totalTests,
          expectedTotal,
          { reportData: !!reportData }
        );
      }

      // If we have raw report data, cross-validate
      if (reportData && Array.isArray(reportData)) {
        validation.calculatedSummary = this.calculateSummaryFromRawData(reportData);
        
        // Compare calculated vs provided summary
        const fieldsToCheck = ['scenarios', 'passed', 'failed', 'skipped'];
        fieldsToCheck.forEach(field => {
          const provided = validation.summary[field === 'scenarios' ? 'totalTests' : field] || 0;
          const calculated = validation.calculatedSummary[field] || 0;
          
          if (provided !== calculated) {
            const tolerance = Math.max(1, Math.floor(provided * this.options.tolerancePercentage / 100));
            const difference = Math.abs(provided - calculated);
            
            if (difference > tolerance) {
              const discrepancy = {
                type: 'cross_validation_mismatch',
                field,
                provided,
                calculated,
                difference: calculated - provided,
                tolerance
              };
              
              validation.discrepancies.push(discrepancy);
              validation.isValid = false;
              
              this.errorHandler.handleDataInconsistency(
                `${field} count cross-validation mismatch`,
                provided,
                calculated,
                { field, tolerance, difference }
              );
            }
          }
        });
      }

      // Record validation result
      this.recordValidation(validation);

    } catch (error) {
      validation.isValid = false;
      validation.issues.push({
        type: 'validation_error',
        message: error.message,
        stack: error.stack
      });
      
      this.errorHandler.logError('Test count validation failed', { summary }, error);
    }

    return validation;
  }

  /**
   * Cross-validate results between different parsing methods
   */
  crossValidateResults(parsedData, originalJson, expectedCounts = null) {
    const validation = {
      isValid: true,
      issues: [],
      comparisons: [],
      recommendations: []
    };

    try {
      // Method 1: Direct JSON analysis
      const directCounts = this.calculateSummaryFromRawData(originalJson);
      
      // Method 2: Parsed data analysis
      const parsedCounts = this.extractCountsFromParsedData(parsedData);
      
      // Method 3: Expected counts (if provided)
      const expectedCountsNormalized = expectedCounts ? this.normalizeExpectedCounts(expectedCounts) : null;

      // Compare methods
      const comparison1 = this.compareCountSets(directCounts, parsedCounts, 'direct_vs_parsed');
      validation.comparisons.push(comparison1);
      
      if (expectedCountsNormalized) {
        const comparison2 = this.compareCountSets(directCounts, expectedCountsNormalized, 'direct_vs_expected');
        const comparison3 = this.compareCountSets(parsedCounts, expectedCountsNormalized, 'parsed_vs_expected');
        validation.comparisons.push(comparison2, comparison3);
      }

      // Determine overall validity
      validation.isValid = validation.comparisons.every(comp => comp.isConsistent);
      
      // Generate recommendations
      validation.recommendations = this.generateValidationRecommendations(validation.comparisons);
      
      // Log significant discrepancies
      validation.comparisons.forEach(comparison => {
        if (!comparison.isConsistent) {
          comparison.discrepancies.forEach(discrepancy => {
            this.errorHandler.logWarning(
              `Cross-validation discrepancy: ${comparison.comparisonType} - ${discrepancy.field}`,
              { comparison: comparison.comparisonType, discrepancy }
            );
          });
        }
      });

    } catch (error) {
      validation.isValid = false;
      validation.issues.push({
        type: 'cross_validation_error',
        message: error.message
      });
      
      this.errorHandler.logError('Cross-validation failed', { parsedData: !!parsedData, originalJson: !!originalJson }, error);
    }

    return validation;
  }

  /**
   * Detect inconsistencies in data
   */
  detectInconsistencies(data, context = {}) {
    const inconsistencies = [];

    try {
      if (!data || typeof data !== 'object') {
        inconsistencies.push({
          type: 'invalid_data_structure',
          message: 'Data is not a valid object',
          severity: 'error'
        });
        return inconsistencies;
      }

      // Check for null/undefined critical fields
      const criticalFields = ['features', 'scenarios', 'passed', 'failed'];
      criticalFields.forEach(field => {
        if (data[field] === null || data[field] === undefined) {
          inconsistencies.push({
            type: 'missing_critical_field',
            field,
            message: `Critical field '${field}' is missing`,
            severity: 'error'
          });
        }
      });

      // Check for negative values
      const numericFields = ['features', 'scenarios', 'steps', 'passed', 'failed', 'skipped', 'duration'];
      numericFields.forEach(field => {
        if (data[field] && data[field] < 0) {
          inconsistencies.push({
            type: 'negative_value',
            field,
            value: data[field],
            message: `Field '${field}' has negative value: ${data[field]}`,
            severity: 'error'
          });
        }
      });

      // Check for impossible ratios
      if (data.scenarios && data.features) {
        const scenarioToFeatureRatio = data.scenarios / data.features;
        if (scenarioToFeatureRatio > 1000) { // More than 1000 scenarios per feature seems unlikely
          inconsistencies.push({
            type: 'unlikely_ratio',
            message: `Very high scenario-to-feature ratio: ${scenarioToFeatureRatio.toFixed(2)}`,
            severity: 'warning'
          });
        }
      }

      // Check for duration inconsistencies
      if (data.duration && data.scenarios) {
        const avgDurationPerScenario = data.duration / data.scenarios;
        if (avgDurationPerScenario > 3600) { // More than 1 hour per scenario
          inconsistencies.push({
            type: 'unusual_duration',
            message: `Very high average duration per scenario: ${(avgDurationPerScenario / 60).toFixed(2)} minutes`,
            severity: 'warning'
          });
        }
      }

      // Log inconsistencies
      inconsistencies.forEach(inconsistency => {
        if (inconsistency.severity === 'error') {
          this.errorHandler.logError(`Data inconsistency: ${inconsistency.message}`, { context, inconsistency });
        } else {
          this.errorHandler.logWarning(`Data inconsistency: ${inconsistency.message}`, { context, inconsistency });
        }
      });

    } catch (error) {
      inconsistencies.push({
        type: 'detection_error',
        message: `Failed to detect inconsistencies: ${error.message}`,
        severity: 'error'
      });
      
      this.errorHandler.logError('Inconsistency detection failed', { context }, error);
    }

    return inconsistencies;
  }

  /**
   * Generate comprehensive integrity report
   */
  generateIntegrityReport(data, originalJson = null, expectedCounts = null) {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: 'unknown',
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0,
        recommendations: 0
      },
      validations: {
        countValidation: null,
        crossValidation: null,
        inconsistencyDetection: null
      },
      recommendations: [],
      details: {}
    };

    try {
      // Perform count validation
      report.validations.countValidation = this.validateTestCounts(data, originalJson);
      
      // Perform cross-validation if original JSON is available
      if (originalJson) {
        report.validations.crossValidation = this.crossValidateResults(data, originalJson, expectedCounts);
      }
      
      // Detect inconsistencies
      report.validations.inconsistencyDetection = this.detectInconsistencies(data);

      // Calculate summary
      const allIssues = [
        ...(report.validations.countValidation.issues || []),
        ...(report.validations.crossValidation?.issues || []),
        ...report.validations.inconsistencyDetection
      ];

      report.summary.totalIssues = allIssues.length;
      report.summary.criticalIssues = allIssues.filter(issue => issue.severity === 'error').length;
      report.summary.warnings = allIssues.filter(issue => issue.severity === 'warning').length;

      // Determine overall status
      if (report.summary.criticalIssues > 0) {
        report.overallStatus = 'critical';
      } else if (report.summary.warnings > 0) {
        report.overallStatus = 'warning';
      } else {
        report.overallStatus = 'healthy';
      }

      // Generate recommendations
      report.recommendations = this.generateOverallRecommendations(report);
      report.summary.recommendations = report.recommendations.length;

      // Add details
      report.details = {
        validationHistory: this.validationHistory.slice(-5), // Last 5 validations
        errorSummary: this.errorHandler.getErrorSummary()
      };

    } catch (error) {
      report.overallStatus = 'error';
      report.summary.criticalIssues = 1;
      report.validations.error = {
        message: error.message,
        stack: error.stack
      };
      
      this.errorHandler.logError('Integrity report generation failed', { data: !!data }, error);
    }

    return report;
  }

  /**
   * Calculate summary from raw JSON data
   */
  calculateSummaryFromRawData(jsonData) {
    const summary = {
      features: 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0
    };

    if (!Array.isArray(jsonData)) {
      return summary;
    }

    jsonData.forEach(feature => {
      summary.features++;
      
      const elements = feature.elements || feature.scenarios || [];
      elements.forEach(scenario => {
        if (scenario.type === 'background') return;
        
        summary.scenarios++;
        
        // Simple status determination
        let scenarioStatus = 'unknown';
        if (scenario.steps && Array.isArray(scenario.steps)) {
          summary.steps += scenario.steps.length;
          
          const hasFailedSteps = scenario.steps.some(step => {
            const status = step.result ? step.result.status : step.status;
            return status === 'failed';
          });
          
          const hasPassedSteps = scenario.steps.some(step => {
            const status = step.result ? step.result.status : step.status;
            return status === 'passed';
          });
          
          if (hasFailedSteps) {
            scenarioStatus = 'failed';
          } else if (hasPassedSteps) {
            scenarioStatus = 'passed';
          } else {
            scenarioStatus = 'skipped';
          }
        }
        
        switch (scenarioStatus) {
          case 'passed': summary.passed++; break;
          case 'failed': summary.failed++; break;
          case 'skipped': summary.skipped++; break;
          default: summary.errors++; break;
        }
      });
    });

    return summary;
  }

  /**
   * Extract counts from parsed data
   */
  extractCountsFromParsedData(parsedData) {
    if (parsedData && parsedData._validation) {
      return {
        features: parsedData.features || 0,
        scenarios: parsedData.scenarios || 0,
        steps: parsedData.steps || 0,
        passed: parsedData.passed || 0,
        failed: parsedData.failed || 0,
        skipped: parsedData.skipped || 0,
        errors: parsedData.errors || 0
      };
    }
    
    // Fallback to direct calculation
    return this.calculateSummaryFromRawData(parsedData);
  }

  /**
   * Compare two count sets
   */
  compareCountSets(counts1, counts2, comparisonType) {
    const comparison = {
      comparisonType,
      isConsistent: true,
      discrepancies: [],
      tolerance: this.options.tolerancePercentage
    };

    const fieldsToCompare = ['features', 'scenarios', 'steps', 'passed', 'failed', 'skipped'];
    
    fieldsToCompare.forEach(field => {
      const value1 = counts1[field] || 0;
      const value2 = counts2[field] || 0;
      
      if (value1 !== value2) {
        const tolerance = Math.max(1, Math.floor(Math.max(value1, value2) * this.options.tolerancePercentage / 100));
        const difference = Math.abs(value1 - value2);
        
        if (difference > tolerance) {
          comparison.discrepancies.push({
            field,
            value1,
            value2,
            difference: value2 - value1,
            tolerance
          });
          comparison.isConsistent = false;
        }
      }
    });

    return comparison;
  }

  /**
   * Normalize expected counts format
   */
  normalizeExpectedCounts(expectedCounts) {
    return {
      features: expectedCounts.features || expectedCounts.totalFeatures || 0,
      scenarios: expectedCounts.scenarios || expectedCounts.totalScenarios || 0,
      steps: expectedCounts.steps || expectedCounts.totalSteps || 0,
      passed: expectedCounts.passed || expectedCounts.totalPassed || 0,
      failed: expectedCounts.failed || expectedCounts.totalFailed || 0,
      skipped: expectedCounts.skipped || expectedCounts.totalSkipped || 0,
      errors: expectedCounts.errors || expectedCounts.totalErrors || 0
    };
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations(comparisons) {
    const recommendations = [];

    comparisons.forEach(comparison => {
      if (!comparison.isConsistent) {
        comparison.discrepancies.forEach(discrepancy => {
          if (discrepancy.field === 'scenarios' && Math.abs(discrepancy.difference) > 5) {
            recommendations.push({
              type: 'critical',
              message: `Significant scenario count discrepancy detected. Verify test execution completeness.`,
              field: discrepancy.field
            });
          } else if (discrepancy.field === 'failed' && discrepancy.difference > 0) {
            recommendations.push({
              type: 'warning',
              message: `More failures detected in parsed data than expected. Check for setup/teardown failures.`,
              field: discrepancy.field
            });
          }
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations(report) {
    const recommendations = [];

    if (report.summary.criticalIssues > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Critical data integrity issues detected. Manual verification recommended before using results.'
      });
    }

    if (report.summary.warnings > 5) {
      recommendations.push({
        type: 'warning',
        message: 'Multiple data quality warnings detected. Consider improving test data consistency.'
      });
    }

    if (report.validations.crossValidation && !report.validations.crossValidation.isValid) {
      recommendations.push({
        type: 'info',
        message: 'Cross-validation discrepancies found. Review parsing logic for accuracy improvements.'
      });
    }

    return recommendations;
  }

  /**
   * Record validation for history tracking
   */
  recordValidation(validation) {
    this.validationHistory.push({
      timestamp: new Date().toISOString(),
      isValid: validation.isValid,
      issueCount: validation.issues.length,
      discrepancyCount: validation.discrepancies.length
    });

    // Keep only last 20 validations
    if (this.validationHistory.length > 20) {
      this.validationHistory = this.validationHistory.slice(-20);
    }
  }
}

export default DataIntegrityValidator;