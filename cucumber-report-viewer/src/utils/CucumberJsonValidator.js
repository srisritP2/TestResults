/**
 * Enhanced Cucumber JSON Validator
 * Provides comprehensive validation and sanitization for Cucumber JSON reports
 */

class CucumberJsonValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      generatePlaceholders: options.generatePlaceholders !== false,
      maxErrors: options.maxErrors || 100,
      logLevel: options.logLevel || 'warn'
    };
    
    this.validationErrors = [];
    this.validationWarnings = [];
    this.processedEntries = 0;
    this.skippedEntries = 0;
  }

  /**
   * Validate complete Cucumber JSON report
   */
  validateReport(json, filename = 'unknown') {
    this.reset();
    
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: null,
      originalEntryCount: 0,
      processedEntryCount: 0,
      skippedEntries: []
    };

    try {
      // Basic structure validation
      if (!this.validateBasicStructure(json)) {
        result.isValid = false;
        result.errors = this.validationErrors;
        return result;
      }

      // Count original entries
      result.originalEntryCount = this.countOriginalEntries(json);

      // Sanitize and validate each feature
      const sanitizedFeatures = [];
      
      json.forEach((feature, featureIndex) => {
        try {
          const sanitizedFeature = this.sanitizeFeature(feature, featureIndex, filename);
          if (sanitizedFeature) {
            sanitizedFeatures.push(sanitizedFeature);
            this.processedEntries++;
          } else {
            this.skippedEntries++;
            result.skippedEntries.push({
              type: 'feature',
              index: featureIndex,
              reason: 'Failed sanitization'
            });
          }
        } catch (error) {
          this.addError(`Feature ${featureIndex}`, error.message, { featureIndex, filename });
          this.skippedEntries++;
          result.skippedEntries.push({
            type: 'feature',
            index: featureIndex,
            reason: error.message
          });
        }
      });

      result.sanitizedData = sanitizedFeatures;
      result.processedEntryCount = this.processedEntries;
      result.errors = this.validationErrors;
      result.warnings = this.validationWarnings;
      result.isValid = this.validationErrors.length === 0;

      this.log(`Validation complete for ${filename}: ${result.processedEntryCount}/${result.originalEntryCount} entries processed`);

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'critical',
        message: `Critical validation error: ${error.message}`,
        context: { filename }
      });
    }

    return result;
  }

  /**
   * Validate basic JSON structure
   */
  validateBasicStructure(json) {
    if (!Array.isArray(json)) {
      this.addError('Root', 'Cucumber JSON must be an array of features', { expectedType: 'array', actualType: typeof json });
      return false;
    }

    if (json.length === 0) {
      this.addWarning('Root', 'Empty features array', {});
      return true;
    }

    return true;
  }

  /**
   * Count original entries for statistics
   */
  countOriginalEntries(json) {
    let count = 0;
    if (Array.isArray(json)) {
      json.forEach(feature => {
        count++; // Feature count
        if (feature.elements && Array.isArray(feature.elements)) {
          count += feature.elements.length; // Scenario count
        }
      });
    }
    return count;
  }

  /**
   * Sanitize and validate a feature
   */
  sanitizeFeature(feature, featureIndex, filename) {
    if (!feature || typeof feature !== 'object') {
      this.addError(`Feature ${featureIndex}`, 'Feature must be an object', { featureIndex, filename });
      return null;
    }

    const sanitizedFeature = {
      ...feature,
      name: this.sanitizeTestName(feature.name, `Feature ${featureIndex}`, 'feature'),
      elements: []
    };

    // Validate and sanitize elements/scenarios
    const elements = feature.elements || feature.scenarios || [];
    if (Array.isArray(elements)) {
      elements.forEach((element, elementIndex) => {
        try {
          const sanitizedElement = this.sanitizeScenario(element, featureIndex, elementIndex, filename);
          if (sanitizedElement) {
            sanitizedFeature.elements.push(sanitizedElement);
          } else {
            this.skippedEntries++;
          }
        } catch (error) {
          this.addError(`Feature ${featureIndex}, Scenario ${elementIndex}`, error.message, { featureIndex, elementIndex, filename });
        }
      });
    }

    return sanitizedFeature;
  }

  /**
   * Sanitize and validate a scenario
   */
  sanitizeScenario(scenario, featureIndex, scenarioIndex, filename) {
    if (!scenario || typeof scenario !== 'object') {
      this.addError(`Feature ${featureIndex}, Scenario ${scenarioIndex}`, 'Scenario must be an object', { featureIndex, scenarioIndex, filename });
      return null;
    }

    const sanitizedScenario = {
      ...scenario,
      name: this.sanitizeTestName(scenario.name, `Scenario ${scenarioIndex}`, 'scenario'),
      id: scenario.id || this.generateId(scenario.name, featureIndex, scenarioIndex),
      type: scenario.type || 'scenario'
    };

    // Validate and sanitize steps
    if (scenario.steps && Array.isArray(scenario.steps)) {
      sanitizedScenario.steps = scenario.steps.map((step, stepIndex) => {
        return this.sanitizeStep(step, featureIndex, scenarioIndex, stepIndex, filename);
      }).filter(step => step !== null);
    }

    // Validate and sanitize hooks
    if (scenario.before && Array.isArray(scenario.before)) {
      sanitizedScenario.before = scenario.before.map(hook => this.sanitizeHook(hook, 'before'));
    }

    if (scenario.after && Array.isArray(scenario.after)) {
      sanitizedScenario.after = scenario.after.map(hook => this.sanitizeHook(hook, 'after'));
    }

    return sanitizedScenario;
  }

  /**
   * Sanitize and validate a step
   */
  sanitizeStep(step, featureIndex, scenarioIndex, stepIndex, filename) {
    if (!step || typeof step !== 'object') {
      this.addError(`Feature ${featureIndex}, Scenario ${scenarioIndex}, Step ${stepIndex}`, 'Step must be an object', { featureIndex, scenarioIndex, stepIndex, filename });
      return null;
    }

    const sanitizedStep = {
      ...step,
      name: this.sanitizeTestName(step.name, `Step ${stepIndex}`, 'step'),
      keyword: step.keyword || 'Given '
    };

    // Ensure step has result
    if (!step.result && !step.status) {
      this.addWarning(`Feature ${featureIndex}, Scenario ${scenarioIndex}, Step ${stepIndex}`, 'Step missing result/status, defaulting to unknown', { featureIndex, scenarioIndex, stepIndex });
      sanitizedStep.result = { status: 'unknown', duration: 0 };
    }

    return sanitizedStep;
  }

  /**
   * Sanitize hook data
   */
  sanitizeHook(hook, type) {
    if (!hook || typeof hook !== 'object') {
      return { result: { status: 'unknown', duration: 0 }, match: { location: `unknown ${type} hook` } };
    }

    return {
      ...hook,
      result: hook.result || { status: 'unknown', duration: 0 },
      match: hook.match || { location: `${type} hook` }
    };
  }

  /**
   * Sanitize test names, handling null/empty values
   */
  sanitizeTestName(name, fallback, type) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      if (this.options.generatePlaceholders) {
        const placeholder = `${fallback} (auto-generated)`;
        this.addWarning('Name Sanitization', `Empty ${type} name replaced with placeholder: ${placeholder}`, { originalName: name, placeholder });
        return placeholder;
      } else {
        this.addError('Name Sanitization', `${type} name is null or empty`, { originalName: name });
        return fallback;
      }
    }

    return name.trim();
  }

  /**
   * Generate unique ID for scenarios
   */
  generateId(name, featureIndex, scenarioIndex) {
    const baseName = name || `scenario-${scenarioIndex}`;
    return `feature-${featureIndex}-${baseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${scenarioIndex}`;
  }

  /**
   * Handle malformed entries with recovery
   */
  handleMalformedEntry(entry, context) {
    const recovery = {
      recovered: false,
      sanitizedEntry: null,
      errors: []
    };

    try {
      if (!entry) {
        recovery.errors.push('Entry is null or undefined');
        return recovery;
      }

      if (typeof entry !== 'object') {
        recovery.errors.push(`Entry is not an object: ${typeof entry}`);
        return recovery;
      }

      // Attempt basic recovery
      const sanitized = { ...entry };

      // Fix common issues
      if (!sanitized.name) {
        sanitized.name = context.fallbackName || 'Recovered Entry';
      }

      if (!sanitized.id) {
        sanitized.id = this.generateId(sanitized.name, context.featureIndex || 0, context.scenarioIndex || 0);
      }

      recovery.recovered = true;
      recovery.sanitizedEntry = sanitized;

    } catch (error) {
      recovery.errors.push(`Recovery failed: ${error.message}`);
    }

    return recovery;
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    return {
      summary: {
        totalErrors: this.validationErrors.length,
        totalWarnings: this.validationWarnings.length,
        processedEntries: this.processedEntries,
        skippedEntries: this.skippedEntries,
        successRate: this.processedEntries > 0 ? ((this.processedEntries / (this.processedEntries + this.skippedEntries)) * 100).toFixed(2) : 0
      },
      errors: this.validationErrors,
      warnings: this.validationWarnings,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.validationErrors.length > 0) {
      recommendations.push('Fix critical validation errors before processing reports');
    }

    if (this.validationWarnings.length > 5) {
      recommendations.push('Consider improving test data quality to reduce warnings');
    }

    if (this.skippedEntries > this.processedEntries * 0.1) {
      recommendations.push('High number of skipped entries detected - review test execution');
    }

    return recommendations;
  }

  /**
   * Add validation error
   */
  addError(location, message, context = {}) {
    if (this.validationErrors.length >= this.options.maxErrors) {
      return;
    }

    this.validationErrors.push({
      type: 'error',
      location,
      message,
      context,
      timestamp: new Date().toISOString()
    });

    this.log(`ERROR [${location}]: ${message}`, 'error');
  }

  /**
   * Add validation warning
   */
  addWarning(location, message, context = {}) {
    this.validationWarnings.push({
      type: 'warning',
      location,
      message,
      context,
      timestamp: new Date().toISOString()
    });

    this.log(`WARN [${location}]: ${message}`, 'warn');
  }

  /**
   * Reset validation state
   */
  reset() {
    this.validationErrors = [];
    this.validationWarnings = [];
    this.processedEntries = 0;
    this.skippedEntries = 0;
  }

  /**
   * Logging utility
   */
  log(message, level = 'info') {
    if (this.options.logLevel === 'none') return;

    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.options.logLevel] || 2;
    const messageLevel = levels[level] || 2;

    if (messageLevel <= currentLevel) {
      console[level] ? console[level](`[CucumberJsonValidator] ${message}`) : console.log(`[CucumberJsonValidator] ${message}`);
    }
  }
}

export default CucumberJsonValidator;