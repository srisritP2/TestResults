/**
 * Data Quality Manager
 * Pre-processing validation pipeline for all incoming report data
 */

import FailedScenarioDisplayHandler from './FailedScenarioDisplayHandler.js';
import ExecutionErrorFeatureHandler from './ExecutionErrorFeatureHandler.js';

class DataQualityManager {
  constructor() {
    this.scenarioHandler = new FailedScenarioDisplayHandler();
    this.executionErrorHandler = new ExecutionErrorFeatureHandler();
    this.validationCache = new Map();
    this.recoveryStrategies = new Map();
    
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize recovery strategies for different types of data issues
   */
  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('empty_scenario_name', {
      strategy: 'generate_placeholder',
      handler: (scenario) => this.scenarioHandler.generatePlaceholderName(scenario),
      priority: 'high'
    });

    this.recoveryStrategies.set('missing_feature_name', {
      strategy: 'extract_from_uri',
      handler: (feature) => this.extractFeatureNameFromUri(feature),
      priority: 'medium'
    });

    this.recoveryStrategies.set('no_steps', {
      strategy: 'create_placeholder_steps',
      handler: (scenario) => this.createPlaceholderSteps(scenario),
      priority: 'high'
    });

    this.recoveryStrategies.set('missing_results', {
      strategy: 'infer_status',
      handler: (step) => this.inferStepStatus(step),
      priority: 'medium'
    });

    this.recoveryStrategies.set('execution_error', {
      strategy: 'special_handling',
      handler: (feature) => this.executionErrorHandler.renderExecutionErrorFeature(feature),
      priority: 'critical'
    });
  }

  /**
   * Validate entire report and apply recovery strategies
   * @param {Array} reportData - Raw Cucumber JSON report data
   * @param {string} reportId - Optional report identifier
   * @returns {Object} - Validation result with sanitized data
   */
  validateReport(reportData, reportId = 'unknown') {
    const validationKey = `${reportId}_${Date.now()}`;
    
    // Check cache first
    if (this.validationCache.has(validationKey)) {
      return this.validationCache.get(validationKey);
    }

    const validation = {
      reportId,
      timestamp: new Date().toISOString(),
      isValid: true,
      issues: [],
      warnings: [],
      recoveredData: [],
      statistics: {
        totalFeatures: 0,
        totalScenarios: 0,
        totalSteps: 0,
        issuesFound: 0,
        issuesRecovered: 0,
        executionErrors: 0
      },
      sanitizedData: null
    };

    try {
      // Ensure reportData is an array
      if (!Array.isArray(reportData)) {
        validation.isValid = false;
        validation.issues.push({
          type: 'invalid_structure',
          message: 'Report data is not an array',
          severity: 'critical',
          location: 'root'
        });
        return validation;
      }

      // Process each feature
      const sanitizedFeatures = [];
      
      reportData.forEach((feature, featureIndex) => {
        const featureValidation = this.validateFeature(feature, featureIndex);
        validation.statistics.totalFeatures++;
        
        // Collect issues
        validation.issues.push(...featureValidation.issues);
        validation.warnings.push(...featureValidation.warnings);
        
        // Apply recovery strategies
        const recoveredFeature = this.applyRecoveryStrategies(feature, featureValidation);
        sanitizedFeatures.push(recoveredFeature);
        
        // Update statistics
        validation.statistics.issuesFound += featureValidation.issues.length;
        validation.statistics.issuesRecovered += featureValidation.recoveredIssues;
        
        if (this.executionErrorHandler.isExecutionErrorFeature(feature)) {
          validation.statistics.executionErrors++;
        }
      });

      // Set overall validation status
      validation.isValid = validation.issues.filter(issue => 
        issue.severity === 'critical' || issue.severity === 'high'
      ).length === 0;

      validation.sanitizedData = sanitizedFeatures;
      validation.statistics.totalScenarios = this.countScenarios(sanitizedFeatures);
      validation.statistics.totalSteps = this.countSteps(sanitizedFeatures);

      // Cache the result
      this.validationCache.set(validationKey, validation);
      
    } catch (error) {
      validation.isValid = false;
      validation.issues.push({
        type: 'validation_error',
        message: `Validation failed: ${error.message}`,
        severity: 'critical',
        location: 'validation_process'
      });
    }

    return validation;
  }

