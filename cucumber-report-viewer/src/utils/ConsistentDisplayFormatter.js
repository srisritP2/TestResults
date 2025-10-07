/**
 * Consistent Display Formatter
 * Ensures uniform styling and formatting across all features regardless of data quality
 */

import FailedScenarioDisplayHandler from './FailedScenarioDisplayHandler.js';
import ExecutionErrorFeatureHandler from './ExecutionErrorFeatureHandler.js';

class ConsistentDisplayFormatter {
  constructor() {
    this.displaySettings = {
      alignment: 'left',
      tagFormat: {
        removeBraces: true,
        separator: ' ',
        styling: {
          backgroundColor: '#e3f2fd',
          textColor: '#1976d2',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: '500'
        }
      },
      theme: 'light',
      compactMode: false
    };

    this.scenarioHandler = new FailedScenarioDisplayHandler();
    this.executionErrorHandler = new ExecutionErrorFeatureHandler();
    this.formattingCache = new Map();
  }

  /**
   * Format feature display with consistent styling regardless of data quality
   * @param {Object} feature - The feature object
   * @param {Object} metadata - Additional metadata about the feature
   * @returns {Object} - Formatted feature display object
   */
  formatFeatureDisplay(feature, metadata = {}) {
    const featureKey = this.getFeatureKey(feature);
    
    // Check cache first
    if (this.formattingCache.has(featureKey)) {
      return this.formattingCache.get(featureKey);
    }

    // Detect if this is an execution error feature
    const isExecutionError = this.executionErrorHandler.isExecutionErrorFeature(feature);
    
    // Validate scenarios and detect data issues
    const scenarioValidation = this.validateFeatureScenarios(feature);
    const hasDataIssues = scenarioValidation.hasIssues;

    const formattedFeature = {
      originalFeature: feature,
      name: this.formatFeatureName(feature, isExecutionError),
      description: this.formatDescription(feature.description),
      scenarios: this.formatScenarios(feature.elements || [], hasDataIssues),
      tags: this.formatTags(feature.tags || []),
      styling: this.getFeatureStyling(isExecutionError, hasDataIssues),
      metadata: {
        ...metadata,
        isExecutionError,
        hasDataIssues,
        scenarioCount: (feature.elements || []).length,
        validation: scenarioValidation
      },
      indicators: this.getFeatureIndicators(feature, isExecutionError, hasDataIssues),
      key: featureKey
    };

    // Handle execution error features specially
    if (isExecutionError) {
      const executionErrorData = this.executionErrorHandler.renderExecutionErrorFeature(feature);
      formattedFeature.executionError = executionErrorData;
      formattedFeature.isFrameworkError = true;
    }

    // Cache the result
    this.formattingCache.set(featureKey, formattedFeature);
    return formattedFeature;
  }

  /**
   * Format feature name with appropriate indicators
   * @param {Object} feature - The feature object
   * @param {boolean} isExecutionError - Whether this is an execution error
   * @returns {string} - Formatted feature name
   */
  formatFeatureName(feature, isExecutionError) {
    let name = feature.name || 'Unnamed Feature';

    if (isExecutionError) {
      return `⚠️ ${name}`;
    }

    // Clean up the name
    name = name.trim();
    
    // Handle empty names
    if (!name || name === 'Unnamed Feature') {
      if (feature.uri) {
        // Extract name from URI
        const uriParts = feature.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        if (fileName && fileName !== 'failure.feature') {
          name = fileName.replace(/\.(feature|js|ts)$/, '').replace(/[-_]/g, ' ');
          name = name.charAt(0).toUpperCase() + name.slice(1);
        }
      }
    }

    return name;
  }

  /**
   * Format feature description
   * @param {string} description - The feature description
   * @returns {string} - Formatted description
   */
  formatDescription(description) {
    if (!description || description.trim() === '') {
      return '';
    }

    return description.trim();
  }

  /**
   * Format scenarios with consistent handling of data issues
   * @param {Array} scenarios - Array of scenario objects
   * @param {boolean} hasDataIssues - Whether the feature has data issues
   * @returns {Array} - Array of formatted scenario objects
   */
  formatScenarios(scenarios, hasDataIssues) {
    return scenarios.map(scenario => {
      // Skip background scenarios
      if (scenario.type === 'background') {
        return {
          ...scenario,
          isBackground: true,
          formatted: true
        };
      }

      // Validate scenario data
      const validation = this.scenarioHandler.validateScenarioData(scenario);
      
      // Render scenario with issues handling
      const renderedScenario = this.scenarioHandler.renderScenarioWithIssues(scenario, validation);

      return {
        ...renderedScenario,
        name: renderedScenario.displayName,
        status: this.calculateScenarioStatus(scenario),
        steps: this.formatSteps(scenario.steps || []),
        tags: this.formatTags(scenario.tags || []),
        styling: this.getScenarioStyling(scenario, validation),
        formatted: true
      };
    });
  }

