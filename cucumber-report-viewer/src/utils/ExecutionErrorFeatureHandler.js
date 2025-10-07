/**
 * Execution Error Feature Handler
 * Handles Cucumber framework execution errors like classpath:io/cucumber/core/failure.feature
 */

class ExecutionErrorFeatureHandler {
  constructor() {
    this.executionErrorPatterns = [
      'classpath:io/cucumber/core/failure.feature',
      'failure.feature',
      'execution-error'
    ];
    
    this.errorGuidanceCache = new Map();
  }

  /**
   * Detect if a feature is a Cucumber framework execution error
   * @param {Object} feature - The feature object
   * @returns {boolean} - True if this is an execution error feature
   */
  isExecutionErrorFeature(feature) {
    if (!feature || !feature.uri) {
      return false;
    }

    return this.executionErrorPatterns.some(pattern => 
      feature.uri.includes(pattern)
    );
  }

  /**
   * Render execution error feature with special styling and information
   * @param {Object} feature - The execution error feature object
   * @returns {Object} - Rendered execution error feature
   */
  renderExecutionErrorFeature(feature) {
    const guidance = this.getExecutionErrorGuidance(feature);
    
    return {
      type: 'execution-error',
      originalFeature: feature,
      title: '⚠️ Test Execution Error',
      subtitle: 'Framework-level execution failure',
      description: feature.description || 'There were errors during the execution',
      severity: 'critical',
      isFrameworkError: true,
      guidance: guidance,
      styling: this.getExecutionErrorStyling(),
      indicators: this.getExecutionErrorIndicators(feature, guidance),
      scenarios: this.processExecutionErrorScenarios(feature.elements || []),
      metadata: {
        uri: feature.uri,
        featureId: feature.id || 'execution-error',
        errorType: this.detectErrorType(feature),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get specific guidance based on the type of execution error
   * @param {Object} feature - The execution error feature
   * @returns {Object} - Guidance object with issue, solution, and actions
   */
  getExecutionErrorGuidance(feature) {
    const featureKey = this.getFeatureKey(feature);
    
    // Return cached guidance if available
    if (this.errorGuidanceCache.has(featureKey)) {
      return this.errorGuidanceCache.get(featureKey);
    }

    const scenarios = feature.elements || [];
    const errorScenarios = scenarios.filter(s => 
      s.steps && s.steps.some(step => 
        step.result && step.result.status === 'failed'
      )
    );

    let guidance = {
      issue: 'Test execution framework error',
      solution: 'Check Cucumber configuration and test setup',
      action: 'Review logs and test runner configuration for detailed error information',
      priority: 'high',
      category: 'framework',
      resolutionSteps: []
    };

    // Analyze specific error types
    if (errorScenarios.length > 0) {
      const firstError = errorScenarios[0].steps.find(step => 
        step.result && step.result.status === 'failed'
      );
      
      if (firstError && firstError.result.error_message) {
        const errorMessage = firstError.result.error_message;
        
        // Handle "Test name must not be null or empty" errors
        if (errorMessage.includes('Test name must not be null or empty')) {
          guidance = {
            issue: 'Empty test names detected',
            solution: 'Ensure all scenarios have meaningful names in your feature files',
            action: 'Review your Cucumber feature files and add names to all scenarios',
            priority: 'critical',
            category: 'configuration',
            resolutionSteps: [
              'Open your feature files (.feature)',
              'Check for scenarios without names or with empty names',
              'Add descriptive names to all scenarios',
              'Ensure scenario names are not null or empty strings',
              'Re-run your tests to verify the fix'
            ],
            technicalDetails: {
              errorType: 'IllegalArgumentException',
              rootCause: 'Scenario names are required by the test framework',
              impact: 'Prevents test execution and report generation'
            }
          };
        }
        
        // Handle IllegalArgumentException errors
        else if (errorMessage.includes('IllegalArgumentException')) {
          guidance = {
            issue: 'Invalid test configuration detected',
            solution: 'Check your test runner configuration and step definitions',
            action: 'Review test setup and ensure all required parameters are provided',
            priority: 'high',
            category: 'configuration',
            resolutionSteps: [
              'Check your test runner configuration',
              'Verify all step definitions have proper parameters',
              'Ensure feature files are properly formatted',
              'Check for missing or invalid test annotations',
              'Validate test data and parameter bindings'
            ],
            technicalDetails: {
              errorType: 'IllegalArgumentException',
              rootCause: 'Invalid parameters or configuration in test setup',
              impact: 'Causes test execution to fail before scenarios run'
            }
          };
        }
        
        // Handle other common execution errors
        else if (errorMessage.includes('ClassNotFoundException')) {
          guidance = {
            issue: 'Missing test dependencies or classes',
            solution: 'Check your classpath and ensure all required dependencies are available',
            action: 'Verify test dependencies and class availability',
            priority: 'high',
            category: 'dependencies',
            resolutionSteps: [
              'Check your project dependencies',
              'Verify classpath configuration',
              'Ensure all required test libraries are included',
              'Check for missing step definition classes',
              'Rebuild your project to resolve dependencies'
            ]
          };
        }
        
        else if (errorMessage.includes('NoSuchMethodException')) {
          guidance = {
            issue: 'Missing or incompatible step definitions',
            solution: 'Check your step definitions and method signatures',
            action: 'Verify step definition methods match feature file steps',
            priority: 'high',
            category: 'step-definitions',
            resolutionSteps: [
              'Review your step definition files',
              'Check method signatures match step patterns',
              'Verify parameter types and counts',
              'Ensure step definition annotations are correct',
              'Check for typos in step patterns'
            ]
          };
        }
      }
    }

    // Cache the guidance
    this.errorGuidanceCache.set(featureKey, guidance);
    return guidance;
  }

  /**
   * Get styling for execution error features
   * @returns {Object} - CSS styling object
   */
  getExecutionErrorStyling() {
    return {
      container: {
        borderLeft: '4px solid #f44336',
        backgroundColor: '#ffebee',
        marginBottom: '16px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(244, 67, 54, 0.1)'
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#ffcdd2',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px'
      },
      icon: {
        color: '#f44336',
        marginRight: '8px',
        fontSize: '24px'
      },
      title: {
        color: '#c62828',
        fontWeight: 'bold',
        fontSize: '16px',
        margin: 0
      },
      subtitle: {
        color: '#d32f2f',
        fontSize: '12px',
        fontStyle: 'italic',
        marginTop: '2px'
      },
      content: {
        padding: '16px',
        backgroundColor: '#ffebee'
      },
      guidance: {
        padding: '16px',
        backgroundColor: '#fff3e0',
        borderLeft: '3px solid #ff9800',
        marginTop: '8px',
        borderRadius: '0 4px 4px 0'
      },
      guidanceTitle: {
        color: '#e65100',
        fontWeight: 'bold',
        marginBottom: '8px'
      },
      resolutionSteps: {
        marginTop: '12px',
        paddingLeft: '16px'
      }
    };
  }

  /**
   * Get indicators for execution error features
   * @param {Object} feature - The execution error feature
   * @param {Object} guidance - The guidance object
   * @returns {Array} - Array of indicator objects
   */
  getExecutionErrorIndicators(feature, guidance) {
    const indicators = [];

    // Main error indicator
    indicators.push({
      type: 'error',
      icon: 'mdi-alert-circle',
      color: '#f44336',
      text: 'Framework Execution Error',
      tooltip: 'This is a Cucumber framework error, not a test failure'
    });

    // Priority indicator
    indicators.push({
      type: 'priority',
      icon: guidance.priority === 'critical' ? 'mdi-alert-octagon' : 'mdi-alert',
      color: guidance.priority === 'critical' ? '#d32f2f' : '#f57c00',
      text: `${guidance.priority.toUpperCase()} Priority`,
      tooltip: `This issue has ${guidance.priority} priority and should be addressed immediately`
    });

    // Category indicator
    const categoryIcons = {
      framework: 'mdi-cog',
      configuration: 'mdi-settings',
      dependencies: 'mdi-package-variant',
      'step-definitions': 'mdi-code-braces'
    };

    indicators.push({
      type: 'category',
      icon: categoryIcons[guidance.category] || 'mdi-help-circle',
      color: '#2196f3',
      text: guidance.category.replace('-', ' ').toUpperCase(),
      tooltip: `Error category: ${guidance.category}`
    });

    return indicators;
  }

  /**
   * Process scenarios within execution error features
   * @param {Array} scenarios - Array of scenario objects
   * @returns {Array} - Processed scenarios with error context
   */
  processExecutionErrorScenarios(scenarios) {
    return scenarios.map(scenario => {
      const errorSteps = scenario.steps ? scenario.steps.filter(step => 
        step.result && step.result.status === 'failed'
      ) : [];

      return {
        originalScenario: scenario,
        name: scenario.name || 'Execution Error Scenario',
        isExecutionError: true,
        errorSteps: errorSteps,
        errorMessages: errorSteps.map(step => step.result.error_message).filter(Boolean),
        hasFrameworkError: errorSteps.some(step => 
          step.result.error_message && (
            step.result.error_message.includes('IllegalArgumentException') ||
            step.result.error_message.includes('Test name must not be null or empty')
          )
        )
      };
    });
  }

  /**
   * Detect the type of execution error
   * @param {Object} feature - The execution error feature
   * @returns {string} - Error type classification
   */
  detectErrorType(feature) {
    const scenarios = feature.elements || [];
    const errorMessages = [];

    scenarios.forEach(scenario => {
      if (scenario.steps) {
        scenario.steps.forEach(step => {
          if (step.result && step.result.error_message) {
            errorMessages.push(step.result.error_message);
          }
        });
      }
    });

    const allErrors = errorMessages.join(' ');

    if (allErrors.includes('Test name must not be null or empty')) {
      return 'empty-test-names';
    } else if (allErrors.includes('IllegalArgumentException')) {
      return 'illegal-argument';
    } else if (allErrors.includes('ClassNotFoundException')) {
      return 'missing-dependencies';
    } else if (allErrors.includes('NoSuchMethodException')) {
      return 'missing-step-definitions';
    } else {
      return 'unknown-execution-error';
    }
  }

  /**
   * Generate unique key for feature caching
   * @param {Object} feature - The feature object
   * @returns {string} - Unique feature key
   */
  getFeatureKey(feature) {
    return feature.uri || feature.id || `execution-error-${Date.now()}`;
  }

  /**
   * Clear cached guidance
   */
  clearCache() {
    this.errorGuidanceCache.clear();
  }

  /**
   * Get statistics about processed execution errors
   * @returns {Object} - Processing statistics
   */
  getStatistics() {
    return {
      totalExecutionErrors: this.errorGuidanceCache.size,
      cachedGuidance: this.errorGuidanceCache.size,
      supportedPatterns: this.executionErrorPatterns.length
    };
  }

  /**
   * Add custom execution error pattern
   * @param {string} pattern - Pattern to detect execution errors
   */
  addExecutionErrorPattern(pattern) {
    if (!this.executionErrorPatterns.includes(pattern)) {
      this.executionErrorPatterns.push(pattern);
    }
  }

  /**
   * Remove execution error pattern
   * @param {string} pattern - Pattern to remove
   */
  removeExecutionErrorPattern(pattern) {
    const index = this.executionErrorPatterns.indexOf(pattern);
    if (index > -1) {
      this.executionErrorPatterns.splice(index, 1);
    }
  }
}

export default ExecutionErrorFeatureHandler;