  /**
   * Validate individual feature
   * @param {Object} feature - Feature object
   * @param {number} featureIndex - Feature index in report
   * @returns {Object} - Feature validation result
   */
  validateFeature(feature, featureIndex) {
    const validation = {
      featureIndex,
      issues: [],
      warnings: [],
      recoveredIssues: 0
    };

    // Validate feature structure
    if (!feature || typeof feature !== 'object') {
      validation.issues.push({
        type: 'invalid_feature_structure',
        message: 'Feature is not a valid object',
        severity: 'critical',
        location: `Feature ${featureIndex}`
      });
      return validation;
    }

    // Check feature name
    if (!feature.name || feature.name.trim() === '') {
      validation.issues.push({
        type: 'missing_feature_name',
        message: 'Feature has missing or empty name',
        severity: 'medium',
        location: `Feature ${featureIndex}`,
        recoverable: true
      });
    }

    // Check for execution error features
    if (this.executionErrorHandler.isExecutionErrorFeature(feature)) {
      validation.warnings.push({
        type: 'execution_error_feature',
        message: 'Feature contains execution errors',
        severity: 'warning',
        location: `Feature ${featureIndex}`,
        specialHandling: true
      });
    }

    // Validate scenarios
    if (feature.elements && Array.isArray(feature.elements)) {
      feature.elements.forEach((scenario, scenarioIndex) => {
        if (scenario.type !== 'background') {
          const scenarioValidation = this.validateScenario(scenario, featureIndex, scenarioIndex);
          validation.issues.push(...scenarioValidation.issues);
          validation.warnings.push(...scenarioValidation.warnings);
          validation.recoveredIssues += scenarioValidation.recoveredIssues;
        }
      });
    } else {
      validation.warnings.push({
        type: 'no_scenarios',
        message: 'Feature has no scenarios',
        severity: 'warning',
        location: `Feature ${featureIndex}`
      });
    }

    return validation;
  }

  /**
   * Validate individual scenario
   * @param {Object} scenario - Scenario object
   * @param {number} featureIndex - Feature index
   * @param {number} scenarioIndex - Scenario index
   * @returns {Object} - Scenario validation result
   */
  validateScenario(scenario, featureIndex, scenarioIndex) {
    const validation = {
      issues: [],
      warnings: [],
      recoveredIssues: 0
    };

    const location = `Feature ${featureIndex}, Scenario ${scenarioIndex}`;

    // Use the scenario handler for detailed validation
    const scenarioValidation = this.scenarioHandler.validateScenarioData(scenario);
    
    // Convert scenario validation to our format
    scenarioValidation.issues.forEach(issue => {
      validation.issues.push({
        ...issue,
        location,
        recoverable: this.recoveryStrategies.has(issue.type)
      });
    });

    return validation;
  }

  /**
   * Apply recovery strategies to fix data issues
   * @param {Object} feature - Feature object
   * @param {Object} featureValidation - Feature validation result
   * @returns {Object} - Recovered feature object
   */
  applyRecoveryStrategies(feature, featureValidation) {
    let recoveredFeature = { ...feature };
    let recoveredCount = 0;

    // Apply feature-level recovery
    featureValidation.issues.forEach(issue => {
      if (issue.recoverable && this.recoveryStrategies.has(issue.type)) {
        const strategy = this.recoveryStrategies.get(issue.type);
        try {
          const recoveredValue = strategy.handler(recoveredFeature);
          
          switch (issue.type) {
            case 'missing_feature_name':
              recoveredFeature.name = recoveredValue;
              recoveredCount++;
              break;
          }
        } catch (error) {
          console.warn(`Recovery strategy failed for ${issue.type}:`, error);
        }
      }
    });

    // Apply scenario-level recovery
    if (recoveredFeature.elements && Array.isArray(recoveredFeature.elements)) {
      recoveredFeature.elements = recoveredFeature.elements.map(scenario => {
        if (scenario.type === 'background') {
          return scenario;
        }

        const scenarioValidation = this.scenarioHandler.validateScenarioData(scenario);
        let recoveredScenario = { ...scenario };

        scenarioValidation.issues.forEach(issue => {
          if (this.recoveryStrategies.has(issue.type)) {
            const strategy = this.recoveryStrategies.get(issue.type);
            try {
              const recoveredValue = strategy.handler(recoveredScenario);
              
              switch (issue.type) {
                case 'empty_scenario_name':
                  recoveredScenario._generatedName = recoveredValue;
                  recoveredScenario._hasPlaceholderName = true;
                  recoveredCount++;
                  break;
                case 'no_steps':
                  recoveredScenario._placeholderSteps = recoveredValue;
                  recoveredCount++;
                  break;
                case 'missing_results':
                  // Apply to individual steps
                  if (recoveredScenario.steps) {
                    recoveredScenario.steps = recoveredScenario.steps.map(step => {
                      if (!step.result) {
                        step._inferredResult = strategy.handler(step);
                        recoveredCount++;
                      }
                      return step;
                    });
                  }
                  break;
              }
            } catch (error) {
              console.warn(`Scenario recovery strategy failed for ${issue.type}:`, error);
            }
          }
        });

        return recoveredScenario;
      });
    }

    // Mark feature as processed
    recoveredFeature._dataQualityProcessed = true;
    recoveredFeature._recoveredIssues = recoveredCount;
    
    return recoveredFeature;
  }

