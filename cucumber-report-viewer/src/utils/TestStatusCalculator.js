/**
 * Test Status Calculator
 * Provides accurate status determination for Cucumber test results
 * Handles setup/teardown failures, edge cases, and proper classification
 */

class TestStatusCalculator {
  constructor(options = {}) {
    this.options = {
      treatSetupFailuresAsFailed: options.treatSetupFailuresAsFailed !== false,
      treatTeardownFailuresAsFailed: options.treatTeardownFailuresAsFailed !== false,
      logLevel: options.logLevel || 'warn'
    };
  }

  /**
   * Calculate overall scenario status considering all phases
   */
  calculateScenarioStatus(scenario) {
    if (!scenario) {
      return { status: 'unknown', reason: 'Scenario is null or undefined' };
    }

    const result = {
      status: 'unknown',
      reason: '',
      details: {
        setupStatus: 'not_executed',
        executionStatus: 'not_executed', 
        teardownStatus: 'not_executed',
        hasSteps: false,
        hasSetup: false,
        hasTeardown: false
      }
    };

    try {
      // Check setup phase (before hooks)
      const setupResult = this.analyzeSetupPhase(scenario);
      result.details.setupStatus = setupResult.status;
      result.details.hasSetup = setupResult.hasHooks;

      // Check execution phase (steps)
      const executionResult = this.analyzeExecutionPhase(scenario);
      result.details.executionStatus = executionResult.status;
      result.details.hasSteps = executionResult.hasSteps;

      // Check teardown phase (after hooks)
      const teardownResult = this.analyzeTeardownPhase(scenario);
      result.details.teardownStatus = teardownResult.status;
      result.details.hasTeardown = teardownResult.hasHooks;

      // Determine overall status based on all phases
      const overallStatus = this.determineOverallStatus(setupResult, executionResult, teardownResult);
      result.status = overallStatus.status;
      result.reason = overallStatus.reason;

      this.log(`Scenario "${scenario.name || 'unnamed'}": ${result.status} (${result.reason})`);

    } catch (error) {
      result.status = 'error';
      result.reason = `Status calculation error: ${error.message}`;
      this.log(`Error calculating status for scenario: ${error.message}`, 'error');
    }

    return result;
  }

  /**
   * Calculate feature status based on all scenarios
   */
  calculateFeatureStatus(feature) {
    if (!feature || !feature.elements) {
      return { status: 'unknown', reason: 'Feature has no scenarios' };
    }

    const scenarios = feature.elements.filter(el => el.type !== 'background');
    if (scenarios.length === 0) {
      return { status: 'unknown', reason: 'No executable scenarios found' };
    }

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let errors = 0;

    scenarios.forEach(scenario => {
      const scenarioStatus = this.calculateScenarioStatus(scenario);
      switch (scenarioStatus.status) {
        case 'passed': passed++; break;
        case 'failed': failed++; break;
        case 'skipped': skipped++; break;
        default: errors++; break;
      }
    });

    let status, reason;
    if (errors > 0) {
      status = 'error';
      reason = `${errors} scenarios have errors`;
    } else if (failed > 0) {
      status = 'failed';
      reason = `${failed} of ${scenarios.length} scenarios failed`;
    } else if (skipped === scenarios.length) {
      status = 'skipped';
      reason = 'All scenarios were skipped';
    } else if (passed === scenarios.length) {
      status = 'passed';
      reason = 'All scenarios passed';
    } else {
      status = 'mixed';
      reason = `${passed} passed, ${failed} failed, ${skipped} skipped`;
    }

    return { status, reason, counts: { passed, failed, skipped, errors, total: scenarios.length } };
  }