  /**
   * Format tags with consistent styling and brace removal
   * @param {Array} tags - Array of tag objects
   * @returns {Array} - Array of formatted tag objects
   */
  formatTags(tags) {
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags.map(tag => {
      let tagName = '';
      
      if (typeof tag === 'string') {
        tagName = tag;
      } else if (tag && tag.name) {
        tagName = tag.name;
      }

      // Remove curly braces and clean up
      if (this.displaySettings.tagFormat.removeBraces) {
        tagName = tagName.replace(/[{}]/g, '');
      }

      // Clean up whitespace and special characters
      tagName = tagName.trim().replace(/^@/, '');

      return {
        name: tagName,
        displayName: tagName,
        styling: this.displaySettings.tagFormat.styling,
        formatted: true
      };
    }).filter(tag => tag.name); // Remove empty tags
  }

  /**
   * Format steps with consistent styling
   * @param {Array} steps - Array of step objects
   * @returns {Array} - Array of formatted step objects
   */
  formatSteps(steps) {
    if (!Array.isArray(steps)) {
      return [];
    }

    return steps.map((step, index) => ({
      ...step,
      index: index,
      displayName: step.name || `Step ${index + 1}`,
      status: step.result ? step.result.status : 'unknown',
      styling: this.getStepStyling(step),
      formatted: true
    }));
  }

  /**
   * Get consistent styling for features
   * @param {boolean} isExecutionError - Whether this is an execution error
   * @param {boolean} hasDataIssues - Whether the feature has data issues
   * @returns {Object} - CSS styling object
   */
  getFeatureStyling(isExecutionError, hasDataIssues) {
    const baseStyle = {
      marginBottom: '16px',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    };

    if (isExecutionError) {
      return {
        ...baseStyle,
        borderLeft: '4px solid #f44336',
        backgroundColor: '#ffebee',
        border: '1px solid #ffcdd2'
      };
    }

    if (hasDataIssues) {
      return {
        ...baseStyle,
        borderLeft: '4px solid #ff9800',
        backgroundColor: '#fff3e0',
        border: '1px solid #ffcc02'
      };
    }

    return {
      ...baseStyle,
      borderLeft: '4px solid #4caf50',
      backgroundColor: '#f1f8e9',
      border: '1px solid #c8e6c9'
    };
  }

  /**
   * Get consistent styling for scenarios
   * @param {Object} scenario - The scenario object
   * @param {Object} validation - Validation result
   * @returns {Object} - CSS styling object
   */
  getScenarioStyling(scenario, validation) {
    const baseStyle = {
      textAlign: this.displaySettings.alignment,
      padding: this.displaySettings.compactMode ? '6px 12px' : '8px 16px',
      marginBottom: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    };

    // Apply data quality styling
    if (validation && !validation.isValid) {
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
        borderLeft: `2px solid ${borderColors[validation.severity] || borderColors.medium}`
      };
    }

    // Apply status-based styling
    const status = this.calculateScenarioStatus(scenario);
    const statusColors = {
      passed: '#4caf50',
      failed: '#f44336',
      skipped: '#ff9800',
      unknown: '#9e9e9e'
    };

    const backgroundColors = {
      passed: '#f1f8e9',
      failed: '#ffebee',
      skipped: '#fff3e0',
      unknown: '#f5f5f5'
    };