  /**
   * Extract feature name from URI
   * @param {Object} feature - Feature object
   * @returns {string} - Extracted feature name
   */
  extractFeatureNameFromUri(feature) {
    if (!feature.uri) {
      return 'Unnamed Feature';
    }

    const uriParts = feature.uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    if (fileName && fileName !== 'failure.feature') {
      return fileName
        .replace(/\.(feature|js|ts)$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }

    return 'Unnamed Feature';
  }

  /**
   * Create placeholder steps for scenarios without steps
   * @param {Object} scenario - Scenario object
   * @returns {Array} - Array of placeholder steps
   */
  createPlaceholderSteps(scenario) {
    return [{
      name: 'No steps defined',
      keyword: 'Given ',
      result: {
        status: 'skipped',
        duration: 0
      },
      _isPlaceholder: true
    }];
  }

  /**
   * Infer step status from context
   * @param {Object} step - Step object
   * @returns {Object} - Inferred result object
   */
  inferStepStatus(step) {
    return {
      status: 'unknown',
      duration: 0,
      _isInferred: true
    };
  }

  /**
   * Count total scenarios in report
   * @param {Array} features - Array of features
   * @returns {number} - Total scenario count
   */
  countScenarios(features) {
    return features.reduce((total, feature) => {
      if (feature.elements && Array.isArray(feature.elements)) {
        return total + feature.elements.filter(el => el.type !== 'background').length;
      }
      return total;
    }, 0);
  }

  /**
   * Count total steps in report
   * @param {Array} features - Array of features
   * @returns {number} - Total step count
   */
  countSteps(features) {
    return features.reduce((total, feature) => {
      if (feature.elements && Array.isArray(feature.elements)) {
        return total + feature.elements.reduce((scenarioTotal, scenario) => {
          if (scenario.steps && Array.isArray(scenario.steps)) {
            return scenarioTotal + scenario.steps.length;
          }
          return scenarioTotal;
        }, 0);
      }
      return total;
    }, 0);
  }

  /**
   * Generate integrity report
   * @param {Object} validation - Validation result
   * @returns {Object} - Integrity report
   */
  generateIntegrityReport(validation) {
    const criticalIssues = validation.issues.filter(issue => issue.severity === 'critical');
    const highIssues = validation.issues.filter(issue => issue.severity === 'high');
    const mediumIssues = validation.issues.filter(issue => issue.severity === 'medium');
    
    const overallStatus = criticalIssues.length > 0 ? 'critical' :
                         highIssues.length > 0 ? 'high' :
                         mediumIssues.length > 0 ? 'medium' : 'good';

    return {
      overallStatus,
      summary: {
        totalIssues: validation.issues.length,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        mediumIssues: mediumIssues.length,
        warnings: validation.warnings.length,
        recoveredIssues: validation.statistics.issuesRecovered
      },
      statistics: validation.statistics,
      recommendations: this.generateRecommendations(validation),
      timestamp: validation.timestamp
    };
  }

  /**
   * Generate recommendations based on validation results
   * @param {Object} validation - Validation result
   * @returns {Array} - Array of recommendation objects
   */
  generateRecommendations(validation) {
    const recommendations = [];
    const issueTypes = new Set(validation.issues.map(issue => issue.type));

    if (issueTypes.has('empty_scenario_name')) {
      recommendations.push({
        priority: 'high',
        category: 'test_quality',
        message: 'Add meaningful names to all scenarios',
        action: 'Review feature files and ensure all scenarios have descriptive names',
        impact: 'Improves test readability and debugging'
      });
    }

    if (issueTypes.has('missing_feature_name')) {
      recommendations.push({
        priority: 'medium',
        category: 'test_quality',
        message: 'Add names to all features',
        action: 'Ensure all feature files have descriptive feature names',
        impact: 'Improves test organization and reporting'
      });
    }

    if (validation.statistics.executionErrors > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'framework',
        message: 'Fix execution errors in test framework',
        action: 'Review Cucumber configuration and resolve IllegalArgumentException errors',
        impact: 'Prevents test execution failures and improves reliability'
      });
    }

    if (issueTypes.has('no_steps')) {
      recommendations.push({
        priority: 'high',
        category: 'test_completeness',
        message: 'Add steps to scenarios without test logic',
        action: 'Review scenarios and add appropriate test steps',
        impact: 'Ensures all scenarios have meaningful test coverage'
      });
    }

    return recommendations;
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    this.scenarioHandler.clearCache();
    this.executionErrorHandler.clearCache();
  }

  /**
   * Get data quality statistics
   * @returns {Object} - Statistics object
   */
  getStatistics() {
    return {
      cachedValidations: this.validationCache.size,
      recoveryStrategies: this.recoveryStrategies.size,
      scenarioHandlerStats: this.scenarioHandler.getStatistics(),
      executionErrorStats: this.executionErrorHandler.getStatistics()
    };
  }

  /**
   * Add custom recovery strategy
   * @param {string} issueType - Type of issue to handle
   * @param {Object} strategy - Recovery strategy configuration
   */
  addRecoveryStrategy(issueType, strategy) {
    this.recoveryStrategies.set(issueType, strategy);
  }

  /**
   * Remove recovery strategy
   * @param {string} issueType - Type of issue to stop handling
   */
  removeRecoveryStrategy(issueType) {
    this.recoveryStrategies.delete(issueType);
  }
}

export default DataQualityManager;