  /**
   * Analyze setup phase (before hooks)
   */
  analyzeSetupPhase(scenario) {
    const result = { status: 'not_executed', hasHooks: false, failureReason: null };

    if (!scenario.before || !Array.isArray(scenario.before)) {
      return result;
    }

    result.hasHooks = scenario.before.length > 0;

    for (const hook of scenario.before) {
      const hookStatus = this.getHookStatus(hook);
      
      if (hookStatus === 'failed') {
        result.status = 'failed';
        result.failureReason = this.extractErrorMessage(hook);
        return result; // Early return on first failure
      } else if (hookStatus === 'passed') {
        result.status = 'passed';
      }
    }

    return result;
  }

  /**
   * Analyze execution phase (test steps)
   */
  analyzeExecutionPhase(scenario) {
    const result = { status: 'not_executed', hasSteps: false, failureReason: null };

    if (!scenario.steps || !Array.isArray(scenario.steps)) {
      return result;
    }

    result.hasSteps = scenario.steps.length > 0;

    let hasPassedSteps = false;
    let hasFailedSteps = false;
    let hasSkippedSteps = false;

    for (const step of scenario.steps) {
      const stepStatus = this.getStepStatus(step);
      
      switch (stepStatus) {
        case 'passed':
          hasPassedSteps = true;
          break;
        case 'failed':
          hasFailedSteps = true;
          result.failureReason = this.extractErrorMessage(step);
          break;
        case 'skipped':
          hasSkippedSteps = true;
          break;
      }
    }

    // Determine execution status
    if (hasFailedSteps) {
      result.status = 'failed';
    } else if (hasPassedSteps && !hasSkippedSteps) {
      result.status = 'passed';
    } else if (hasSkippedSteps && !hasPassedSteps) {
      result.status = 'skipped';
    } else if (hasPassedSteps && hasSkippedSteps) {
      result.status = 'mixed';
    }

    return result;
  }

  /**
   * Analyze teardown phase (after hooks)
   */
  analyzeTeardownPhase(scenario) {
    const result = { status: 'not_executed', hasHooks: false, failureReason: null };

    if (!scenario.after || !Array.isArray(scenario.after)) {
      return result;
    }

    result.hasHooks = scenario.after.length > 0;

    for (const hook of scenario.after) {
      const hookStatus = this.getHookStatus(hook);
      
      if (hookStatus === 'failed') {
        result.status = 'failed';
        result.failureReason = this.extractErrorMessage(hook);
        return result; // Early return on first failure
      } else if (hookStatus === 'passed') {
        result.status = 'passed';
      }
    }

    return result;
  }

  /**
   * Determine overall status from all phases
   */
  determineOverallStatus(setupResult, executionResult, teardownResult) {
    // Setup failures are treated as test failures
    if (this.options.treatSetupFailuresAsFailed && setupResult.status === 'failed') {
      return {
        status: 'failed',
        reason: `Setup failed: ${setupResult.failureReason || 'Before hook failed'}`
      };
    }

    // Teardown failures are treated as test failures
    if (this.options.treatTeardownFailuresAsFailed && teardownResult.status === 'failed') {
      return {
        status: 'failed',
        reason: `Teardown failed: ${teardownResult.failureReason || 'After hook failed'}`
      };
    }

    // Execution phase determines primary status
    switch (executionResult.status) {
      case 'failed':
        return {
          status: 'failed',
          reason: `Test execution failed: ${executionResult.failureReason || 'Step failed'}`
        };
      
      case 'passed':
        return {
          status: 'passed',
          reason: 'All steps passed successfully'
        };
      
      case 'skipped':
        return {
          status: 'skipped',
          reason: 'Test steps were skipped'
        };
      
      case 'mixed':
        return {
          status: 'failed', // Mixed results indicate partial failure
          reason: 'Some steps failed or were skipped'
        };
      
      case 'not_executed':
        if (!executionResult.hasSteps) {
          return {
            status: 'skipped',
            reason: 'No executable steps found'
          };
        }
        return {
          status: 'unknown',
          reason: 'Steps present but execution status unclear'
        };
      
      default:
        return {
          status: 'unknown',
          reason: 'Unable to determine execution status'
        };
    }
  }

