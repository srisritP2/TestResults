<template>
  <div class="data-quality-indicator">
    <v-tooltip :text="tooltipText" location="top">
      <template v-slot:activator="{ props }">
        <v-chip
          v-bind="props"
          :color="severityColor"
          :variant="variant"
          size="small"
          class="data-quality-chip"
          @click="showDetails = !showDetails"
        >
          <v-icon :icon="severityIcon" size="14" class="mr-1"></v-icon>
          {{ severityLabel }}
        </v-chip>
      </template>
    </v-tooltip>

    <!-- Detailed Issues Dialog -->
    <v-dialog v-model="showDetails" max-width="600px">
      <v-card class="data-quality-details">
        <v-card-title class="details-header">
          <v-icon :color="severityColor" size="24" class="mr-2">{{ severityIcon }}</v-icon>
          <span class="details-title">Data Quality Issues</span>
          <v-spacer></v-spacer>
          <v-btn icon size="small" @click="showDetails = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="details-content">
          <div class="severity-info">
            <v-alert
              :type="alertType"
              variant="tonal"
              class="mb-4"
            >
              <div class="alert-content">
                <strong>Severity: {{ severityLabel }}</strong>
                <p class="mt-2">{{ severityDescription }}</p>
              </div>
            </v-alert>
          </div>

          <div class="issues-list">
            <h4 class="issues-title">Detected Issues:</h4>
            <v-list class="issues-list-items">
              <v-list-item
                v-for="(issue, index) in formattedIssues"
                :key="index"
                class="issue-item"
              >
                <template v-slot:prepend>
                  <v-icon :color="issue.color" size="20">{{ issue.icon }}</v-icon>
                </template>
                <v-list-item-title class="issue-title">{{ issue.title }}</v-list-item-title>
                <v-list-item-subtitle class="issue-description">{{ issue.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <div class="recommendations">
            <h4 class="recommendations-title">
              <v-icon color="info" size="20" class="mr-1">mdi-lightbulb-outline</v-icon>
              Recommendations
            </h4>
            <v-list class="recommendations-list">
              <v-list-item
                v-for="(recommendation, index) in recommendations"
                :key="index"
                class="recommendation-item"
              >
                <template v-slot:prepend>
                  <v-icon color="success" size="16">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title class="recommendation-text">{{ recommendation }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-card-actions class="details-actions">
          <v-btn color="primary" variant="outlined" @click="copyIssueDetails">
            <v-icon class="mr-1">mdi-content-copy</v-icon>
            Copy Details
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showDetails = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'DataQualityIndicator',
  props: {
    severity: {
      type: String,
      required: true,
      validator: value => ['low', 'medium', 'high', 'critical'].includes(value)
    },
    issues: {
      type: Array,
      required: true,
      default: () => []
    },
    tooltip: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'outlined'
    }
  },
  data() {
    return {
      showDetails: false
    };
  },
  computed: {
    severityColor() {
      const colors = {
        low: 'warning',
        medium: 'warning',
        high: 'error',
        critical: 'error'
      };
      return colors[this.severity] || 'warning';
    },
    
    severityIcon() {
      const icons = {
        low: 'mdi-alert',
        medium: 'mdi-alert',
        high: 'mdi-alert-circle',
        critical: 'mdi-alert-octagon'
      };
      return icons[this.severity] || 'mdi-alert';
    },
    
    severityLabel() {
      const labels = {
        low: 'Minor Issues',
        medium: 'Data Issues',
        high: 'Major Issues',
        critical: 'Critical Issues'
      };
      return labels[this.severity] || 'Data Issues';
    },
    
    severityDescription() {
      const descriptions = {
        low: 'Minor data quality issues that may affect display but not functionality.',
        medium: 'Moderate data quality issues that may impact report accuracy.',
        high: 'Significant data quality issues that affect report reliability.',
        critical: 'Critical data quality issues that severely impact report integrity.'
      };
      return descriptions[this.severity] || 'Data quality issues detected.';
    },
    
    alertType() {
      const types = {
        low: 'warning',
        medium: 'warning',
        high: 'error',
        critical: 'error'
      };
      return types[this.severity] || 'warning';
    },
    
    tooltipText() {
      if (this.tooltip) {
        return this.tooltip;
      }
      return `${this.severityLabel}: ${this.issues.length} issue${this.issues.length !== 1 ? 's' : ''} detected`;
    },
    
    formattedIssues() {
      const issueMap = {
        empty_name: {
          title: 'Empty Scenario Name',
          description: 'Scenario has no name or an empty name',
          icon: 'mdi-text-box-remove',
          color: 'warning'
        },
        no_steps: {
          title: 'No Steps',
          description: 'Scenario contains no test steps',
          icon: 'mdi-format-list-bulleted-square',
          color: 'error'
        },
        missing_results: {
          title: 'Missing Results',
          description: 'Some steps are missing execution results',
          icon: 'mdi-help-circle',
          color: 'warning'
        },
        invalid_status: {
          title: 'Invalid Status',
          description: 'Scenario or step has an invalid status value',
          icon: 'mdi-alert-circle',
          color: 'error'
        },
        malformed_data: {
          title: 'Malformed Data',
          description: 'Data structure is incomplete or corrupted',
          icon: 'mdi-database-alert',
          color: 'error'
        }
      };
      
      return this.issues.map(issue => {
        const issueType = typeof issue === 'string' ? issue : issue.type;
        const mapped = issueMap[issueType] || {
          title: 'Unknown Issue',
          description: 'An unrecognized data quality issue',
          icon: 'mdi-help-circle',
          color: 'grey'
        };
        
        return {
          ...mapped,
          original: issue
        };
      });
    },
    
    recommendations() {
      const recs = [];
      
      if (this.issues.includes('empty_name')) {
        recs.push('Add meaningful names to all scenarios in your feature files');
      }
      
      if (this.issues.includes('no_steps')) {
        recs.push('Ensure all scenarios contain at least one test step');
      }
      
      if (this.issues.includes('missing_results')) {
        recs.push('Check test execution logs for incomplete test runs');
      }
      
      if (this.issues.includes('invalid_status')) {
        recs.push('Verify test runner configuration and step definitions');
      }
      
      if (this.issues.includes('malformed_data')) {
        recs.push('Regenerate the test report or check for data corruption');
      }
      
      // Generic recommendations
      if (recs.length === 0) {
        recs.push('Review the test report generation process');
        recs.push('Check for any errors in the test execution logs');
      }
      
      return recs;
    }
  },
  methods: {
    async copyIssueDetails() {
      const details = {
        severity: this.severity,
        issues: this.formattedIssues.map(issue => ({
          type: issue.original,
          title: issue.title,
          description: issue.description
        })),
        recommendations: this.recommendations
      };
      
      const text = `Data Quality Issues Report
Severity: ${this.severityLabel}

Issues Detected:
${this.formattedIssues.map(issue => `- ${issue.title}: ${issue.description}`).join('\n')}

Recommendations:
${this.recommendations.map(rec => `- ${rec}`).join('\n')}`;
      
      try {
        await navigator.clipboard.writeText(text);
        this.$emit('copied');
        
        // Show success message
        this.$emit('message', {
          type: 'success',
          text: 'Issue details copied to clipboard'
        });
      } catch (err) {
        console.error('Failed to copy issue details:', err);
        this.$emit('message', {
          type: 'error',
          text: 'Failed to copy issue details'
        });
      }
    }
  }
};
</script>

<style scoped>
.data-quality-indicator {
  display: inline-block;
}

.data-quality-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-quality-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-quality-details {
  border-left: 4px solid #ff9800;
}

.details-header {
  background-color: rgba(255, 152, 0, 0.05);
  border-bottom: 1px solid rgba(255, 152, 0, 0.1);
}

.details-title {
  font-size: 18px;
  font-weight: 600;
}

.details-content {
  padding: 20px;
}

.alert-content strong {
  font-size: 14px;
}

.alert-content p {
  margin-bottom: 0;
  font-size: 13px;
  opacity: 0.9;
}

.issues-title,
.recommendations-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.issues-list-items,
.recommendations-list {
  background-color: transparent;
}

.issue-item,
.recommendation-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.issue-item:last-child,
.recommendation-item:last-child {
  border-bottom: none;
}

.issue-title {
  font-weight: 500;
  font-size: 14px;
}

.issue-description {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 2px;
}

.recommendation-text {
  font-size: 14px;
  line-height: 1.4;
}

.recommendations {
  margin-top: 20px;
}

.details-actions {
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.02);
}

/* Dark theme support */
.theme--dark .details-header {
  background-color: rgba(255, 152, 0, 0.1);
}

.theme--dark .issue-item,
.theme--dark .recommendation-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.theme--dark .details-actions {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Responsive design */
@media (max-width: 768px) {
  .details-content {
    padding: 16px;
  }
  
  .data-quality-chip {
    font-size: 11px;
  }
}
</style>