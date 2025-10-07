<template>
  <div class="execution-error-guidance">
    <v-card class="error-guidance-card" elevation="2">
      <v-card-title class="error-guidance-header">
        <v-icon color="error" size="24" class="mr-2">mdi-alert-circle</v-icon>
        <span class="error-title">Test Execution Error</span>
        <v-spacer></v-spacer>
        <v-btn icon size="small" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="error-guidance-content">
        <div class="error-description">
          <p class="error-message">{{ guidance.issue }}</p>
          <p class="error-explanation">
            This is a Cucumber framework execution error, not a test failure. 
            The test framework encountered an issue before it could properly execute your scenarios.
          </p>
        </div>

        <v-divider class="my-4"></v-divider>

        <div class="solution-section">
          <h4 class="solution-title">
            <v-icon color="info" size="20" class="mr-1">mdi-lightbulb-outline</v-icon>
            Recommended Solution
          </h4>
          <p class="solution-text">{{ guidance.solution }}</p>
        </div>

        <div class="action-section">
          <h4 class="action-title">
            <v-icon color="success" size="20" class="mr-1">mdi-check-circle-outline</v-icon>
            Action Steps
          </h4>
          <p class="action-text">{{ guidance.action }}</p>
        </div>

        <!-- Common Solutions Expandable Section -->
        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-help-circle</v-icon>
              Common Solutions for Framework Errors
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="common-solutions">
                <div class="solution-item">
                  <h5>Empty Test Names</h5>
                  <p>Ensure all scenarios in your feature files have meaningful names:</p>
                  <pre class="code-example">Scenario: Login with valid credentials  # ✓ Good
Scenario:                                # ✗ Bad - empty name</pre>
                </div>

                <div class="solution-item">
                  <h5>Invalid Test Configuration</h5>
                  <p>Check your test runner configuration:</p>
                  <ul>
                    <li>Verify step definition classes are properly configured</li>
                    <li>Ensure all required dependencies are available</li>
                    <li>Check for proper annotation usage</li>
                  </ul>
                </div>

                <div class="solution-item">
                  <h5>Missing Step Definitions</h5>
                  <p>Make sure all steps in your scenarios have corresponding step definitions:</p>
                  <pre class="code-example">@Given("I am on the login page")
public void i_am_on_the_login_page() {
    // Implementation here
}</pre>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Error Details Section -->
        <div v-if="errorDetails" class="error-details-section mt-4">
          <h4 class="details-title">
            <v-icon color="grey" size="20" class="mr-1">mdi-information-outline</v-icon>
            Technical Details
          </h4>
          <v-card class="error-details-card" variant="outlined">
            <v-card-text>
              <pre class="error-details-text">{{ errorDetails }}</pre>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <v-card-actions class="error-guidance-actions">
        <v-btn color="primary" variant="outlined" @click="copyErrorDetails" :disabled="!errorDetails">
          <v-icon class="mr-1">mdi-content-copy</v-icon>
          Copy Error Details
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="$emit('close')">
          Got It
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'ExecutionErrorGuidance',
  props: {
    guidance: {
      type: Object,
      required: true,
      default: () => ({
        issue: 'Test execution framework error',
        solution: 'Check Cucumber configuration and test setup',
        action: 'Review logs and test runner configuration for detailed error information'
      })
    },
    errorDetails: {
      type: String,
      default: null
    }
  },
  emits: ['close'],
  methods: {
    async copyErrorDetails() {
      if (!this.errorDetails) return;

      try {
        await navigator.clipboard.writeText(this.errorDetails);
        this.$emit('copied');
        
        // Show success message
        this.$emit('message', {
          type: 'success',
          text: 'Error details copied to clipboard'
        });
      } catch (err) {
        console.error('Failed to copy error details:', err);
        this.$emit('message', {
          type: 'error',
          text: 'Failed to copy error details'
        });
      }
    }
  }
};
</script>

<style scoped>
.execution-error-guidance {
  max-width: 800px;
  margin: 0 auto;
}

.error-guidance-card {
  border-left: 4px solid #f44336;
}

.error-guidance-header {
  background-color: rgba(244, 67, 54, 0.05);
  border-bottom: 1px solid rgba(244, 67, 54, 0.1);
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #f44336;
}

.error-guidance-content {
  padding: 20px;
}

.error-description {
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  font-weight: 500;
  color: #f44336;
  margin-bottom: 8px;
}

.error-explanation {
  color: #666;
  line-height: 1.5;
}

.solution-section,
.action-section {
  margin-bottom: 16px;
}

.solution-title,
.action-title,
.details-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.solution-text,
.action-text {
  color: #555;
  line-height: 1.5;
}

.common-solutions {
  padding: 16px 0;
}

.solution-item {
  margin-bottom: 20px;
}

.solution-item h5 {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.solution-item p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.solution-item ul {
  color: #666;
  padding-left: 20px;
}

.solution-item li {
  margin-bottom: 4px;
}

.code-example {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  overflow-x: auto;
  margin: 8px 0;
}

.error-details-card {
  background-color: #fafafa;
}

.error-details-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.error-guidance-actions {
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.02);
}

/* Dark theme support */
.theme--dark .error-guidance-header {
  background-color: rgba(244, 67, 54, 0.1);
}

.theme--dark .error-explanation,
.theme--dark .solution-text,
.theme--dark .action-text {
  color: #bbb;
}

.theme--dark .solution-item p,
.theme--dark .solution-item ul {
  color: #bbb;
}

.theme--dark .code-example {
  background-color: #2d2d2d;
  border-color: #444;
  color: #f0f0f0;
}

.theme--dark .error-details-card {
  background-color: #2d2d2d;
}

.theme--dark .error-details-text {
  color: #ccc;
}

.theme--dark .error-guidance-actions {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Responsive design */
@media (max-width: 768px) {
  .execution-error-guidance {
    margin: 0 16px;
  }
  
  .error-guidance-content {
    padding: 16px;
  }
  
  .code-example {
    font-size: 11px;
    padding: 8px;
  }
}
</style>