  /**
   * Handle setup/teardown failures appropriately
   */
  handleSetupFailures(beforeHooks, afterHooks) {
    const result = {
      setupFailed: false,
      teardownFailed: false,
      setupError: null,
      teardownError: null,
      shouldFailTest: false
    };

    // Check before hooks
    if (beforeHooks && Array.isArray(beforeHooks)) {
      for (const hook of beforeHooks) {
        if (this.getHookStatus(hook) === 'failed') {
          result.setupFailed = true;
          result.setupError = this.extractErrorMessage(hook);
          if (this.options.treatSetupFailuresAsFailed) {
            result.shouldFailTest = true;
          }
          break;
        }
      }
    }

    // Check after hooks
    if (afterHooks && Array.isArray(afterHooks)) {
      for (const hook of afterHooks) {
        if (this.getHookStatus(hook) === 'failed') {
          result.teardownFailed = true;
          result.teardownError = this.extractErrorMessage(hook);
          if (this.options.treatTeardownFailuresAsFailed) {
            result.shouldFailTest = true;
          }
          break;
        }
      }
    }

    return result;
  }

  /**
   * Classify test result with detailed reasoning
   */
  classifyTestResult(testData) {
    if (!testData) {
      return { status: 'error', reason: 'No test data provided' };
    }

    // Handle different test data formats
    if (testData.elements) {
      // Feature-level data
      return this.calculateFeatureStatus(testData);
    } else if (testData.steps || testData.before || testData.after) {
      // Scenario-level data
      return this.calculateScenarioStatus(testData);
    } else {
      return { status: 'unknown', reason: 'Unrecognized test data format' };
    }
  }

  /**
   * Get status from hook result
   */
  getHookStatus(hook) {
    if (!hook) return 'unknown';
    
    if (hook.result) {
      return hook.result.status || 'unknown';
    }
    
    if (hook.status) {
      return hook.status;
    }
    
    return 'unknown';
  }

  /**
   * Get status from step result
   */
  getStepStatus(step) {
    if (!step) return 'unknown';
    
    if (step.result) {
      return step.result.status || 'unknown';
    }
    
    if (step.status) {
      return step.status;
    }
    
    return 'unknown';
  }

  /**
   * Extract error message from hook or step
   */
  extractErrorMessage(item) {
    if (!item) return null;

    // Try result.error_message first
    if (item.result && item.result.error_message) {
      return this.sanitizeErrorMessage(item.result.error_message);
    }

    // Try result.errorMessage
    if (item.result && item.result.errorMessage) {
      return this.sanitizeErrorMessage(item.result.errorMessage);
    }

    // Try direct error_message
    if (item.error_message) {
      return this.sanitizeErrorMessage(item.error_message);
    }

    // Try to infer from status
    if (item.result && item.result.status === 'failed') {
      return 'Step or hook failed (no error message available)';
    }

    return null;
  }

  /**
   * Sanitize error message for display
   */
  sanitizeErrorMessage(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
      return 'Unknown error';
    }

    // Truncate very long error messages
    if (errorMessage.length > 500) {
      return errorMessage.substring(0, 500) + '... (truncated)';
    }

    return errorMessage.trim();
  }

  /**
   * Check if error is ElementNotInteractableException
   */
  isElementNotInteractableException(errorMessage) {
    if (!errorMessage) return false;
    return errorMessage.includes('ElementNotInteractableException') || 
           errorMessage.includes('element not interactable');
  }

  /**
   * Check if error is IllegalArgumentException for null test name
   */
  isNullTestNameException(errorMessage) {
    if (!errorMessage) return false;
    return errorMessage.includes('IllegalArgumentException') && 
           errorMessage.includes('Test name must not be null or empty');
  }

  /**
   * Logging utility
   */
  log(message, level = 'info') {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;
    const messageLevel = levels[level] || 2;

    if (messageLevel <= currentLevel) {
      console[level] ? console[level](`[TestStatusCalculator] ${message}`) : console.log(`[TestStatusCalculator] ${message}`);
    }
  }
}

export default TestStatusCalculator;