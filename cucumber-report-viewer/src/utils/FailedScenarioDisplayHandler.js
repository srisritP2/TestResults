/**
 * Failed Scenario Display Handler
 * Handles scenarios with empty names, malformed data, and data integrity issues
 */

class FailedScenarioDisplayHandler {
  constructor() {
    this.placeholderNames = new Map();
    this.dataIssueFlags = new Set();
  }

  /**
   * Generate meaningful names for empty or null scenario names
   * @param {Object} scenario - The scenario object
   * @returns {string} - Normalized scenario name
   */
  normalizeScenarioName(scenario) {
    // Return existing name if valid
    if (scenario.name && scenario.name.trim() !== '') {
      return scenario.name.trim();
    }

    // Generate placeholder name for empty/null names
    return this.generatePlaceholderName(scenario);
  }

  /**
   * Create descriptive placeholder based on available data
   * @param {Object} scenario - The scenario object
   * @returns {string} - Generated placeholder name
   */
  generatePlaceholderName(scenario) {
    // Use cached placeholder if already generated
    const scenarioKey = this.getScenarioKey(scenario);
    if (this.placeholderNames.has(scenarioKey)) {
      return this.placeholderNames.get(scenarioKey);
    }

    let placeholderName = 'Unnamed Scenario';

    // Try to extract meaningful info from scenario ID
    if (scenario.id) {
      const idParts = scenario.id.split(';');
      const lastPart = idParts[idParts.length - 1];
      if (lastPart && lastPart !== 'unknown') {
        // Convert kebab-case or snake_case to readable format
        const readableName = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        placeholderName = `${readableName} (Unnamed)`;
      }
    }

    // Fallback to step count if available
    if (placeholderName === 'Unnamed Scenario' && scenario.steps && scenario.steps.length > 0) {
      placeholderName = `Scenario with ${scenario.steps.length} step${scenario.steps.length > 1 ? 's' : ''}`;
    }

    // Cache the generated name
    this.placeholderNames.set(scenarioKey, placeholderName);
    return placeholderName;
  }

  /**
   * Validate scenario data and identify issues
   * @param {Object} scenario - The scenario object
   * @returns {Object} - Validation result with issues and severity
   */
  validateScenarioData(scenario) {
    const issues = [];
    const scenarioKey = this.getScenarioKey(scenario);

    // Check for empty or null name
    if (!scenario.name || scenario.name.trim() === '') {
      issues.push({
        type: 'empty_name',
        message: 'Scenario has empty or null name',
        severity: 'warning',
        suggestion: 'Add a meaningful name to the scenario in your feature file'
      });
    }

    // Check for missing steps
    if (!scenario.steps || scenario.steps.length === 0) {
      issues.push({
        type: 'no_steps',
        message: 'Scenario has no steps',
        severity: 'high',
        suggestion: 'Add test steps to the scenario'
      });
    }

    // Check for steps without results
    if (scenario.steps && scenario.steps.some(step => !step.result)) {
      issues.push({
        type: 'missing_results',
        message: 'Some steps are missing execution results',
        severity: 'medium',
        suggestion: 'Ensure all steps are executed during test run'
      });
    }

    // Check for IllegalArgumentException errors
    if (scenario.steps && scenario.steps.some(step => 
      step.result && step.result.error_message && 
      step.result.error_message.includes('IllegalArgumentException')
    )) {
      issues.push({
        type: 'illegal_argument_exception',
        message: 'Scenario contains IllegalArgumentException errors',
        severity: 'high',
        suggestion: 'Check test configuration and ensure all required parameters are provided'
      });
    }

    // Check for "Test name must not be null or empty" errors
    if (scenario.steps && scenario.steps.some(step => 
      step.result && step.result.error_message && 
      step.result.error_message.includes('Test name must not be null or empty')
    )) {
      issues.push({
        type: 'null_test_name_error',
        message: 'Framework error: Test name must not be null or empty',
        severity: 'critical',
        suggestion: 'Ensure all scenarios have meaningful names in your feature files'
      });
    }

    // Determine overall severity
    const severityLevels = { low: 1, medium: 2, warning: 2, high: 3, critical: 4 };
    const maxSeverity = issues.reduce((max, issue) => {
      const level = severityLevels[issue.severity] || 1;
      return level > max ? level : max;
    }, 0);

    const severityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    const overallSeverity = severityMap[maxSeverity] || 'low';

    // Cache data issues flag
    if (issues.length > 0) {
      this.dataIssueFlags.add(scenarioKey);
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      severity: overallSeverity,
      hasDataIssues: issues.length > 0
    };
  }

  /**
   * Render scenario with data quality indicators
   * @param {Object} scenario - The scenario object
   * @param {Object} validation - Validation result
   * @returns {Object} - Rendered scenario with styling and indicators
   */
  renderScenarioWithIssues(scenario, validation) {
    const normalizedName = this.normalizeScenarioName(scenario);
    const scenarioKey = this.getScenarioKey(scenario);

    return {
      originalScenario: scenario,
      displayName: normalizedName,
      hasPlaceholderName: !scenario.name || scenario.name.trim() === '',
      validation: validation,
      dataQuality: {
        hasIssues: validation.hasDataIssues,
        severity: validation.severity,
        issueCount: validation.issues.length,
        issues: validation.issues
      },
      styling: this.getScenarioStyling(scenario, validation),
      indicators: this.getDataQualityIndicators(validation),
      tooltips: this.generateTooltips(validation),
      key: scenarioKey
    };
  }

