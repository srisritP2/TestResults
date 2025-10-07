/**
 * Comprehensive Error Handler and Logger
 * Provides detailed error logging, recovery mechanisms, and user-friendly messages
 */

class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logLevel: options.logLevel || 'warn',
      maxLogEntries: options.maxLogEntries || 1000,
      enableConsoleLogging: options.enableConsoleLogging !== false,
      enableLocalStorage: options.enableLocalStorage !== false,
      storageKey: options.storageKey || 'cucumber-report-errors'
    };
    
    this.errorLog = [];
    this.warningLog = [];
    this.infoLog = [];
    
    // Load existing logs from localStorage
    this.loadLogsFromStorage();
  }

  /**
   * Log error with detailed context
   */
  logError(message, context = {}, error = null) {
    const logEntry = this.createLogEntry('error', message, context, error);
    this.errorLog.push(logEntry);
    
    this.writeToConsole('error', logEntry);
    this.saveLogsToStorage();
    
    return logEntry;
  }

  /**
   * Log warning with context
   */
  logWarning(message, context = {}) {
    const logEntry = this.createLogEntry('warning', message, context);
    this.warningLog.push(logEntry);
    
    this.writeToConsole('warn', logEntry);
    this.saveLogsToStorage();
    
    return logEntry;
  }

  /**
   * Log info message
   */
  logInfo(message, context = {}) {
    const logEntry = this.createLogEntry('info', message, context);
    this.infoLog.push(logEntry);
    
    this.writeToConsole('info', logEntry);
    this.saveLogsToStorage();
    
    return logEntry;
  }

  /**
   * Handle JSON parsing errors with recovery
   */
  handleJsonParsingError(filename, error, rawData = null) {
    const context = {
      filename,
      errorType: 'json_parsing',
      dataSize: rawData ? JSON.stringify(rawData).length : 0,
      timestamp: new Date().toISOString()
    };

    const logEntry = this.logError(
      `JSON parsing failed for ${filename}: ${error.message}`,
      context,
      error
    );

    // Attempt recovery
    const recovery = this.attemptJsonRecovery(rawData, filename);
    if (recovery.success) {
      this.logInfo(`Successfully recovered data for ${filename}`, {
        filename,
        recoveryMethod: recovery.method,
        originalErrors: recovery.errors
      });
    }

    return {
      logEntry,
      recovery,
      userMessage: this.generateUserFriendlyMessage('json_parsing', filename, error)
    };
  }

  /**
   * Handle validation errors
   */
  handleValidationError(filename, validationResult) {
    const context = {
      filename,
      errorType: 'validation',
      errorCount: validationResult.errors ? validationResult.errors.length : 0,
      warningCount: validationResult.warnings ? validationResult.warnings.length : 0,
      timestamp: new Date().toISOString()
    };

    if (validationResult.errors && validationResult.errors.length > 0) {
      validationResult.errors.forEach(error => {
        this.logError(
          `Validation error in ${filename}: ${error.message}`,
          { ...context, location: error.location, errorContext: error.context }
        );
      });
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        this.logWarning(
          `Validation warning in ${filename}: ${warning.message}`,
          { ...context, location: warning.location, warningContext: warning.context }
        );
      });
    }

    return {
      userMessage: this.generateUserFriendlyMessage('validation', filename, validationResult),
      severity: validationResult.errors && validationResult.errors.length > 0 ? 'error' : 'warning'
    };
  }

  /**
   * Handle status calculation errors
   */
  handleStatusCalculationError(scenarioName, error, scenarioData = null) {
    const context = {
      scenarioName,
      errorType: 'status_calculation',
      hasSteps: scenarioData && scenarioData.steps ? scenarioData.steps.length : 0,
      hasHooks: (scenarioData && scenarioData.before ? scenarioData.before.length : 0) +
                (scenarioData && scenarioData.after ? scenarioData.after.length : 0),
      timestamp: new Date().toISOString()
    };

    const logEntry = this.logError(
      `Status calculation failed for scenario "${scenarioName}": ${error.message}`,
      context,
      error
    );

    // Provide fallback status
    const fallbackStatus = this.determineFallbackStatus(scenarioData);

    return {
      logEntry,
      fallbackStatus,
      userMessage: this.generateUserFriendlyMessage('status_calculation', scenarioName, error)
    };
  }

  /**
   * Handle data inconsistency issues
   */
  handleDataInconsistency(description, expected, actual, context = {}) {
    const inconsistencyContext = {
      ...context,
      errorType: 'data_inconsistency',
      expected,
      actual,
      difference: actual - expected,
      timestamp: new Date().toISOString()
    };

    const logEntry = this.logWarning(
      `Data inconsistency detected: ${description}. Expected: ${expected}, Actual: ${actual}`,
      inconsistencyContext
    );

    return {
      logEntry,
      userMessage: this.generateUserFriendlyMessage('data_inconsistency', description, { expected, actual }),
      severity: Math.abs(actual - expected) > expected * 0.1 ? 'error' : 'warning' // >10% difference is error
    };
  }

  /**
   * Create standardized log entry
   */
  createLogEntry(level, message, context = {}, error = null) {
    const entry = {
      id: this.generateLogId(),
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      stack: error ? error.stack : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
    };

    // Trim logs if they exceed max entries
    this.trimLogs();

    return entry;
  }

  /**
   * Generate user-friendly error messages
   */
  generateUserFriendlyMessage(errorType, identifier, errorData) {
    switch (errorType) {
      case 'json_parsing':
        return `Unable to read test report "${identifier}". The file may be corrupted or in an unexpected format. Please check the file and try again.`;
      
      case 'validation':
        const errorCount = errorData.errors ? errorData.errors.length : 0;
        const warningCount = errorData.warnings ? errorData.warnings.length : 0;
        if (errorCount > 0) {
          return `Test report "${identifier}" contains ${errorCount} error(s) that prevent accurate processing. Some results may be missing or incorrect.`;
        } else if (warningCount > 0) {
          return `Test report "${identifier}" has ${warningCount} warning(s). Results should be accurate but please review for completeness.`;
        }
        return `Test report "${identifier}" processed successfully.`;
      
      case 'status_calculation':
        return `Unable to determine accurate status for test "${identifier}". The test result may be displayed as "unknown" - please check the original test execution logs.`;
      
      case 'data_inconsistency':
        return `Inconsistent data detected in "${identifier}". Expected ${errorData.expected} but found ${errorData.actual}. Please verify the test results manually.`;
      
      default:
        return `An unexpected error occurred while processing "${identifier}". Please check the logs for more details.`;
    }
  }

  /**
   * Attempt to recover from JSON parsing errors
   */
  attemptJsonRecovery(rawData, filename) {
    const recovery = {
      success: false,
      method: null,
      recoveredData: null,
      errors: []
    };

    if (!rawData) {
      recovery.errors.push('No raw data available for recovery');
      return recovery;
    }

    try {
      // Method 1: Try to parse as string if it's not already
      if (typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        recovery.success = true;
        recovery.method = 'string_parsing';
        recovery.recoveredData = parsed;
        return recovery;
      }

      // Method 2: If it's already an object, validate structure
      if (typeof rawData === 'object' && rawData !== null) {
        if (Array.isArray(rawData)) {
          recovery.success = true;
          recovery.method = 'array_validation';
          recovery.recoveredData = rawData;
          return recovery;
        }
      }

      recovery.errors.push('Unable to recover: data is not in expected format');
    } catch (error) {
      recovery.errors.push(`Recovery attempt failed: ${error.message}`);
    }

    return recovery;
  }

  /**
   * Determine fallback status for failed calculations
   */
  determineFallbackStatus(scenarioData) {
    if (!scenarioData) return 'unknown';

    // Simple fallback logic
    if (scenarioData.steps && Array.isArray(scenarioData.steps)) {
      const hasFailedSteps = scenarioData.steps.some(step => {
        const status = step.result ? step.result.status : step.status;
        return status === 'failed';
      });

      if (hasFailedSteps) return 'failed';

      const hasPassedSteps = scenarioData.steps.some(step => {
        const status = step.result ? step.result.status : step.status;
        return status === 'passed';
      });

      if (hasPassedSteps) return 'passed';
    }

    return 'unknown';
  }

  /**
   * Get error summary for display
   */
  getErrorSummary() {
    const recentErrors = this.errorLog.slice(-10); // Last 10 errors
    const recentWarnings = this.warningLog.slice(-10); // Last 10 warnings

    return {
      totalErrors: this.errorLog.length,
      totalWarnings: this.warningLog.length,
      totalInfo: this.infoLog.length,
      recentErrors,
      recentWarnings,
      lastErrorTime: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null,
      lastWarningTime: this.warningLog.length > 0 ? this.warningLog[this.warningLog.length - 1].timestamp : null
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.errorLog = [];
    this.warningLog = [];
    this.infoLog = [];
    this.saveLogsToStorage();
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return {
      errors: this.errorLog,
      warnings: this.warningLog,
      info: this.infoLog,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Trim logs to prevent memory issues
   */
  trimLogs() {
    if (this.errorLog.length > this.options.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.options.maxLogEntries);
    }
    if (this.warningLog.length > this.options.maxLogEntries) {
      this.warningLog = this.warningLog.slice(-this.options.maxLogEntries);
    }
    if (this.infoLog.length > this.options.maxLogEntries) {
      this.infoLog = this.infoLog.slice(-this.options.maxLogEntries);
    }
  }

  /**
   * Write to console if enabled
   */
  writeToConsole(level, logEntry) {
    if (!this.options.enableConsoleLogging) return;

    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;
    const messageLevel = levels[level] || 2;

    if (messageLevel <= currentLevel) {
      const message = `[CucumberReportViewer] ${logEntry.message}`;
      const contextStr = Object.keys(logEntry.context).length > 0 ? 
        `\nContext: ${JSON.stringify(logEntry.context, null, 2)}` : '';
      
      console[level] ? console[level](message + contextStr) : console.log(message + contextStr);
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogsToStorage() {
    if (!this.options.enableLocalStorage || typeof localStorage === 'undefined') return;

    try {
      const logsData = {
        errors: this.errorLog.slice(-100), // Keep last 100 of each type
        warnings: this.warningLog.slice(-100),
        info: this.infoLog.slice(-50),
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem(this.options.storageKey, JSON.stringify(logsData));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error.message);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogsFromStorage() {
    if (!this.options.enableLocalStorage || typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const logsData = JSON.parse(stored);
        this.errorLog = logsData.errors || [];
        this.warningLog = logsData.warnings || [];
        this.infoLog = logsData.info || [];
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error.message);
    }
  }
}

export default ErrorHandler;