<template>
  <v-card class="debug-panel" variant="outlined">
    <v-card-title class="debug-header">
      <v-icon color="info" class="mr-2">mdi-bug</v-icon>
      Debug & Diagnostics
      <v-spacer></v-spacer>
      <v-btn
        @click="togglePanel"
        :icon="panelExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        size="small"
      />
    </v-card-title>

    <v-expand-transition>
      <div v-if="panelExpanded" class="debug-content">
        <v-card-text>
          <!-- Quick Actions -->
          <div class="debug-section">
            <h4 class="debug-section-title">Quick Actions</h4>
            <div class="debug-actions">
              <v-btn
                @click="runDiagnostics"
                :loading="diagnosticsRunning"
                color="primary"
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
              >
                <v-icon size="16" class="mr-1">mdi-stethoscope</v-icon>
                Run Diagnostics
              </v-btn>
              
              <v-btn
                @click="compareWithIde"
                :disabled="!ideOutput"
                color="secondary"
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
              >
                <v-icon size="16" class="mr-1">mdi-compare</v-icon>
                Compare with IDE
              </v-btn>
              
              <v-btn
                @click="exportDebugData"
                color="info"
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
              >
                <v-icon size="16" class="mr-1">mdi-download</v-icon>
                Export Debug Data
              </v-btn>
              
              <v-btn
                @click="clearDebugData"
                color="warning"
                variant="outlined"
                size="small"
                class="mb-2"
              >
                <v-icon size="16" class="mr-1">mdi-delete-sweep</v-icon>
                Clear Debug Data
              </v-btn>
            </div>
          </div>

          <!-- IDE Output Input -->
          <div class="debug-section">
            <h4 class="debug-section-title">IDE Output Comparison</h4>
            <v-textarea
              v-model="ideOutputText"
              label="Paste IDE test execution output here"
              placeholder="Tests run: 52, Failures: 2, Errors: 0, Skipped: 0..."
              rows="3"
              variant="outlined"
              density="compact"
              @input="parseIdeOutput"
            />
            <div v-if="ideOutput" class="ide-parsed-output">
              <v-chip size="small" color="info" class="mr-1">
                Tests: {{ ideOutput.scenarios || 0 }}
              </v-chip>
              <v-chip size="small" color="success" class="mr-1">
                Passed: {{ ideOutput.passed || 0 }}
              </v-chip>
              <v-chip size="small" color="error" class="mr-1">
                Failed: {{ ideOutput.failed || 0 }}
              </v-chip>
              <v-chip size="small" color="warning" class="mr-1">
                Skipped: {{ ideOutput.skipped || 0 }}
              </v-chip>
            </div>
          </div>

          <!-- Diagnostic Results -->
          <div v-if="diagnosticResults" class="debug-section">
            <h4 class="debug-section-title">Diagnostic Results</h4>
            
            <!-- Overall Health -->
            <div class="health-indicator mb-3">
              <v-chip
                :color="getHealthColor(diagnosticResults.summary.overallHealth)"
                size="large"
                variant="flat"
              >
                <v-icon size="16" class="mr-1">
                  {{ getHealthIcon(diagnosticResults.summary.overallHealth) }}
                </v-icon>
                {{ diagnosticResults.summary.overallHealth.toUpperCase() }}
              </v-chip>
              <span class="ml-2 text-caption">
                Processing time: {{ diagnosticResults.summary.processingTime }}ms
              </span>
            </div>

            <!-- Status Analysis -->
            <v-expansion-panels v-if="diagnosticResults.statusAnalysis" class="mb-3">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon color="info" class="mr-2">mdi-chart-pie</v-icon>
                  Status Analysis
                  <template #actions>
                    <v-chip size="small" color="primary">
                      {{ diagnosticResults.statusAnalysis.totalScenarios }} scenarios
                    </v-chip>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="status-breakdown">
                    <div class="status-row" v-for="(count, status) in diagnosticResults.statusAnalysis.statusBreakdown" :key="status">
                      <span class="status-label">{{ status }}:</span>
                      <span class="status-count">{{ count }}</span>
                      <v-progress-linear
                        :model-value="(count / diagnosticResults.statusAnalysis.totalScenarios) * 100"
                        :color="getStatusColor(status)"
                        height="4"
                        class="ml-2"
                        style="flex: 1"
                      />
                    </div>
                  </div>
                  
                  <div v-if="diagnosticResults.statusAnalysis.setupFailures > 0" class="mt-3">
                    <v-alert type="warning" density="compact">
                      <strong>{{ diagnosticResults.statusAnalysis.setupFailures }}</strong> setup failures detected
                    </v-alert>
                  </div>
                  
                  <div v-if="diagnosticResults.statusAnalysis.teardownFailures > 0" class="mt-2">
                    <v-alert type="warning" density="compact">
                      <strong>{{ diagnosticResults.statusAnalysis.teardownFailures }}</strong> teardown failures detected
                    </v-alert>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Integrity Check -->
            <v-expansion-panels v-if="diagnosticResults.integrityCheck" class="mb-3">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon color="warning" class="mr-2">mdi-shield-check</v-icon>
                  Data Integrity
                  <template #actions>
                    <v-chip 
                      size="small" 
                      :color="getHealthColor(diagnosticResults.integrityCheck.overallStatus)"
                    >
                      {{ diagnosticResults.integrityCheck.overallStatus }}
                    </v-chip>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="integrity-summary">
                    <div class="integrity-stat">
                      <span class="stat-label">Total Issues:</span>
                      <span class="stat-value">{{ diagnosticResults.integrityCheck.summary.totalIssues }}</span>
                    </div>
                    <div class="integrity-stat">
                      <span class="stat-label">Critical:</span>
                      <span class="stat-value text-error">{{ diagnosticResults.integrityCheck.summary.criticalIssues }}</span>
                    </div>
                    <div class="integrity-stat">
                      <span class="stat-label">Warnings:</span>
                      <span class="stat-value text-warning">{{ diagnosticResults.integrityCheck.summary.warnings }}</span>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Recommendations -->
            <div v-if="diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0" class="recommendations">
              <h5 class="text-subtitle-2 mb-2">Recommendations</h5>
              <v-alert
                v-for="(rec, index) in diagnosticResults.recommendations.slice(0, 3)"
                :key="index"
                :type="rec.priority === 'critical' ? 'error' : rec.priority === 'high' ? 'warning' : 'info'"
                density="compact"
                class="mb-2"
              >
                <strong>{{ rec.message }}</strong>
                <div class="text-caption mt-1">{{ rec.action }}</div>
              </v-alert>
            </div>
          </div>

          <!-- Comparison Results -->
          <div v-if="comparisonResults" class="debug-section">
            <h4 class="debug-section-title">IDE Comparison Results</h4>
            
            <div class="comparison-confidence mb-3">
              <v-chip
                :color="getConfidenceColor(comparisonResults.confidence)"
                size="large"
                variant="flat"
              >
                <v-icon size="16" class="mr-1">mdi-target</v-icon>
                {{ comparisonResults.confidence.toUpperCase() }} Confidence
              </v-chip>
            </div>

            <!-- Matches -->
            <div v-if="Object.keys(comparisonResults.matches).length > 0" class="matches mb-3">
              <h5 class="text-subtitle-2 mb-2">Matches</h5>
              <v-chip
                v-for="(match, metric) in comparisonResults.matches"
                :key="metric"
                size="small"
                color="success"
                class="mr-1 mb-1"
              >
                {{ metric }}: {{ match.value }}
              </v-chip>
            </div>

            <!-- Discrepancies -->
            <div v-if="comparisonResults.discrepancies.length > 0" class="discrepancies">
              <h5 class="text-subtitle-2 mb-2">Discrepancies</h5>
              <v-alert
                v-for="(disc, index) in comparisonResults.discrepancies"
                :key="index"
                :type="disc.severity === 'high' ? 'error' : disc.severity === 'medium' ? 'warning' : 'info'"
                density="compact"
                class="mb-2"
              >
                <strong>{{ disc.metric }}:</strong>
                IDE: {{ disc.ideValue }}, Parsed: {{ disc.parsedValue }}
                ({{ disc.difference > 0 ? '+' : '' }}{{ disc.difference }})
              </v-alert>
            </div>

            <!-- Analysis -->
            <div v-if="comparisonResults.analysis" class="analysis mt-3">
              <h5 class="text-subtitle-2 mb-2">Analysis</h5>
              <div v-if="comparisonResults.analysis.possibleCauses.length > 0">
                <h6 class="text-caption mb-1">Possible Causes:</h6>
                <ul class="text-caption">
                  <li v-for="cause in comparisonResults.analysis.possibleCauses" :key="cause">
                    {{ cause }}
                  </li>
                </ul>
              </div>
              <div v-if="comparisonResults.analysis.recommendations.length > 0" class="mt-2">
                <h6 class="text-caption mb-1">Recommendations:</h6>
                <ul class="text-caption">
                  <li v-for="rec in comparisonResults.analysis.recommendations" :key="rec">
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Debug Info -->
          <div v-if="debugInfo" class="debug-section">
            <h4 class="debug-section-title">Debug Information</h4>
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon color="grey" class="mr-2">mdi-information</v-icon>
                  Technical Details
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <pre class="debug-json">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script>
import DiagnosticTools from '@/utils/DiagnosticTools';