  /**
   * Get styling for scenario based on validation results
   * @param {Object} scenario - The scenario object
   * @param {Object} validation - Validation result
   * @returns {Object} - CSS styling object
   */
  getScenarioStyling(scenario, validation) {
    const baseStyle = {
      textAlign: 'left',
      padding: '8px 16px',
      marginBottom: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    };

    // Apply styling based on data quality
    if (validation.hasDataIssues) {
      const severityColors = {
        low: '#fff3e0',
        medium: '#fff8e1',
        warning: '#fff8e1',
        high: '#ffecb3',
        critical: '#ffcdd2'
      };

      const borderColors = {
        low: '#ff9800',
        medium: '#ff9800',
        warning: '#ff9800',
        high: '#f57c00',
        critical: '#f44336'
      };

      return {
        ...baseStyle,
        backgroundColor: severityColors[validation.severity] || severityColors.medium,
        borderLeft: `3px solid ${borderColors[validation.severity] || borderColors.medium}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      };
    }

    // Default styling for scenarios without issues
    return {
      ...baseStyle,
      backgroundColor: '#f9f9f9',
      borderLeft: '3px solid #e0e0e0'
    };
  }

  /**
   * Get data quality indicators for display
   * @param {Object} validation - Validation result
   * @returns {Array} - Array of indicator objects
   */
  getDataQualityIndicators(validation) {
    const indicators = [];

    if (!validation.hasDataIssues) {
      return indicators;
    }

    // Add severity indicator
    const severityIcons = {
      low: 'mdi-information',
      medium: 'mdi-alert',
      warning: 'mdi-alert',
      high: 'mdi-alert-circle',
      critical: 'mdi-alert-octagon'
    };

    const severityColors = {
      low: '#2196f3',
      medium: '#ff9800',
      warning: '#ff9800',
      high: '#f57c00',
      critical: '#f44336'
    };

    indicators.push({
      type: 'severity',
      icon: severityIcons[validation.severity] || 'mdi-alert',
      color: severityColors[validation.severity] || '#ff9800',
      text: `${validation.severity.toUpperCase()} - ${validation.issues.length} issue${validation.issues.length > 1 ? 's' : ''}`,
      tooltip: `Data quality issues detected (${validation.severity} severity)`
    });

    // Add specific issue indicators
    validation.issues.forEach(issue => {
      const issueIcons = {
        empty_name: 'mdi-tag-off',
        no_steps: 'mdi-format-list-bulleted-square',
        missing_results: 'mdi-help-circle',
        illegal_argument_exception: 'mdi-bug',
        null_test_name_error: 'mdi-alert-circle'
      };

      indicators.push({
        type: 'issue',
        icon: issueIcons[issue.type] || 'mdi-alert',
        color: severityColors[issue.severity] || '#ff9800',
        text: issue.message,
        tooltip: issue.suggestion || 'Data quality issue detected'
      });
    });

    return indicators;
  }

  /**
   * Generate tooltips for data quality issues
   * @param {Object} validation - Validation result
   * @returns {Object} - Tooltip configuration
   */
  generateTooltips(validation) {
    if (!validation.hasDataIssues) {
      return null;
    }

    const tooltips = {
      summary: `${validation.issues.length} data quality issue${validation.issues.length > 1 ? 's' : ''} detected`,
      issues: validation.issues.map(issue => ({
        type: issue.type,
        message: issue.message,
        suggestion: issue.suggestion,
        severity: issue.severity
      })),
      actions: []
    };

    // Add actionable suggestions
    if (validation.issues.some(issue => issue.type === 'empty_name')) {
      tooltips.actions.push({
        text: 'Add scenario names to feature files',
        icon: 'mdi-pencil'
      });
    }

    if (validation.issues.some(issue => issue.type === 'illegal_argument_exception')) {
      tooltips.actions.push({
        text: 'Check test configuration',
        icon: 'mdi-cog'
      });
    }

    return tooltips;
  }

  /**
   * Generate unique key for scenario caching
   * @param {Object} scenario - The scenario object
   * @returns {string} - Unique scenario key
   */
  getScenarioKey(scenario) {
    // Use scenario ID if available
    if (scenario.id) {
      return scenario.id;
    }

    // Fallback to hash of scenario properties
    const keyData = {
      name: scenario.name || '',
      line: scenario.line || 0,
      stepCount: scenario.steps ? scenario.steps.length : 0
    };

    return `scenario_${JSON.stringify(keyData).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.placeholderNames.clear();
    this.dataIssueFlags.clear();
  }

  /**
   * Get statistics about processed scenarios
   * @returns {Object} - Processing statistics
   */
  getStatistics() {
    return {
      totalProcessed: this.placeholderNames.size,
      scenariosWithIssues: this.dataIssueFlags.size,
      placeholderNamesGenerated: this.placeholderNames.size,
      issueRate: this.placeholderNames.size > 0 ? 
        (this.dataIssueFlags.size / this.placeholderNames.size * 100).toFixed(2) + '%' : '0%'
    };
  }
}

export default FailedScenarioDisplayHandler;