    return {
      ...baseStyle,
      backgroundColor: backgroundColors[status] || backgroundColors.unknown,
      borderLeft: `2px solid ${statusColors[status] || statusColors.unknown}`
    };
  }

  /**
   * Get styling for steps
   * @param {Object} step - The step object
   * @returns {Object} - CSS styling object
   */
  getStepStyling(step) {
    const status = step.result ? step.result.status : 'unknown';
    const statusColors = {
      passed: '#4caf50',
      failed: '#f44336',
      skipped: '#ff9800',
      unknown: '#9e9e9e'
    };

    return {
      padding: '4px 8px',
      marginBottom: '2px',
      borderLeft: `2px solid ${statusColors[status] || statusColors.unknown}`,
      backgroundColor: 'transparent',
      textAlign: this.displaySettings.alignment
    };
  }

  /**
   * Get indicators for features
   * @param {Object} feature - The feature object
   * @param {boolean} isExecutionError - Whether this is an execution error
   * @param {boolean} hasDataIssues - Whether the feature has data issues
   * @returns {Array} - Array of indicator objects
   */
  getFeatureIndicators(feature, isExecutionError, hasDataIssues) {
    const indicators = [];

    if (isExecutionError) {
      indicators.push({
        type: 'execution-error',
        icon: 'mdi-alert-circle',
        color: '#f44336',
        text: 'Framework Error',
        tooltip: 'This is a Cucumber framework execution error'
      });
    }

    if (hasDataIssues) {
      indicators.push({
        type: 'data-issues',
        icon: 'mdi-alert',
        color: '#ff9800',
        text: 'Data Issues',
        tooltip: 'This feature contains scenarios with data quality issues'
      });
    }

    // Add scenario count indicator
    const scenarioCount = (feature.elements || []).filter(el => el.type !== 'background').length;
    if (scenarioCount > 0) {
      indicators.push({
        type: 'scenario-count',
        icon: 'mdi-format-list-bulleted',
        color: '#2196f3',
        text: `${scenarioCount} scenario${scenarioCount > 1 ? 's' : ''}`,
        tooltip: `This feature contains ${scenarioCount} test scenario${scenarioCount > 1 ? 's' : ''}`
      });
    }

    return indicators;
  }

  /**
   * Calculate scenario status with enhanced logic
   * @param {Object} scenario - The scenario object
   * @returns {string} - Scenario status
   */
  calculateScenarioStatus(scenario) {
    // Check setup failures (before hooks)
    if (scenario.before && Array.isArray(scenario.before)) {
      const hasSetupFailure = scenario.before.some(hook => 
        hook.result && hook.result.status === 'failed'
      );
      if (hasSetupFailure) return 'failed';
    }

    // Check teardown failures (after hooks)
    if (scenario.after && Array.isArray(scenario.after)) {
      const hasTeardownFailure = scenario.after.some(hook => 
        hook.result && hook.result.status === 'failed'
      );
      if (hasTeardownFailure) return 'failed';
    }

    // Check step execution
    if (scenario.steps && Array.isArray(scenario.steps)) {
      const hasFailedSteps = scenario.steps.some(step => 
        step.result && step.result.status === 'failed'
      );
      const hasPassedSteps = scenario.steps.some(step => 
        step.result && step.result.status === 'passed'
      );
      const allSkipped = scenario.steps.every(step => 
        step.result && step.result.status === 'skipped'
      );

      if (hasFailedSteps) return 'failed';
      if (allSkipped) return 'skipped';
      if (hasPassedSteps) return 'passed';
    }

    // Fallback to scenario-level status
    if (scenario.status) return scenario.status;
    
    return 'unknown';
  }

  /**
   * Validate scenarios within a feature
   * @param {Object} feature - The feature object
   * @returns {Object} - Validation summary
   */
  validateFeatureScenarios(feature) {
    const scenarios = (feature.elements || []).filter(el => el.type !== 'background');
    let hasIssues = false;
    let totalIssues = 0;
    const issueTypes = new Set();

    scenarios.forEach(scenario => {
      const validation = this.scenarioHandler.validateScenarioData(scenario);
      if (!validation.isValid) {
        hasIssues = true;
        totalIssues += validation.issues.length;
        validation.issues.forEach(issue => issueTypes.add(issue.type));
      }
    });

    return {
      hasIssues,
      totalIssues,
      issueTypes: Array.from(issueTypes),
      scenarioCount: scenarios.length,
      issueRate: scenarios.length > 0 ? (totalIssues / scenarios.length * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Generate unique key for feature caching
   * @param {Object} feature - The feature object
   * @returns {string} - Unique feature key
   */
  getFeatureKey(feature) {
    return feature.uri || feature.id || `feature_${Date.now()}_${Math.random()}`;
  }

  /**
   * Update display settings
   * @param {Object} newSettings - New display settings
   */
  updateDisplaySettings(newSettings) {
    this.displaySettings = { ...this.displaySettings, ...newSettings };
    this.clearCache(); // Clear cache when settings change
  }

  /**
   * Clear formatting cache
   */
  clearCache() {
    this.formattingCache.clear();
    this.scenarioHandler.clearCache();
    this.executionErrorHandler.clearCache();
  }

  /**
   * Get formatting statistics
   * @returns {Object} - Formatting statistics
   */
  getStatistics() {
    return {
      cachedFeatures: this.formattingCache.size,
      scenarioHandlerStats: this.scenarioHandler.getStatistics(),
      executionErrorStats: this.executionErrorHandler.getStatistics(),
      displaySettings: this.displaySettings
    };
  }
}

export default ConsistentDisplayFormatter;