export default {
  name: 'DebugPanel',
  props: {
    reportData: {
      type: [Array, Object],
      default: null
    },
    originalJson: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      panelExpanded: false,
      diagnosticsRunning: false,
      ideOutputText: '',
      ideOutput: null,
      diagnosticResults: null,
      comparisonResults: null,
      debugInfo: null,
      diagnosticTools: new DiagnosticTools()
    };
  },
  methods: {
    togglePanel() {
      this.panelExpanded = !this.panelExpanded;
    },

    async runDiagnostics() {
      if (!this.reportData) {
        this.$emit('show-message', 'No report data available for diagnostics', 'warning');
        return;
      }

      this.diagnosticsRunning = true;
      
      try {
        this.diagnosticResults = this.diagnosticTools.generateDiagnosticReport(
          this.reportData,
          this.originalJson,
          this.ideOutput
        );

        this.debugInfo = this.diagnosticResults.debugInfo;

        this.$emit('show-message', 'Diagnostics completed successfully', 'success');
      } catch (error) {
        console.error('Diagnostics failed:', error);
        this.$emit('show-message', `Diagnostics failed: ${error.message}`, 'error');
      } finally {
        this.diagnosticsRunning = false;
      }
    },

    compareWithIde() {
      if (!this.ideOutput || !this.reportData) {
        this.$emit('show-message', 'IDE output and report data required for comparison', 'warning');
        return;
      }

      try {
        this.comparisonResults = this.diagnosticTools.compareWithIdeOutput(
          this.reportData,
          this.ideOutput
        );

        this.$emit('show-message', 'IDE comparison completed', 'success');
      } catch (error) {
        console.error('IDE comparison failed:', error);
        this.$emit('show-message', `IDE comparison failed: ${error.message}`, 'error');
      }
    },

    parseIdeOutput() {
      if (!this.ideOutputText.trim()) {
        this.ideOutput = null;
        return;
      }

      try {
        // Parse common IDE output formats
        const text = this.ideOutputText;
        
        // Pattern: "Tests run: 52, Failures: 2, Errors: 0, Skipped: 0"
        const pattern1 = /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/i;
        const match1 = text.match(pattern1);
        
        if (match1) {
          this.ideOutput = {
            scenarios: parseInt(match1[1]),
            failed: parseInt(match1[2]),
            errors: parseInt(match1[3]),
            skipped: parseInt(match1[4]),
            passed: parseInt(match1[1]) - parseInt(match1[2]) - parseInt(match1[3]) - parseInt(match1[4])
          };
          return;
        }

        // Pattern: "52 tests, 2 failures, 0 skipped"
        const pattern2 = /(\d+)\s+tests?,\s*(\d+)\s+failures?,\s*(\d+)\s+skipped?/i;
        const match2 = text.match(pattern2);
        
        if (match2) {
          const total = parseInt(match2[1]);
          const failed = parseInt(match2[2]);
          const skipped = parseInt(match2[3]);
          
          this.ideOutput = {
            scenarios: total,
            failed: failed,
            skipped: skipped,
            passed: total - failed - skipped,
            errors: 0
          };
          return;
        }

        // If no pattern matches, try to extract numbers
        const numbers = text.match(/\d+/g);
        if (numbers && numbers.length >= 3) {
          this.ideOutput = {
            scenarios: parseInt(numbers[0]),
            failed: parseInt(numbers[1]),
            skipped: parseInt(numbers[2]) || 0,
            passed: parseInt(numbers[0]) - parseInt(numbers[1]) - (parseInt(numbers[2]) || 0),
            errors: 0
          };
        }
      } catch (error) {
        console.error('Failed to parse IDE output:', error);
        this.ideOutput = null;
      }
    },

    exportDebugData() {
      const debugData = {
        timestamp: new Date().toISOString(),
        diagnosticResults: this.diagnosticResults,
        comparisonResults: this.comparisonResults,
        debugInfo: this.debugInfo,
        ideOutput: this.ideOutput,
        reportDataSummary: this.reportData ? {
          type: Array.isArray(this.reportData) ? 'array' : typeof this.reportData,
          length: Array.isArray(this.reportData) ? this.reportData.length : 0,
          hasValidation: this.reportData._validation ? true : false,
          hasIntegrity: this.reportData._integrity ? true : false
        } : null
      };

      const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.$emit('show-message', 'Debug data exported successfully', 'success');
    },

    clearDebugData() {
      this.diagnosticResults = null;
      this.comparisonResults = null;
      this.debugInfo = null;
      this.ideOutputText = '';
      this.ideOutput = null;

      this.$emit('show-message', 'Debug data cleared', 'info');
    },

    getHealthColor(health) {
      const colors = {
        good: 'success',
        fair: 'info',
        poor: 'warning',
        critical: 'error',
        error: 'error',
        unknown: 'grey'
      };
      return colors[health] || 'grey';
    },

    getHealthIcon(health) {
      const icons = {
        good: 'mdi-check-circle',
        fair: 'mdi-information',
        poor: 'mdi-alert-triangle',
        critical: 'mdi-alert-octagon',
        error: 'mdi-close-circle',
        unknown: 'mdi-help-circle'
      };
      return icons[health] || 'mdi-help-circle';
    },

    getStatusColor(status) {
      const colors = {
        passed: 'success',
        failed: 'error',
        skipped: 'warning',
        errors: 'error',
        unknown: 'grey'
      };
      return colors[status] || 'grey';
    },

    getConfidenceColor(confidence) {
      const colors = {
        high: 'success',
        medium: 'warning',
        low: 'error',
        error: 'error'
      };
      return colors[confidence] || 'grey';
    }
  }
};
</script>

<style scoped>
.debug-panel {
  margin: 16px 0;
}

.debug-header {
  background: #f5f5f5;
  font-weight: 600;
}

.debug-content {
  max-height: 600px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.debug-section:last-child {
  border-bottom: none;
}

.debug-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1976d2;
}

.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ide-parsed-output {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.health-indicator {
  display: flex;
  align-items: center;
}

.status-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  min-width: 80px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-count {
  min-width: 30px;
  font-weight: 600;
}

.integrity-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.integrity-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.comparison-confidence {
  display: flex;
  align-items: center;
}

.matches, .discrepancies {
  margin-bottom: 16px;
}

.debug-json {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

/* Dark theme support */
[data-theme="dark"] .debug-header {
  background: var(--theme-surface-variant);
}

[data-theme="dark"] .debug-section {
  border-bottom-color: var(--theme-border);
}

[data-theme="dark"] .debug-json {
  background: var(--theme-surface-variant);
  color: var(--theme-text-primary);
}
</style>