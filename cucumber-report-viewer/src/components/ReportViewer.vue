<template>
  <div class="cucumber-report-root">
    <!-- Enhanced Modern Header -->
    <div class="modern-header">
      <div class="header-container">
        <!-- Brand Section -->
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">
              <v-icon size="40" :color="isDarkTheme ? '#34D399' : '#10B981'">mdi-leaf</v-icon>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">Test Execution</h1>
              <p class="brand-subtitle">Dashboard</p>
            </div>
          </div>
        </div>

        <!-- Execution Info Section -->
        <div class="execution-info">
          <div class="info-card">
            <div class="info-icon">
              <v-icon size="20" color="#FF6B35">mdi-language-java</v-icon>
            </div>
            <div class="info-content">
              <span class="info-label">Runtime</span>
              <span class="info-value">{{ report?.tool || 'cucumber-jvm' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">
              <v-icon size="20" color="#00BCF2">mdi-microsoft-windows</v-icon>
            </div>
            <div class="info-content">
              <span class="info-label">Environment</span>
              <span class="info-value">{{ report?.os || 'Windows 11' }}</span>
            </div>
          </div>
        </div>

        <!-- Results Overview Section -->
        <div class="results-overview">
          <div class="results-chart">
            <div class="chart-container">
              <svg viewBox="0 0 42 42" class="donut-chart">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#F3F4F6" stroke-width="3"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10B981" stroke-width="3"
                  :stroke-dasharray="passedPercentage + ' ' + (100 - passedPercentage)" stroke-dashoffset="25"
                  transform="rotate(-90 21 21)" class="success-arc"></circle>
                <circle v-if="summary.failed > 0" cx="21" cy="21" r="15.915" fill="transparent" stroke="#EF4444"
                  stroke-width="3" :stroke-dasharray="failedPercentage + ' ' + (100 - failedPercentage)"
                  :stroke-dashoffset="25 - passedPercentage" transform="rotate(-90 21 21)" class="error-arc"></circle>
              </svg>
              <div class="chart-center">
                <span class="success-percentage">{{ passedPercentage }}%</span>
                <span class="chart-label">Passed</span>
              </div>
            </div>
          </div>
          <div class="results-summary">
            <div class="summary-item success">
              <v-icon size="16" color="#10B981">mdi-check-circle</v-icon>
              <span class="summary-count">{{ summary.passed }}</span>
              <span class="summary-label">Passed</span>
            </div>
            <div class="summary-item error">
              <v-icon size="16" color="#EF4444">mdi-close-circle</v-icon>
              <span class="summary-count">{{ summary.failed }}</span>
              <span class="summary-label">Failed</span>
            </div>
            <div class="summary-item warning">
              <v-icon size="16" color="#F59E0B">mdi-pause-circle</v-icon>
              <span class="summary-count">{{ summary.skipped }}</span>
              <span class="summary-label">Skipped</span>
            </div>
          </div>
        </div>

        <!-- Time & Duration Section -->
        <div class="time-section">
          <div class="time-card">
            <div class="time-icon">
              <v-icon size="20" color="#06B6D4">mdi-clock-outline</v-icon>
            </div>
            <div class="time-content">
              <span class="time-label">Execution Time</span>
              <span class="time-value">{{ timeAgo }}</span>
            </div>
          </div>
          <div class="duration-card">
            <div class="duration-icon">
              <v-icon size="20" color="#8B5CF6">mdi-timer-outline</v-icon>
            </div>
            <div class="duration-content">
              <span class="duration-label">Total Duration</span>
              <span class="duration-value">{{ summary.duration }}</span>
            </div>
          </div>
        </div>

        <!-- Left Action - Back to Collection -->
        <div class="left-actions">
          <v-tooltip text="Back to Collection" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" @click="goBackToCollection" icon="mdi-arrow-left" variant="text" size="large"
                class="back-btn" />
            </template>
          </v-tooltip>
        </div>

        <!-- Right Actions - Refresh & Delete -->
        <div class="right-actions">
          <v-tooltip text="Refresh Report Data" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" @click="refreshReport" icon="mdi-refresh" variant="text" size="large"
                class="refresh-btn" />
            </template>
          </v-tooltip>

          <v-tooltip :text="deleting ? 'Deleting Report...' : 'Delete Report'" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" @click="deleteCurrentReport"
                :icon="deleting ? 'mdi-loading mdi-spin' : 'mdi-delete'" variant="text" size="large" class="delete-btn"
                :disabled="deleting" :loading="deleting" />
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>
    <div class="cucumber-report-content">
      <div v-if="error" class="cucumber-alert error">{{ error }}</div>
      <div v-else-if="!report || !Array.isArray(report.features) || report.features.length === 0"
        class="cucumber-alert info">
        No report data available or invalid report format. Please upload a valid Cucumber JSON file.
      </div>
      <template v-else>
        <!-- Horizontal Controls Bar with Side-by-Side Layout -->
        <div class="controls-bar-container">
          <div class="controls-bar">
            <!-- Search Toggle -->
            <div class="control-toggle" @click="toggleSearchExpanded"
              :class="{ 'active': searchQuery || searchExpanded }">
              <div class="control-icon">
                <v-icon size="22" :color="searchQuery ? '#60A5FA' : (isDarkTheme ? '#94A3B8' : '#64748b')"
                  class="control-icon-search">mdi-magnify</v-icon>
              </div>
              <div class="control-content">
                <span class="control-label">Search</span>
                <v-chip v-if="searchQuery" color="primary" size="x-small" class="results-count">
                  {{ searchResults.total }}
                </v-chip>
              </div>
              <div class="control-actions">
                <v-btn v-if="searchQuery && !searchExpanded" @click.stop="clearSearch" variant="text" color="secondary"
                  size="x-small" class="clear-btn-inline">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
                <v-icon :class="{ 'rotate-180': searchExpanded }" color="#9CA3AF" size="18" class="expand-icon">
                  mdi-chevron-down
                </v-icon>
              </div>
            </div>

            <!-- Filter Toggle -->
            <div class="control-toggle" @click="toggleFiltersExpanded"
              :class="{ 'active': hasActiveFilters || filtersExpanded }">
              <div class="control-icon">
                <v-icon size="22" :color="hasActiveFilters ? '#A78BFA' : (isDarkTheme ? '#94A3B8' : '#64748b')"
                  class="control-icon-filter">mdi-filter-variant</v-icon>
              </div>
              <div class="control-content">
                <span class="control-label">Filters</span>
                <v-chip v-if="hasActiveFilters" color="secondary" size="x-small" class="results-count">
                  {{ getActiveFiltersCount() }}
                </v-chip>
              </div>
              <div class="control-actions">
                <v-btn v-if="hasActiveFilters && !filtersExpanded" @click.stop="clearAllFilters" variant="text"
                  color="secondary" size="x-small" class="clear-btn-inline">
                  <v-icon size="14">mdi-filter-remove</v-icon>
                </v-btn>
                <v-icon :class="{ 'rotate-180': filtersExpanded }" color="#9CA3AF" size="18" class="expand-icon">
                  mdi-chevron-down
                </v-icon>
              </div>
            </div>
          </div>

          <!-- Side-by-Side Expandable Panels -->
          <div class="expandable-panels">
            <!-- Search Panel -->
            <div class="panel-container" :class="{ 'expanded': searchExpanded }">
              <div v-if="searchExpanded" class="search-panel">
                <div class="panel-content">
                  <v-text-field v-model="searchQuery" placeholder="Search features, scenarios, and steps..."
                    prepend-inner-icon="mdi-magnify" clearable variant="outlined" density="comfortable"
                    class="search-input" @input="onSearchInput" hide-details autofocus>
                  </v-text-field>

                  <div v-if="searchQuery && searchResults.total > 0" class="search-results-info">
                    <div class="results-summary">
                      <v-chip color="success" size="small" variant="flat">
                        <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
                        {{ searchResults.total }} results found
                      </v-chip>
                    </div>
                    <div class="results-breakdown">
                      <span class="breakdown-item">
                        <v-icon size="12" color="#6366F1">mdi-file-document</v-icon>
                        {{ searchResults.features }} features
                      </span>
                      <span class="breakdown-item">
                        <v-icon size="12" color="#8B5CF6">mdi-script-text</v-icon>
                        {{ searchResults.scenarios }} scenarios
                      </span>
                      <span class="breakdown-item">
                        <v-icon size="12" color="#06B6D4">mdi-format-list-numbered</v-icon>
                        {{ searchResults.steps }} steps
                      </span>
                    </div>
                  </div>

                  <div v-else-if="searchQuery && searchResults.total === 0" class="search-no-results">
                    <v-chip color="warning" size="small" variant="flat">
                      <v-icon size="14" class="mr-1">mdi-alert-circle</v-icon>
                      No results found
                    </v-chip>
                    <p class="no-results-text">Try adjusting your search terms or check spelling</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filters Panel -->
            <div class="panel-container" :class="{ 'expanded': filtersExpanded }">
              <div v-if="filtersExpanded" class="filters-panel">
                <div class="panel-content">
                  <div class="filters-grid">
                    <!-- Status Filter -->
                    <div class="filter-group">
                      <label class="filter-label">
                        <v-icon size="16" color="#10B981" class="mr-1">mdi-check-circle</v-icon>
                        Status
                      </label>
                      <v-select v-model="filters.status" :items="statusFilterOptions" item-title="text"
                        item-value="value" multiple chips closable-chips variant="outlined" density="compact"
                        class="filter-select" placeholder="All statuses" @update:modelValue="applyFilters" hide-details>
                      </v-select>
                    </div>

                    <!-- Tags Filter -->
                    <div class="filter-group">
                      <label class="filter-label">
                        <v-icon size="16" color="#F59E0B" class="mr-1">mdi-tag</v-icon>
                        Tags
                      </label>
                      <v-select v-model="filters.tags" :items="tagFilterOptions" item-title="text" item-value="value"
                        multiple chips closable-chips variant="outlined" density="compact" class="filter-select"
                        placeholder="All tags" @update:modelValue="applyFilters" hide-details>
                      </v-select>
                    </div>

                    <!-- Duration Filter -->
                    <div class="filter-group">
                      <label class="filter-label">
                        <v-icon size="16" color="#06B6D4" class="mr-1">mdi-timer</v-icon>
                        Duration
                      </label>
                      <v-select v-model="filters.duration" :items="durationFilterOptions" item-title="text"
                        item-value="value" variant="outlined" density="compact" class="filter-select"
                        placeholder="All durations" @update:modelValue="applyFilters" hide-details>
                      </v-select>
                    </div>

                    <!-- Feature Filter -->
                    <div class="filter-group">
                      <label class="filter-label">
                        <v-icon size="16" color="#8B5CF6" class="mr-1">mdi-file-document</v-icon>
                        Features
                      </label>
                      <v-select v-model="filters.features" :items="featureFilterOptions" item-title="text"
                        item-value="value" multiple chips closable-chips variant="outlined" density="compact"
                        class="filter-select" placeholder="All features" @update:modelValue="applyFilters" hide-details>
                      </v-select>
                    </div>
                  </div>

                  <!-- Active Filters Summary -->
                  <div v-if="hasActiveFilters" class="active-filters-summary">
                    <div class="summary-header">
                      <v-icon size="16" color="#6366F1" class="mr-1">mdi-filter-check</v-icon>
                      <span class="summary-label">Active Filters</span>
                    </div>
                    <div class="summary-content">
                      <span class="summary-text">{{ getActiveFiltersText() }}</span>
                      <v-chip color="primary" size="small" variant="outlined" class="results-chip">
                        {{ filteredFeaturesCount }} features shown
                      </v-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top summary bar -->
        <div class="cucumber-summary-bar">
          <div class="summary-env">
            <v-icon color="primary" size="18" class="mr-1">mdi-laptop</v-icon>
            <span class="env-label">Environment:</span>
            <span class="env-value">{{ report.environment || 'Test Environment' }}</span>
          </div>
          <div class="summary-stats">
            <span class="stat passed">
              <v-icon color="success" size="18">mdi-check-circle</v-icon>
              {{ summary.passed }} Passed
            </span>
            <span class="stat failed">
              <v-icon color="error" size="18">mdi-close-circle</v-icon>
              {{ summary.failed }} Failed
            </span>
            <span class="stat skipped">
              <v-icon color="warning" size="18">mdi-alert-circle</v-icon>
              {{ summary.skipped }} Skipped
            </span>
            <span class="stat duration">
              <v-icon color="primary" size="18">mdi-timer</v-icon>
              {{ summary.duration }}
            </span>
          </div>
        </div>

        <!-- Features list with virtual scrolling for performance -->
        <VirtualScroller v-if="filteredFeatures.length > 50" :items="filteredFeatures" :item-height="120"
          :container-height="600" class="cucumber-features-list">
          <template #default="{ item: feature, index }">
            <v-expansion-panel :key="feature.id || feature.name" class="virtual-feature-panel">
              <v-expansion-panel-title class="cucumber-feature-row" :class="[featureStatus(feature)]">
                <v-icon v-if="featureStatus(feature) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
                <v-icon v-else-if="featureStatus(feature) === 'failed'" color="error"
                  size="18">mdi-close-circle</v-icon>
                <v-icon v-else-if="featureStatus(feature) === 'skipped'" color="warning"
                  size="18">mdi-alert-circle</v-icon>
                <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
                <span class="feature-file">{{ feature.uri || feature.name }}</span>
                <span v-if="feature.tags && feature.tags.length" class="feature-tags">
                  <span v-for="tag in feature.tags" :key="tag" class="feature-tag">{{ cleanTagText(tag) }}</span>
                </span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <LazyScenarios :feature="feature" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </template>
        </VirtualScroller>

        <!-- Regular expansion panels for smaller reports -->
        <v-expansion-panels v-else multiple class="cucumber-features-list">
          <v-expansion-panel v-for="(feature, idx) in filteredFeatures" :key="feature.id || feature.name">
            <v-expansion-panel-title class="cucumber-feature-row" :class="[featureStatus(feature)]">
              <v-icon v-if="featureStatus(feature) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
              <v-icon v-else-if="featureStatus(feature) === 'failed'" color="error" size="18">mdi-close-circle</v-icon>
              <v-icon v-else-if="featureStatus(feature) === 'skipped'" color="warning"
                size="18">mdi-alert-circle</v-icon>
              <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
              <span class="feature-file">{{ feature.uri || feature.name }}</span>
              <!-- <span class="feature-title" style="font-weight:700;">{{ feature.name }}</span> -->
              <span v-if="feature.tags && feature.tags.length" class="feature-tags">
                <span v-for="tag in feature.tags" :key="tag" class="feature-tag">{{ cleanTagText(tag) }}</span>
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="feature.description" class="feature-description">{{ feature.description }}</div>
              <div v-for="scenario in feature.elements.filter(el => el.type !== 'background')"
                :key="scenario.id || scenario.name" class="cucumber-scenario-block">
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title class="scenario-header-row">
                      <div class="scenario-header-content">
                        <div class="scenario-title-row">
                          <span class="scenario-title">{{ scenario.keyword || 'Scenario' }}: {{ scenario.name ||
                            scenario.id || (scenario.type ? scenario.type : 'Unnamed Scenario') }}</span>
                          <v-icon v-if="scenarioStatus(scenario) === 'passed'" color="success"
                            size="18">mdi-check-circle</v-icon>
                          <v-icon v-else-if="scenarioStatus(scenario) === 'failed'" color="error"
                            size="18">mdi-close-circle</v-icon>
                          <v-icon v-else-if="scenarioStatus(scenario) === 'skipped'" color="warning"
                            size="18">mdi-alert-circle</v-icon>
                          <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
                          <span class="scenario-duration">{{ formatDuration(scenario.duration) }}</span>
                        </div>
                        <div v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
                          <span v-for="tag in scenario.tags" :key="tag" class="scenario-tag">{{ cleanTagText(tag)
                          }}</span>
                        </div>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <ul class="cucumber-steps-list">
                        <li v-for="(step, idx) in scenario.steps" :key="step.keyword + step.name + idx"
                          class="cucumber-step-row">
                          <v-icon v-if="stepStatus(step) === 'passed'" color="success"
                            size="16">mdi-check-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'failed'" color="error"
                            size="16">mdi-close-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'skipped'" color="warning"
                            size="16">mdi-alert-circle</v-icon>
                          <v-icon v-else color="grey" size="16">mdi-help-circle</v-icon>
                          <span class="step-keyword">{{ step.keyword }}</span>
                          <span class="step-text">{{ step.name }}</span>
                          <span v-if="step.duration" class="step-duration">({{ formatDuration(step.duration) }})</span>
                          <!-- Enhanced Error Display -->
                          <div v-if="getStepErrorMessage(step)" class="step-error-block">
                            <div class="error-header">
                              <v-icon color="error" size="16" class="mr-1">mdi-alert-circle</v-icon>
                              <span class="error-label">Error Details:</span>
                            </div>
                            <pre class="step-error-message">{{ getDisplayErrorMessage(step) }}</pre>
                            <div v-if="shouldTruncateError(step)" class="error-actions">
                              <v-btn @click="toggleErrorExpansion(step)" text small color="primary"
                                class="expand-error-btn">
                                <v-icon size="14" class="mr-1">
                                  {{ step._showFullError ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                </v-icon>
                                {{ step._showFullError ? 'Show less' : 'Show more...' }}
                              </v-btn>
                              <v-btn @click="copyErrorToClipboard(step)" text small color="secondary"
                                class="copy-error-btn">
                                <v-icon size="14" class="mr-1">mdi-content-copy</v-icon>
                                Copy
                              </v-btn>
                            </div>
                          </div>

                          <!-- Screenshot Display - Only for failed steps -->
                          <div v-if="stepStatus(step) === 'failed' && getScenarioScreenshots(scenario).length > 0"
                            class="step-screenshots">
                            <div class="screenshots-header">
                              <v-icon color="info" size="16" class="mr-1">mdi-camera</v-icon>
                              <span class="screenshots-label">Screenshots:</span>
                            </div>
                            <div class="screenshot-thumbnails">
                              <div v-for="(screenshot, screenshotIndex) in getScenarioScreenshots(scenario)"
                                :key="screenshotIndex" class="screenshot-thumbnail"
                                @click="openScreenshotModal(scenario, screenshotIndex)">
                                <img :src="screenshot.dataUrl" :alt="`Screenshot ${screenshotIndex + 1}`"
                                  class="thumbnail-image" @load="onScreenshotLoad" @error="onScreenshotError" />
                                <div class="thumbnail-overlay">
                                  <v-icon color="white" size="20">mdi-magnify-plus</v-icon>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmationDialog v-model="confirmationDialog.show" :title="confirmationDialog.title"
      :message="confirmationDialog.message" :details="confirmationDialog.details" :type="confirmationDialog.type"
      :confirm-text="confirmationDialog.confirmText" :confirm-color="confirmationDialog.confirmColor"
      :show-environment-info="confirmationDialog.showEnvironmentInfo" :environment="confirmationDialog.environment"
      @confirm="confirmationDialog.onConfirm" @cancel="confirmationDialog.onCancel" />

    <!-- Success/Error Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
function getScenarioList(feature) {
  // Try all common Cucumber JSON keys for scenarios
  if (Array.isArray(feature.scenarios)) return feature.scenarios;
  if (Array.isArray(feature.elements)) return feature.elements;
  if (Array.isArray(feature.children)) return feature.children;
  return [];
}

import ConfirmationDialog from '@/components/ConfirmationDialog.vue';
import DeletionService from '@/services/DeletionService';

export default {
  name: 'ReportViewer',
  components: {
    ConfirmationDialog
  },
  props: {
    report: {
      type: Object,
      required: false
    },
    // section prop removed, no longer needed
    selectedFeatureIndex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      error: '',
      searchQuery: '',
      searchResults: {
        total: 0,
        features: 0,
        scenarios: 0,
        steps: 0
      },
      searchDebounceTimer: null,
      searchExpanded: false,
      filters: {
        status: [],
        tags: [],
        duration: null,
        features: []
      },
      filtersExpanded: false,
      deleting: false,
      deletionService: new DeletionService(),
      // Confirmation dialog state
      confirmationDialog: {
        show: false,
        title: '',
        message: '',
        details: '',
        type: 'default',
        confirmText: 'Confirm',
        confirmColor: 'primary',
        showEnvironmentInfo: false,
        environment: 'localhost',
        onConfirm: null,
        onCancel: null
      },
      // Snackbar for notifications
      snackbar: {
        show: false,
        message: '',
        color: 'info',
        timeout: 3000
      }
    }
  },
  computed: {
    statusFilterOptions() {
      return [
        { text: 'All', value: 'all' },
        { text: 'Passed', value: 'passed' },
        { text: 'Failed', value: 'failed' },
        { text: 'Skipped', value: 'skipped' }
      ];
    },
    tagFilterOptions() {
      const tags = new Set();
      if (this.report && this.report.features) {
        this.report.features.forEach(feature => {
          if (feature.tags) {
            feature.tags.forEach(tag => {
              const cleanTag = this.cleanTagText(tag);
              if (cleanTag) tags.add(cleanTag);
            });
          }
          if (feature.elements) {
            feature.elements.forEach(scenario => {
              if (scenario.tags) {
                scenario.tags.forEach(tag => {
                  const cleanTag = this.cleanTagText(tag);
                  if (cleanTag) tags.add(cleanTag);
                });
              }
            });
          }
        });
      }
      return Array.from(tags).sort().map(tag => ({ text: tag, value: tag }));
    },
    durationFilterOptions() {
      return [
        { text: 'All Durations', value: null },
        { text: 'Fast (< 1s)', value: 'fast' },
        { text: 'Medium (1-10s)', value: 'medium' },
        { text: 'Slow (> 10s)', value: 'slow' }
      ];
    },
    featureFilterOptions() {
      if (!this.report || !this.report.features) return [];
      return this.report.features.map((feature, index) => ({
        text: feature.name || `Feature ${index + 1}`,
        value: index
      }));
    },
    filteredFeatures() {
      if (!this.report || !this.report.features) return [];
      return this.report.features.filter(feature => this.shouldShowFeature(feature));
    },
    filteredFeaturesCount() {
      return this.filteredFeatures.length;
    },
    hasActiveFilters() {
      return this.filters.status.length > 0 ||
        this.filters.tags.length > 0 ||
        this.filters.duration !== null ||
        this.filters.features.length > 0;
    },
    reportTimestamp() {
      if (!this.report || !this.report.timestamp) return null;
      return new Date(this.report.timestamp);
    },
    timeAgo() {
      if (!this.reportTimestamp) return '';
      const now = new Date();
      const diffMs = now - this.reportTimestamp;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return this.reportTimestamp.toLocaleDateString();
      }
    },
    formattedDate() {
      if (!this.reportTimestamp) return '';
      return this.reportTimestamp.toLocaleString();
    },
    passedPercentage() {
      if (this.summary.total === 0) return 0;
      return (this.summary.passed / this.summary.total * 100).toFixed(1);
    },
    failedPercentage() {
      if (this.summary.total === 0) return 0;
      return (this.summary.failed / this.summary.total * 100).toFixed(1);
    },
    isDarkTheme() {
      return this.$store.getters['theme/isDark'];
    },
    // Memoized computed properties for better performance
    reportFeatures() {
      return this.report?.features || [];
    },
    featuresCount() {
      return this.reportFeatures.length;
    },
    summary() {
      let passed = 0, failed = 0, skipped = 0, total = 0, duration = 0;
      if (!this.report || !Array.isArray(this.report.features)) return { passed, failed, skipped, total, duration: 0 };

      this.report.features.forEach(feature => {
        const scenarios = Array.isArray(feature.elements) ? feature.elements.filter(el => el.type !== 'background') : [];
        scenarios.forEach(scenario => {
          const status = this.scenarioStatus(scenario);
          if (status === 'passed') passed++;
          else if (status === 'failed') failed++;
          else skipped++;
          total++;
          if (Array.isArray(scenario.steps)) {
            duration += scenario.steps.reduce((acc, st) => acc + (typeof st.result?.duration === 'number' ? st.result.duration : 0), 0);
          }

          // Add before hook durations (setup)
          if (Array.isArray(scenario.before)) {
            duration += scenario.before.reduce((acc, hook) => acc + (typeof hook.result?.duration === 'number' ? hook.result.duration : 0), 0);
          }

          // Add after hook durations (teardown)
          if (Array.isArray(scenario.after)) {
            duration += scenario.after.reduce((acc, hook) => acc + (typeof hook.result?.duration === 'number' ? hook.result.duration : 0), 0);
          }
        });
      });
      return {
        passed,
        failed,
        skipped,
        total,
        duration: this.formatDuration(duration, true)
      };
    }
  },
  methods: {
    scenarioStatus(scenario) {
      // Try to determine scenario status from common Cucumber JSON structures
      if (scenario.status) return scenario.status;
      if (scenario.steps && scenario.steps.some(s => (s.result && s.result.status === 'failed') || s.status === 'failed')) return 'failed';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'skipped') || s.status === 'skipped')) return 'skipped';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'passed') || s.status === 'passed')) return 'passed';
      return 'unknown';
    },
    scenarioStatusStyle(scenario) {
      const status = this.scenarioStatus(scenario);
      if (status === 'passed') {
        return {
          background: '#e8f5e9',
          color: '#388e3c',
          fontWeight: 'bold',
        };
      } else if (status === 'failed') {
        return {
          background: '#ffebee',
          color: '#e53935',
          fontWeight: 'bold',
        };
      }
      return {
        background: '#f2f2f2',
        color: '#222',
      };
    },
    // Enhanced Error Handling Methods
    getStepErrorMessage(step) {
      // Extract error message from step.result.error_message (actual JSON structure)
      if (step.result && step.result.error_message) {
        return step.result.error_message;
      }
      // Fallback to step.errorMessage for backward compatibility
      if (step.errorMessage) {
        return step.errorMessage;
      }
      return null;
    },

    getDisplayErrorMessage(step) {
      const errorMessage = this.getStepErrorMessage(step);
      if (!errorMessage) return '';

      // Show first 3 lines if not expanded, full message if expanded
      if (step._showFullError) {
        return errorMessage;
      } else {
        // Extract just the main error message (first line with exception type and message)
        const mainError = this.extractMainErrorMessage(errorMessage);
        return mainError;
      }
    },

    extractMainErrorMessage(fullErrorMessage) {
      if (!fullErrorMessage) return '';

      const lines = fullErrorMessage.split('\n');

      // Look for the main exception line (usually the first line or first line with exception class)
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].trim();

        // Check if line contains common exception patterns
        if (line.includes('Exception:') ||
          line.includes('Error:') ||
          line.includes('AssertionError:') ||
          line.includes('TimeoutException:') ||
          line.includes('ElementNotFound') ||
          line.includes('NoSuchElement') ||
          line.includes('WebDriverException') ||
          line.match(/^\w+(\.\w+)*Exception:/)) {
          return line;
        }
      }

      // If no exception pattern found, return first non-empty line
      const firstLine = lines.find(line => line.trim().length > 0);
      return firstLine ? firstLine.trim() : lines[0] || '';
    },

    shouldTruncateError(step) {
      const errorMessage = this.getStepErrorMessage(step);
      return errorMessage && errorMessage.split('\n').length > 3;
    },

    toggleErrorExpansion(step) {
      // Vue 3 compatible way to set reactive property
      step._showFullError = !step._showFullError;
    },

    copyErrorToClipboard(step) {
      const errorMessage = this.getStepErrorMessage(step);
      if (errorMessage) {
        navigator.clipboard.writeText(errorMessage).then(() => {
          // You could add a toast notification here
          console.log('Error message copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy error message:', err);
        });
      }
    },

    // Screenshot Handling Methods
    getScenarioScreenshots(scenario) {
      const screenshots = [];

      // Extract screenshots from after hooks (teardown phase)
      if (scenario.after && Array.isArray(scenario.after)) {
        scenario.after.forEach(hook => {
          if (hook.embeddings && Array.isArray(hook.embeddings)) {
            hook.embeddings.forEach(embedding => {
              if (embedding.mime_type === 'image/png' ||
                (embedding.data && embedding.data.startsWith('iVBORw0KGgo'))) {
                screenshots.push({
                  dataUrl: `data:image/png;base64,${embedding.data}`,
                  mimeType: embedding.mime_type || 'image/png'
                });
              }
            });
          }
        });
      }

      return screenshots;
    },

    openScreenshotModal(scenario, screenshotIndex) {
      const screenshots = this.getScenarioScreenshots(scenario);
      if (screenshots.length > screenshotIndex) {
        // Create a simple modal or use Vuetify dialog
        this.showScreenshotDialog(screenshots, screenshotIndex);
      }
    },

    showScreenshotDialog(screenshots, currentIndex) {
      // For now, open in new window - you can enhance this with a proper modal
      const screenshot = screenshots[currentIndex];
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>Screenshot ${currentIndex + 1}</title></head>
          <body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${screenshot.dataUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />
          </body>
        </html>
      `);
    },

    onScreenshotLoad() {
      // Handle successful screenshot loading
      console.log('Screenshot loaded successfully');
    },

    onScreenshotError() {
      // Handle screenshot loading errors
      console.error('Failed to load screenshot');
    },
    stepStatus(step) {
      if (step.result && step.result.status) return step.result.status;
      if (step.status) return step.status;
      return 'unknown';
    },
    stepKeywordClass(keyword) {
      return 'step-keyword';
    },
    formatDuration(duration, alwaysSeconds = false) {
      if (typeof duration !== 'number' || isNaN(duration)) return '-';
      // If duration is in nanoseconds, convert to seconds
      if (duration > 1000000) duration = duration / 1e9;
      // Show as X minutes Y seconds if >= 60s
      if (duration >= 60) {
        const mins = Math.floor(duration / 60);
        const secs = Math.round(duration % 60);
        return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
      }
      if (duration < 1 && !alwaysSeconds) return (duration * 1000).toFixed(0) + ' ms';
      return duration.toFixed(2) + ' s';
    },
    shouldTruncate(msg) {
      return msg && msg.split('\n').length > 5;
    },
    truncateError(msg) {
      if (!msg) return '';
      const lines = msg.split('\n');
      return lines.slice(0, 5).join('\n') + (lines.length > 5 ? '\n...' : '');
    },
    summaryBarWidth(type) {
      const total = this.summary.total || 1;
      const val = this.summary[type] || 0;
      return (val / total * 100).toFixed(1) + '%';
    },
    featureStatus(feature) {
      if (!feature || !feature.elements) return 'unknown';

      // Filter out background elements to only consider actual scenarios
      const scenarios = feature.elements.filter(el => el.type !== 'background');
      if (scenarios.length === 0) return 'unknown';

      // Check if any scenario failed
      if (scenarios.some(s => this.scenarioStatus(s) === 'failed')) return 'failed';

      // Check if all scenarios passed
      if (scenarios.every(s => this.scenarioStatus(s) === 'passed')) return 'passed';

      // Check if all scenarios are skipped
      if (scenarios.every(s => this.scenarioStatus(s) === 'skipped')) return 'skipped';

      // Mixed status or unknown - treat as passed if there are some passed scenarios
      const hasPassedScenarios = scenarios.some(s => this.scenarioStatus(s) === 'passed');
      return hasPassedScenarios ? 'passed' : 'unknown';
    },
    onSearchInput() {
      // Clear existing timer
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      // Debounce search for performance
      this.searchDebounceTimer = setTimeout(() => {
        this.performSearch();
      }, 300);
    },
    performSearch() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        this.searchResults = { total: 0, features: 0, scenarios: 0, steps: 0 };
        return;
      }

      const query = this.searchQuery.toLowerCase().trim();
      let totalResults = 0;
      let featureMatches = 0;
      let scenarioMatches = 0;
      let stepMatches = 0;

      if (!this.report || !this.report.features) {
        this.searchResults = { total: 0, features: 0, scenarios: 0, steps: 0 };
        return;
      }

      // Search through features, scenarios, and steps
      this.report.features.forEach(feature => {
        // Search in feature name and description
        const featureText = `${feature.name || ''} ${feature.description || ''} ${feature.uri || ''}`.toLowerCase();
        if (featureText.includes(query)) {
          featureMatches++;
          totalResults++;
        }

        // Search in feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => {
            const tagText = this.cleanTagText(tag).toLowerCase();
            if (tagText.includes(query)) {
              featureMatches++;
              totalResults++;
            }
          });
        }

        // Search in scenarios
        if (feature.elements) {
          feature.elements.forEach(scenario => {
            // Search in scenario name
            const scenarioText = `${scenario.name || ''}`.toLowerCase();
            if (scenarioText.includes(query)) {
              scenarioMatches++;
              totalResults++;
            }

            // Search in scenario tags
            if (scenario.tags) {
              scenario.tags.forEach(tag => {
                const tagText = this.cleanTagText(tag).toLowerCase();
                if (tagText.includes(query)) {
                  scenarioMatches++;
                  totalResults++;
                }
              });
            }

            // Search in steps
            if (scenario.steps) {
              scenario.steps.forEach(step => {
                const stepText = `${step.keyword || ''} ${step.name || ''}`.toLowerCase();
                if (stepText.includes(query)) {
                  stepMatches++;
                  totalResults++;
                }

                // Search in error messages
                if (step.errorMessage && step.errorMessage.toLowerCase().includes(query)) {
                  stepMatches++;
                  totalResults++;
                }
              });
            }
          });
        }
      });

      this.searchResults = {
        total: totalResults,
        features: featureMatches,
        scenarios: scenarioMatches,
        steps: stepMatches
      };
    },
    cleanTagText(tag) {
      // Handle different tag formats from Cucumber JSON
      let tagText = '';

      if (typeof tag === 'string') {
        tagText = tag;
      } else if (tag && typeof tag === 'object') {
        // Handle tag objects - common properties in Cucumber JSON
        tagText = tag.name || tag.value || tag.tag || tag.text || '';
      } else {
        // Handle other non-string values
        tagText = tag ? String(tag) : '';
      }

      // Remove curly braces from tag text
      return tagText.replace(/[{}]/g, '');
    },
    applyFilters() {
      // Filters are applied through computed properties
      // This method is called when filter values change
    },
    clearAllFilters() {
      this.filters = {
        status: [],
        tags: [],
        duration: null,
        features: []
      };
    },
    getActiveFiltersText() {
      const activeFilters = [];

      if (this.filters.status.length > 0) {
        activeFilters.push(`Status: ${this.filters.status.join(', ')}`);
      }

      if (this.filters.tags.length > 0) {
        activeFilters.push(`Tags: ${this.filters.tags.join(', ')}`);
      }

      if (this.filters.duration) {
        const durationOption = this.durationFilterOptions.find(opt => opt.value === this.filters.duration);
        activeFilters.push(`Duration: ${durationOption?.text || this.filters.duration}`);
      }

      if (this.filters.features.length > 0) {
        activeFilters.push(`Features: ${this.filters.features.length} selected`);
      }

      return activeFilters.join(' | ');
    },

    // Collapsible Search Methods
    toggleSearchExpanded() {
      this.searchExpanded = !this.searchExpanded;
    },

    clearSearch() {
      this.searchQuery = '';
      this.searchResults = { total: 0, features: 0, scenarios: 0, steps: 0 };
    },

    // Collapsible Filters Methods
    toggleFiltersExpanded() {
      this.filtersExpanded = !this.filtersExpanded;
    },

    getActiveFiltersCount() {
      let count = 0;
      if (this.filters.status.length > 0) count++;
      if (this.filters.tags.length > 0) count++;
      if (this.filters.duration) count++;
      if (this.filters.features.length > 0) count++;
      return count;
    },

    getCompactActiveFilters() {
      const compactFilters = [];

      if (this.filters.status.length > 0) {
        compactFilters.push(`Status: ${this.filters.status.length}`);
      }

      if (this.filters.tags.length > 0) {
        compactFilters.push(`Tags: ${this.filters.tags.length}`);
      }

      if (this.filters.duration) {
        const durationOption = this.durationFilterOptions.find(opt => opt.value === this.filters.duration);
        compactFilters.push(`Duration: ${durationOption?.text || this.filters.duration}`);
      }

      if (this.filters.features.length > 0) {
        compactFilters.push(`Features: ${this.filters.features.length}`);
      }

      return compactFilters.slice(0, 3); // Show only first 3
    },
    getFeatureDuration(feature) {
      if (!feature || !feature.elements) return 0;

      let totalDuration = 0;
      feature.elements.forEach(scenario => {
        if (scenario.steps) {
          scenario.steps.forEach(step => {
            if (step.result && typeof step.result.duration === 'number') {
              totalDuration += step.result.duration;
            } else if (typeof step.duration === 'number') {
              totalDuration += step.duration;
            }
          });
        }
      });

      // Convert from nanoseconds to seconds if needed
      if (totalDuration > 1000000) {
        totalDuration = totalDuration / 1e9;
      }

      return totalDuration;
    },

    // Add delete functionality methods
    async deleteCurrentReport() {
      try {
        // Show confirmation dialog first
        const confirmed = await this.showDeleteConfirmation();
        if (!confirmed) {
          return;
        }

        this.deleting = true;

        // Get report ID from route params
        const reportId = this.$route.params.id;

        const result = await this.deletionService.deleteReport(reportId, {
          confirm: false, // We already confirmed above
          showFeedback: false // We'll handle feedback ourselves
        });

        if (result.success && !result.cancelled) {
          // Show success message with appropriate text
          let successMessage;
          if (result.localOnly) {
            successMessage = result.deletionType === 'soft'
              ? 'Report hidden locally (server offline)'
              : 'Report removed from view (server offline)';
          } else {
            successMessage = result.deletionType === 'soft'
              ? 'Report hidden from collection'
              : 'Report deleted successfully';
          }

          this.showSuccessMessage(successMessage);

          // Emit event for parent components
          this.$emit('report-deleted', {
            reportId,
            result,
            deletionType: result.deletionType
          });

          // Navigate back to collection after a short delay
          setTimeout(() => {
            this.$router.push('/');
          }, 1500);
        }

      } catch (error) {
        console.error('Failed to delete report:', error);
        this.showErrorMessage(`Failed to delete report: ${error.message}`);
      } finally {
        this.deleting = false;
      }
    },

    async showDeleteConfirmation() {
      return new Promise((resolve) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        this.confirmationDialog = {
          show: true,
          title: isLocalhost ? 'Delete Report' : 'Hide Report',
          message: isLocalhost
            ? 'This will permanently delete the report file from the server.'
            : 'This will hide the report from the collection. The file will remain until next deployment.',
          details: `Report: ${this.report?.name || this.$route.params.id}`,
          type: 'delete',
          confirmText: isLocalhost ? 'Delete' : 'Hide',
          confirmColor: 'error',
          showEnvironmentInfo: true,
          environment: isLocalhost ? 'localhost' : 'production',
          onConfirm: () => {
            this.confirmationDialog.show = false;
            resolve(true);
          },
          onCancel: () => {
            this.confirmationDialog.show = false;
            resolve(false);
          }
        };
      });
    },

    goBackToCollection() {
      this.$router.push('/');
    },

    refreshReport() {
      // Reload the current route to refresh the report
      this.$router.go(0);
    },

    showSuccessMessage(message) {
      this.snackbar = {
        show: true,
        message,
        color: 'success',
        timeout: 3000
      };
    },

    showErrorMessage(message) {
      this.snackbar = {
        show: true,
        message,
        color: 'error',
        timeout: 5000
      };
    },

    // Feature filtering method
    shouldShowFeature(feature) {
      // Status filter
      if (this.filters.status.length > 0 && !this.filters.status.includes('all')) {
        const featureStatus = this.featureStatus(feature);
        if (!this.filters.status.includes(featureStatus)) {
          return false;
        }
      }

      // Tags filter
      if (this.filters.tags.length > 0) {
        const featureTags = [];

        // Collect feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => {
            const cleanTag = this.cleanTagText(tag);
            if (cleanTag) featureTags.push(cleanTag);
          });
        }

        // Collect scenario tags
        if (feature.elements) {
          feature.elements.forEach(scenario => {
            if (scenario.tags) {
              scenario.tags.forEach(tag => {
                const cleanTag = this.cleanTagText(tag);
                if (cleanTag) featureTags.push(cleanTag);
              });
            }
          });
        }

        // Check if any selected tags match
        const hasMatchingTag = this.filters.tags.some(selectedTag =>
          featureTags.includes(selectedTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Duration filter
      if (this.filters.duration) {
        const featureDuration = this.getFeatureDuration(feature);

        if (this.filters.duration === 'fast' && featureDuration >= 1) {
          return false;
        } else if (this.filters.duration === 'medium' && (featureDuration < 1 || featureDuration > 10)) {
          return false;
        } else if (this.filters.duration === 'slow' && featureDuration <= 10) {
          return false;
        }
      }

      // Features filter
      if (this.filters.features.length > 0) {
        const featureIndex = this.report.features.indexOf(feature);
        if (!this.filters.features.includes(featureIndex)) {
          return false;
        }
      }

      return true;
    },

    // Get feature duration helper
    getFeatureDuration(feature) {
      if (!feature.elements) return 0;

      let totalDuration = 0;
      feature.elements.forEach(scenario => {
        if (scenario.steps) {
          scenario.steps.forEach(step => {
            if (step.result && typeof step.result.duration === 'number') {
              totalDuration += step.result.duration;
            }
          });
        }
      });

      // Convert nanoseconds to seconds if needed
      if (totalDuration > 1000000) {
        totalDuration = totalDuration / 1e9;
      }

      return totalDuration;
    }
  }
}
</script>

<style scoped>
/* Modern Enhanced Header */
.modern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  margin-bottom: 32px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto auto;
  gap: 32px;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
  position: relative;
}

/* Left Actions */
.left-actions {
  display: flex;
  align-items: center;
  justify-self: start;
}

.back-btn {
  color: #6366F1 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  min-width: 44px;
  min-height: 44px;
}

.back-btn:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateX(-4px);
  color: #4F46E5 !important;
}

.back-btn:active {
  transform: translateX(-2px) scale(0.95);
}

/* Right Actions */
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
}

.refresh-btn {
  color: #10B981 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  min-width: 44px;
  min-height: 44px;
}

.refresh-btn:hover {
  background: rgba(16, 185, 129, 0.1) !important;
  transform: rotate(180deg);
  color: #059669 !important;
}

.refresh-btn:active {
  transform: rotate(180deg) scale(0.95);
}

.delete-btn {
  color: #EF4444 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  min-width: 44px;
  min-height: 44px;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  transform: scale(1.1);
  color: #DC2626 !important;
}

.delete-btn:active {
  transform: scale(1.05);
}

.delete-btn:disabled {
  opacity: 0.6;
  transform: none !important;
}

/* Brand Section */
.brand-section {
  display: flex;
  align-items: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 16px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon .v-icon {
  color: white !important;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
  font-weight: 400;
}

/* Execution Info Section */
.execution-info {
  display: flex;
  gap: 16px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 60px;
}

.info-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
}

.info-icon .v-icon {
  color: white !important;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.info-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
}

/* Results Overview Section */
.results-overview {
  display: flex;
  align-items: center;
  gap: 24px;
}

.results-chart {
  position: relative;
}

.chart-container {
  position: relative;
  width: 100px;
  height: 100px;
}

.donut-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.success-arc {
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

.error-arc {
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.success-percentage {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.chart-label {
  font-size: 12px;
  opacity: 0.8;
}

.results-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.summary-count {
  font-weight: 700;
  min-width: 24px;
}

.summary-label {
  opacity: 0.9;
}

/* Time Section */
.time-section {
  display: flex;
  gap: 16px;
}

/* Actions Section */
.actions-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-menu-btn {
  color: rgba(255, 255, 255, 0.8) !important;
}

.action-menu-btn:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.time-card,
.duration-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 60px;
}

.time-icon,
.duration-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
}

.time-icon .v-icon,
.duration-icon .v-icon {
  color: white !important;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.time-content,
.duration-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.time-label,
.duration-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
}

.time-value,
.duration-value {
  font-size: 14px;
  font-weight: 600;
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 1200px) {
  .header-container {
    grid-template-columns: 1fr;
    gap: 20px;
    text-align: center;
  }

  .execution-info,
  .time-section {
    justify-content: center;
  }

  .results-overview {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .modern-header {
    padding: 16px 12px;
    margin-bottom: 16px;
    position: relative;
  }

  .header-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    grid-template-columns: none;
    align-items: center;
    text-align: center;
    padding-top: 70px;
    /* Enough space to clear action buttons */
  }

  .brand-section {
    order: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-icon {
    display: none;
    /* Hide the brand logo on mobile to avoid duplication */
  }

  .brand-logo {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    align-items: center;
  }

  .brand-text {
    text-align: center;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .brand-title {
    text-align: center !important;
    width: 100%;
  }

  .brand-subtitle {
    text-align: center !important;
    width: 100%;
  }

  .brand-title {
    font-size: 18px !important;
    line-height: 1.2;
    margin: 0;
  }

  .brand-subtitle {
    font-size: 12px !important;
    margin: 0;
  }

  .execution-info {
    order: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
  }

  .time-section {
    order: 4;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
  }

  .results-overview {
    order: 3;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    width: 100%;
  }

  .info-card,
  .time-card,
  .duration-card {
    padding: 10px 12px;
    min-width: auto;
    min-height: 50px;
    gap: 10px;
    width: 100%;
  }

  .info-icon,
  .time-icon,
  .duration-icon {
    padding: 8px;
    min-width: 36px;
    min-height: 36px;
  }

  .info-content,
  .time-content,
  .duration-content {
    gap: 2px;
  }

  .info-label,
  .time-label,
  .duration-label {
    font-size: 11px;
  }

  .info-value,
  .time-value,
  .duration-value {
    font-size: 12px;
  }

  .results-chart {
    order: 1;
  }

  .chart-container {
    width: 80px;
    height: 80px;
  }

  .success-percentage {
    font-size: 14px;
  }

  .chart-label {
    font-size: 10px;
  }

  .results-summary {
    order: 2;
    flex-direction: row;
    justify-content: center;
    gap: 16px;
  }

  .summary-item {
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .summary-count {
    font-size: 16px;
  }

  .summary-label {
    font-size: 11px;
  }

  .left-actions {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
  }

  .right-actions {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .back-btn,
  .refresh-btn,
  .delete-btn {
    background: rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    min-width: 44px !important;
    min-height: 44px !important;
    width: 44px !important;
    height: 44px !important;
    border-radius: 12px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .back-btn .v-icon,
  .refresh-btn .v-icon,
  .delete-btn .v-icon {
    color: white !important;
    font-size: 20px !important;
  }

  .back-btn:hover,
  .refresh-btn:hover,
  .delete-btn:hover {
    background: rgba(0, 0, 0, 0.4) !important;
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.3) !important;
  }
}

@media (max-width: 480px) {
  .modern-header {
    padding: 12px 8px;
  }

  .header-container {
    padding-top: 60px;
    /* Enough space to clear action buttons on small mobile */
    gap: 12px;
  }

  .execution-info,
  .time-section {
    max-width: 280px;
  }

  .logo-icon {
    display: none;
    /* Keep logo hidden on small mobile too */
  }

  .brand-text {
    text-align: center;
    width: 100%;
  }

  .brand-title {
    font-size: 16px !important;
    text-align: center !important;
  }

  .brand-subtitle {
    font-size: 11px !important;
    text-align: center !important;
  }

  .info-card,
  .time-card,
  .duration-card {
    padding: 8px 10px;
    min-height: 44px;
    gap: 8px;
  }

  .info-icon,
  .time-icon,
  .duration-icon {
    padding: 6px;
    min-width: 32px;
    min-height: 32px;
  }

  .info-label,
  .time-label,
  .duration-label {
    font-size: 11px;
  }

  .info-value,
  .time-value,
  .duration-value {
    font-size: 12px;
  }

  .chart-container {
    width: 70px;
    height: 70px;
  }

  .success-percentage {
    font-size: 12px;
  }

  .results-summary {
    gap: 12px;
  }

  .summary-count {
    font-size: 14px;
  }

  .summary-label {
    font-size: 10px;
  }

  .left-actions {
    top: 12px;
    left: 12px;
  }

  .right-actions {
    top: 12px;
    right: 12px;
    gap: 6px;
  }

  .back-btn,
  .refresh-btn,
  .delete-btn {
    min-width: 40px !important;
    min-height: 40px !important;
    width: 40px !important;
    height: 40px !important;
    border-radius: 10px !important;
  }

  .back-btn .v-icon,
  .refresh-btn .v-icon,
  .delete-btn .v-icon {
    font-size: 18px !important;
  }
}

/* Compact Controls Section Styles */
.controls-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 0;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.controls-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* Control Toggle Header (Search) */
.control-toggle-header {
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  border-radius: 16px 16px 0 0;
}

.control-toggle-header:hover {
  background: #f9fafb;
}

.control-toggle-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.control-toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-toggle-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.active-badge {
  margin-left: 8px;
}

.clear-btn-compact {
  font-size: 12px !important;
  min-width: auto !important;
  padding: 4px 8px !important;
}

.compact-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.compact-search-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-breakdown-compact {
  font-size: 12px;
  color: #6b7280;
}

/* Expandable Control Content */
.control-content {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #e5e7eb;
}

.search-input-container {
  padding-top: 16px;
}

.search-container {
  max-width: 1600px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 20px;
}

.search-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
}

.search-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.search-input-container {
  position: relative;
}

.enhanced-search-input {
  margin-bottom: 16px;
}

.search-results-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.search-breakdown {
  font-size: 14px;
  color: #6b7280;
}

.search-no-results {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.no-results-text {
  font-size: 14px;
  color: #6b7280;
}

/* Enhanced Collapsible Filters Section Styles */
.filters-section {
  background: #ffffff;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.filters-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* Clickable Filter Header */
.filters-toggle-header {
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
  user-select: none;
  position: relative;
  z-index: 1;
}

.filters-toggle-header:hover {
  background: #f9fafb;
}

.filters-toggle-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.filters-toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filters-toggle-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.active-filters-badge {
  margin-left: 8px;
}

.clear-all-btn-compact {
  font-size: 12px !important;
  min-width: auto !important;
  padding: 4px 8px !important;
}

.compact-filters-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.compact-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.compact-chip {
  font-size: 11px !important;
}

.more-filters-text {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

/* Expandable Filters Content */
.filters-content {
  padding: 0 24px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.filters-expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 20px;
}

.filters-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.filters-toggle-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filters-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
}

.active-filters-badge {
  margin-left: 8px;
}

.filters-toggle-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-all-btn-compact {
  padding: 4px 8px !important;
  min-width: auto !important;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Compact Filters Preview */
.compact-filters-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.compact-filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.compact-chip {
  font-size: 12px !important;
}

.more-filters-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* Expandable Content */
.filters-content {
  padding: 0 24px 24px 24px;
  border-top: 1px solid #f3f4f6;
}

.filters-expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 20px;
}

.filters-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.clear-all-btn {
  font-size: 14px !important;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.filter-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-card-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.filter-select {
  margin-top: 4px;
}

.active-filters-summary {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.active-filters-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.active-filters-label {
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
}

.active-filters-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filters-summary-text {
  font-size: 14px;
  color: #0369a1;
  flex: 1;
}

.results-chip {
  flex-shrink: 0;
}

/* Enhanced Mobile Responsive Design for Search and Filters */
@media (max-width: 768px) {
  .controls-bar-container {
    margin-bottom: 12px;
  }

  .controls-bar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .control-toggle {
    padding: 12px;
    border-radius: 8px;
  }

  .control-content {
    margin: 0 8px;
  }

  .control-label {
    font-size: 14px;
  }

  .expandable-panels {
    margin-top: 8px;
  }

  .panel-container {
    margin-bottom: 8px;
  }

  .search-panel,
  .filters-panel {
    padding: 12px;
    border-radius: 8px;
  }

  .search-input {
    margin-bottom: 12px;
  }

  .search-results-info {
    margin-top: 8px;
  }

  .results-breakdown {
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }

  .breakdown-item {
    font-size: 12px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-group {
    margin-bottom: 8px;
  }

  .filter-label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .filter-select {
    font-size: 14px;
  }

  .active-filters-summary {
    margin-top: 12px;
    padding: 8px;
  }

  .active-filters-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .summary-text {
    font-size: 12px;
  }

  .search-results-badge,
  .search-no-results {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .no-results-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .controls-bar {
    padding: 8px;
  }

  .control-toggle {
    padding: 10px;
  }

  .control-label {
    font-size: 13px;
  }

  .search-panel,
  .filters-panel {
    padding: 8px;
  }

  .filters-grid {
    gap: 8px;
  }

  .filter-label {
    font-size: 12px;
  }

  .breakdown-item {
    font-size: 11px;
  }
}

/* Legacy styles for compatibility */
.polished-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.2rem 2rem 0.7rem 2rem;
  margin-bottom: 1.5rem;
}

.header-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2.5rem;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.header-subitem {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.header-tech-logo {
  width: 28px;
  height: 28px;
  margin-left: 0.2em;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

.execution-summary code {
  background: #f3f6fa;
  border-radius: 4px;
  padding: 0.1em 0.5em;
  font-size: 1.01em;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
}

.execution-summary em.conjunction {
  color: #888;
  font-style: normal;
  margin: 0 0.2em;
}

.health-summary {
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: 500;
  color: #00a818;
}

.health-chart {
  width: 32px;
  height: 32px;
  margin-right: 0.2em;
}

.time-summary {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #1976d2;
  font-weight: 500;
}

.time-summary time {
  color: #222;
  font-weight: 500;
}

.mb-5 {
  margin-bottom: 2.5rem !important;
}

/* Cucumber Reports Classic Style */
.cucumber-report-root {
  min-height: 100vh;
  background: #fff;
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  color: #23272f;
}

.cucumber-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1.2rem 2rem 0.7rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  margin-bottom: 1.5rem;
}

.cucumber-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

.cucumber-header-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #388e3c;
  letter-spacing: 0.01em;
  margin-left: 0.5em;
}

.cucumber-report-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
}

/* Mobile styles for main content */
@media (max-width: 768px) {
  .cucumber-report-content {
    padding: 0 12px 16px 12px;
  }
}

@media (max-width: 480px) {
  .cucumber-report-content {
    padding: 0 8px 12px 8px;
  }
}

.cucumber-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  margin-bottom: 1.2rem;
  font-size: 1.05rem;
}

/* Mobile styles for summary bar */
@media (max-width: 768px) {
  .cucumber-summary-bar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    font-size: 14px;
  }

  .summary-env {
    order: 1;
    justify-content: center;
  }

  .env-label {
    font-size: 13px;
  }

  .env-value {
    font-size: 13px;
  }

  .summary-stats {
    order: 2;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
  }

  .stat {
    font-size: 13px;
    flex-direction: column;
    text-align: center;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .cucumber-summary-bar {
    padding: 10px;
    font-size: 13px;
  }

  .summary-stats {
    gap: 12px;
  }

  .stat {
    font-size: 12px;
  }

  .env-label,
  .env-value {
    font-size: 12px;
  }
}

.summary-env {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #444;
}

.env-label {
  font-weight: 500;
  color: #222;
}

.env-value {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
  font-size: 1.01em;
}

.summary-stats {
  display: flex;
  gap: 1.2em;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.3em;
  font-weight: 500;
  font-size: 1.01em;
}

.stat.passed {
  color: #388e3c;
}

.stat.failed {
  color: #e53935;
}

.stat.skipped {
  color: #b26a00;
}

.stat.duration {
  color: #1976d2;
}

.cucumber-alert {
  border-radius: 6px;
  padding: 1em 1.2em;
  margin-bottom: 1.2em;
  font-size: 1.05em;
}

.cucumber-alert.error {
  background: #ffebee;
  color: #b71c1c;
  border: 1px solid #ffcdd2;
}

.cucumber-alert.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #90caf9;
}

.cucumber-features-list {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.2rem;
  padding: 0.5rem 0.7rem;
}

/* Mobile styles for features list */
@media (max-width: 768px) {
  .cucumber-features-list {
    padding: 8px;
    margin-bottom: 16px;
  }

  .cucumber-feature-row {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 8px;
    font-size: 14px;
  }

  .feature-file {
    font-size: 13px;
    line-height: 1.3;
    word-break: break-word;
  }

  .feature-tags {
    width: 100%;
    margin-top: 8px;
  }

  .feature-tag {
    font-size: 11px;
    padding: 2px 6px;
    margin-right: 4px;
    margin-bottom: 4px;
  }

  .cucumber-scenario-block {
    margin-bottom: 12px;
  }

  .scenario-header-row {
    padding: 10px 8px;
  }

  .scenario-title-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .scenario-title {
    font-size: 13px;
    line-height: 1.3;
    word-break: break-word;
    flex: 1;
    min-width: 200px;
  }

  .scenario-duration {
    font-size: 11px;
    white-space: nowrap;
  }

  .scenario-tags {
    width: 100%;
    margin-top: 6px;
  }

  .scenario-tag {
    font-size: 10px;
    padding: 2px 4px;
    margin-right: 3px;
    margin-bottom: 3px;
  }
}

@media (max-width: 480px) {
  .cucumber-features-list {
    padding: 6px;
  }

  .cucumber-feature-row {
    padding: 10px 6px;
    font-size: 13px;
  }

  .feature-file {
    font-size: 12px;
  }

  .feature-tag {
    font-size: 10px;
    padding: 1px 4px;
  }

  .scenario-title {
    font-size: 12px;
    min-width: 150px;
  }

  .scenario-duration {
    font-size: 10px;
  }

  .scenario-tag {
    font-size: 9px;
    padding: 1px 3px;
  }
}

.cucumber-feature-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.6em 0.5em;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.01em;
  transition: background 0.15s;
}

.cucumber-feature-row.selected {
  background: #e3f2fd;
}

.cucumber-feature-row.passed {
  background: #e8f5e9;
}

.cucumber-feature-row.failed {
  background: #ffebee;
}

.feature-file {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
  font-size: 0.98em;
}

.cucumber-feature-details {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.2rem 1.5rem 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
}

.feature-title-block {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 0.3em;
}

.feature-title {
  font-size: 1.13rem;
  font-weight: 700;
  color: #222;
}

.feature-tags {
  display: flex;
  gap: 0.3em;
  text-align: left;
  flex-wrap: wrap;
  ;
}

.feature-tag {
  font-size: 0.97em;
  color: #b26a00;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-weight: 600;
  background: #fffbe7;
  border-radius: 4px;
  padding: 0 0.4em;
  letter-spacing: 0.01em;
}

.feature-description {
  color: #444;
  font-size: 1.01em;
  margin-bottom: 0.7em;
  text-align: left;
}

.cucumber-scenario-block {
  border-top: 1px solid #e5e7eb;
  padding: 1.1em 0 0.7em 0;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 1.2em;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.scenario-header-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.7em 1em;
  font-size: 1.01em;
  font-weight: 600;
  margin-bottom: 0.2em;
  word-break: break-word;
}

.scenario-header-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: left;
}

.scenario-title-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.3em;
}

.scenario-title {
  font-weight: 700;
  color: #222;
  flex: 1;
  word-break: break-word;
  text-align: left;
}

.scenario-tags {
  display: flex;
  gap: 0.3em;
  text-align: left;
  flex-wrap: wrap;
  margin-left: 0;
}

.scenario-tag {
  font-size: 0.97em;
  color: #b26a00;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-weight: 600;
  background: #fffbe7;
  border-radius: 4px;
  padding: 0 0.4em;
  letter-spacing: 0.01em;
}

.scenario-duration {
  margin-left: auto;
  color: #64748b;
  font-size: 0.97em;
  white-space: nowrap;
}

.cucumber-steps-list {
  list-style: none;
  margin: 0.5em 0 0 0;
  padding: 0;
}

.cucumber-step-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6em;
  font-size: 0.99em;
  padding: 0.2em 0;
  flex-wrap: wrap;
  word-break: break-word;
}

/* Mobile styles for steps list */
@media (max-width: 768px) {
  .cucumber-steps-list {
    margin: 8px 0;
    padding: 0 8px;
  }

  .cucumber-step-row {
    gap: 8px;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid #f0f0f0;
  }

  .step-keyword {
    min-width: 40px;
    font-size: 12px;
  }

  .step-text {
    font-size: 13px;
    line-height: 1.4;
    flex: 1 1 150px;
  }

  .step-duration {
    font-size: 11px;
    margin-left: 0;
    width: 100%;
    text-align: right;
  }

  .step-error-block {
    margin-top: 8px;
    margin-left: 0;
    padding: 8px;
    width: calc(100% - 16px);
  }

  .error-header {
    margin-bottom: 6px;
    font-size: 12px;
  }

  .step-error-message {
    font-size: 11px;
    padding: 6px;
    max-height: 150px;
  }

  .error-actions {
    margin-top: 6px;
    gap: 6px;
  }

  .expand-error-btn,
  .copy-error-btn {
    font-size: 11px !important;
    padding: 3px 6px !important;
  }
}

@media (max-width: 480px) {
  .cucumber-steps-list {
    padding: 0 4px;
  }

  .cucumber-step-row {
    gap: 6px;
    padding: 6px 0;
    font-size: 12px;
  }

  .step-keyword {
    min-width: 35px;
    font-size: 11px;
  }

  .step-text {
    font-size: 12px;
    flex: 1 1 120px;
  }

  .step-duration {
    font-size: 10px;
  }

  .step-error-block {
    padding: 6px;
  }

  .error-header {
    font-size: 11px;
  }

  .step-error-message {
    font-size: 10px;
    padding: 4px;
    max-height: 120px;
  }
}

.step-keyword {
  font-weight: 600;
  color: #1976d2;
  min-width: 48px;
}

.step-text {
  color: #23272f;
  flex: 1 1 200px;
  word-break: break-word;
  text-align: left;
}

.step-duration {
  color: #888;
  font-size: 0.95em;
  margin-left: 0.5em;
}

.step-error-block {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  border-left: 4px solid #f44336;
  margin-top: 0.3em;
  margin-left: 0;
  padding: 0.7em 1em;
  width: 100%;
  overflow-x: auto;
  word-break: break-word;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: #d32f2f;
}

.error-label {
  font-size: 0.9em;
}

.step-error-message {
  color: #b71c1c;
  font-size: 0.97em;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  white-space: pre-wrap;
  margin: 0;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ffcdd2;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.expand-error-btn,
.copy-error-btn {
  font-size: 0.8em !important;
  min-width: auto !important;
  padding: 4px 8px !important;
}

/* Screenshot Styles */
.step-screenshots {
  margin-top: 12px;
  padding: 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  border-left: 4px solid #3b82f6;
}

.screenshots-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1976d2;
}

.screenshots-label {
  font-size: 0.9em;
}

.screenshot-thumbnails {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.screenshot-thumbnail {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.screenshot-thumbnail:hover {
  border-color: #3b82f6;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.screenshot-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.cucumber-summary-bar {
  display: flex;
  gap: 1.5em;
  font-size: 1.08em;
  margin-bottom: 1.2em;
  align-items: center;
}

.summary-passed {
  color: #388e3c;
  font-weight: bold;
}

.summary-failed {
  color: #e53935;
  font-weight: bold;
}

.summary-skipped {
  color: #888;
}

.summary-total {
  color: #1976d2;
}

.summary-duration {
  color: #444;
}

.cucumber-scenario-block {
  margin-bottom: 1em;
}

.cucumber-steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cucumber-step-row {
  display: flex;
  gap: 1em;
  align-items: center;
  margin-bottom: 0.3em;
}



.step-name {
  color: #222;
}

.step-status {
  margin-left: auto;
}

.scenario-status-label {
  margin-left: 1em;
  font-size: 0.95em;
}

.cucumber-alert.info {
  color: #1976d2;
  background: #e3f2fd;
  padding: 0.5em 1em;
  border-radius: 6px;
  margin-top: 1em;
}

/* Search Bar Styles */
.cucumber-search-bar {
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 0.5rem;
}

.search-results-summary {
  color: #388e3c;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-results-summary::before {
  content: "✓";
  color: #388e3c;
  font-weight: bold;
}

.search-no-results {
  color: #e53935;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-no-results::before {
  content: "⚠";
  color: #e53935;
  font-weight: bold;
}


/* Search Bar Styles */
.cucumber-search-bar {
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 0.5rem;
}

.search-results-summary {
  color: #388e3c;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-results-summary::before {
  content: "✓";
  color: #388e3c;
  font-weight: bold;
}

.search-no-results {
  color: #e53935;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-no-results::before {
  content: "⚠";
  color: #e53935;
  font-weight: bold;
}

/* <!-- Advanced Filters Styles --> */
.cucumber-filters-bar {
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
  flex: 1;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-select {
  min-width: 150px;
}

.clear-filters-btn {
  margin-top: 1.5rem;
  height: 40px;
}

.active-filters-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.filters-summary-text {
  color: #6b7280;
  font-size: 0.9rem;
}

.filtered-results-count {
  color: #1976d2;
  font-weight: 600;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-filters-btn {
    margin-top: 1rem;
    width: 100%;
  }
}

/* Horizontal Controls Bar - Side by Side Layout */
.controls-bar-container {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.controls-bar {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.control-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid #e2e8f0;
  position: relative;
  background: #ffffff;
}

.control-toggle:last-child {
  border-right: none;
}

.control-toggle:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.control-toggle.active {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-color: #c7d2fe;
}

.control-toggle.active::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px 2px 0 0;
}

.control-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-toggle.active .control-icon {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.control-toggle.active .control-icon .v-icon {
  color: white !important;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.control-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  transition: color 0.3s ease;
}

.control-toggle.active .control-label {
  color: #4f46e5;
}

.results-count {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.control-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.clear-btn-inline {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.clear-btn-inline:hover {
  opacity: 1;
}

.expand-icon {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon.rotate-180 {
  transform: rotate(180deg);
}

/* Side-by-Side Expandable Panels */
.expandable-panels {
  display: flex;
  min-height: 0;
}

.panel-container {
  flex: 1;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 0;
  opacity: 0;
}

.panel-container.expanded {
  max-height: 500px;
  opacity: 1;
}

.search-panel,
.filters-panel {
  padding: 24px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  height: 100%;
  animation: slideInFromTop 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.filters-panel {
  border-right: none;
  border-left: 1px solid #e2e8f0;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Search Panel Styles */
.search-input {
  margin-bottom: 16px;
}

.search-input .v-field {
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input .v-field:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.search-input .v-field--focused {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
}

.search-results-info {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
}

.results-summary {
  margin-bottom: 12px;
}

.results-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.search-no-results {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
  text-align: center;
}

.no-results-text {
  margin-top: 8px;
  color: #92400e;
  font-size: 14px;
}

/* Filters Panel Styles */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.filter-select .v-field {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select .v-field:hover {
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.filter-select .v-field--focused {
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.15);
}

.active-filters-summary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 10px;
  padding: 16px;
  margin-top: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.summary-label {
  font-weight: 600;
  color: #374151;
}

.summary-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-text {
  color: #6b7280;
  font-size: 14px;
}

.results-chip {
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .controls-bar {
    flex-direction: column;
  }

  .control-toggle {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .control-toggle:last-child {
    border-bottom: none;
  }

  .expandable-panels {
    flex-direction: column;
  }

  .search-panel,
  .filters-panel {
    border-right: none;
    border-left: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .filters-panel {
    border-bottom: none;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-filters-btn {
    margin-top: 1rem;
    width: 100%;
  }
}
</style>

<style scoped>
/* Premium Dark Theme Compatibility for ReportViewer */

/* Main Content Area Dark Theme */
[data-theme="dark"] .cucumber-report-root {
  background: var(--theme-background) !important;
  color: var(--theme-text-primary) !important;
  min-height: 100vh;
}

[data-theme="dark"] .cucumber-report-content {
  background: var(--theme-background) !important;
  color: var(--theme-text-primary) !important;
}

/* Fix white backgrounds in main content */
[data-theme="dark"] .cucumber-report-content>* {
  background: transparent !important;
}

/* Ensure all child elements inherit dark theme */
[data-theme="dark"] .cucumber-report-root * {
  border-color: var(--theme-border) !important;
}

/* Modern Header Dark Theme with Premium Effects */
[data-theme="dark"] .modern-header {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .modern-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(52, 211, 153, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

[data-theme="dark"] .modern-header>* {
  position: relative;
  z-index: 1;
}

[data-theme="dark"] .brand-title {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .brand-subtitle {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .info-card {
  background: linear-gradient(145deg, rgba(74, 85, 104, 0.6) 0%, rgba(45, 55, 72, 0.8) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

[data-theme="dark"] .info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-color: rgba(96, 165, 250, 0.4);
}

[data-theme="dark"] .info-label {
  color: var(--theme-text-secondary);
  font-weight: 500;
}

[data-theme="dark"] .info-value {
  color: var(--theme-text-primary);
  font-weight: 600;
}

/* Premium Chart and Results Overview Dark Theme */
[data-theme="dark"] .results-chart {
  position: relative;
}

[data-theme="dark"] .results-chart::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

[data-theme="dark"] .results-chart .donut-chart circle:first-child {
  stroke: rgba(74, 85, 104, 0.8);
  stroke-width: 2;
}

[data-theme="dark"] .chart-center .success-percentage {
  color: #34d399;
  text-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
  font-weight: 800;
}

[data-theme="dark"] .chart-center .chart-label {
  color: var(--theme-text-secondary);
  font-weight: 500;
}

[data-theme="dark"] .time-card,
[data-theme="dark"] .duration-card {
  background: linear-gradient(145deg, rgba(74, 85, 104, 0.6) 0%, rgba(45, 55, 72, 0.8) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .time-card::before,
[data-theme="dark"] .duration-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent);
  transition: left 0.6s ease;
}

[data-theme="dark"] .time-card:hover,
[data-theme="dark"] .duration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-color: rgba(96, 165, 250, 0.4);
}

[data-theme="dark"] .time-card:hover::before,
[data-theme="dark"] .duration-card:hover::before {
  left: 100%;
}

[data-theme="dark"] .time-label,
[data-theme="dark"] .duration-label {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .time-value,
[data-theme="dark"] .duration-value {
  color: var(--theme-text-primary);
}

/* Controls Bar Dark Theme */
[data-theme="dark"] .controls-bar-container {
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
}

[data-theme="dark"] .controls-bar {
  background: var(--theme-surface);
}

[data-theme="dark"] .control-toggle {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
  color: var(--theme-text-primary);
}

[data-theme="dark"] .control-toggle:hover {
  background: var(--theme-hover-overlay);
  border-color: var(--theme-text-secondary);
  color: var(--theme-text-primary);
}

[data-theme="dark"] .control-toggle.active {
  background: rgba(96, 165, 250, 0.15);
  border-color: #60A5FA;
  color: var(--theme-text-primary);
}

[data-theme="dark"] .control-toggle.active .control-icon {
  background: linear-gradient(135deg, #60A5FA, #A78BFA);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
}

[data-theme="dark"] .control-toggle.active .control-icon .v-icon {
  color: white !important;
}

/* Simplified hover effects for control icons */
[data-theme="dark"] .control-toggle:hover .control-icon {
  background: rgba(96, 165, 250, 0.1);
  transform: scale(1.05);
  transition: all 0.3s ease;
}

/* Specific icon styling for better visibility - Override any conflicting styles */
[data-theme="dark"] .control-icon-search,
[data-theme="dark"] .control-icon-filter {
  transition: all 0.3s ease;
  -webkit-text-fill-color: initial !important;
  background: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
}

/* Fixed icon visibility - removed problematic gradient effects */
[data-theme="dark"] .control-toggle:not(.active) .control-icon-search,
[data-theme="dark"] .control-toggle:not(.active) .control-icon-filter {
  color: #94A3B8 !important;
  opacity: 1;
}

/* Hover state - solid colors instead of gradient */
[data-theme="dark"] .control-toggle:not(.active):hover .control-icon-search {
  color: #60A5FA !important;
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.3));
}

[data-theme="dark"] .control-toggle:not(.active):hover .control-icon-filter {
  color: #A78BFA !important;
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.3));
}

[data-theme="dark"] .control-label {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .control-content {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .expand-icon {
  color: var(--theme-text-secondary) !important;
}

/* Search and Filter Panels Dark Theme */
[data-theme="dark"] .expandable-panels {
  background: var(--theme-surface);
}

[data-theme="dark"] .panel-container {
  background: var(--theme-surface);
}

[data-theme="dark"] .search-panel,
[data-theme="dark"] .filters-panel {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .panel-content {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

/* Search Input Specific Styling - Complete Double Border Fix */
[data-theme="dark"] .search-input .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .search-input .v-field--focused {
  background: var(--theme-surface) !important;
  border: 1px solid #60A5FA !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .search-input .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .search-input .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.8 !important;
}

[data-theme="dark"] .search-input .v-field__prepend-inner {
  color: #60A5FA !important;
}

[data-theme="dark"] .search-input:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .search-input:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Override any Vuetify focus styles */
[data-theme="dark"] .search-input .v-text-field--focused .v-field {
  background: var(--theme-surface) !important;
  border: 1px solid #60A5FA !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Removed duplicate search input styles to prevent conflicts */

[data-theme="dark"] .search-results-info {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .results-breakdown .breakdown-item {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .filter-label {
  color: var(--theme-text-primary) !important;
}

/* Filter Select Styling - Complete Double Border Fix */
[data-theme="dark"] .filter-select .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .filter-select .v-field--focused {
  background: var(--theme-surface) !important;
  border: 1px solid #60A5FA !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .filter-select .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .filter-select .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.8 !important;
}

[data-theme="dark"] .filter-select .v-field__append-inner {
  color: #8B5CF6 !important;
}

[data-theme="dark"] .filter-select:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
  outline: none !important;
  box-shadow: none !important;
}

[data-theme="dark"] .filter-select:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Override any Vuetify focus styles for selects */
[data-theme="dark"] .filter-select .v-select--focused .v-field {
  background: var(--theme-surface) !important;
  border: 1px solid #60A5FA !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Removed duplicate filter select styles to prevent conflicts */

[data-theme="dark"] .filter-group {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .active-filters-summary {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .summary-label {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .summary-text {
  color: var(--theme-text-secondary);
}

/* Summary Bar Dark Theme */
[data-theme="dark"] .cucumber-summary-bar {
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
}

[data-theme="dark"] .env-label {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .env-value {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .stat {
  color: var(--theme-text-primary);
}

/* Features List Dark Theme */
[data-theme="dark"] .cucumber-features-list {
  background: var(--theme-background) !important;
}

/* Fix any remaining white backgrounds */
[data-theme="dark"] .cucumber-report-content,
[data-theme="dark"] .cucumber-report-content>div,
[data-theme="dark"] .cucumber-report-content>div>div {
  background: var(--theme-background) !important;
}

/* Ensure expansion panels have dark background */
[data-theme="dark"] .v-expansion-panels {
  background: var(--theme-background) !important;
}

[data-theme="dark"] .v-expansion-panels {
  background: var(--theme-background) !important;
}

[data-theme="dark"] .v-expansion-panel {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-expansion-panel-title {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-expansion-panel-title:hover {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-expansion-panel-text {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-expansion-panel-text__wrap {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .cucumber-feature-row {
  background: var(--theme-surface) !important;
  border-bottom: 1px solid var(--theme-border);
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .cucumber-feature-row:hover {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .feature-file {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .feature-tag {
  background: var(--theme-surface-variant);
  color: var(--theme-text-secondary);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .feature-description {
  color: var(--theme-text-secondary);
}

/* Scenario Blocks Dark Theme */
[data-theme="dark"] .cucumber-scenario-block {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .scenario-header-row {
  background: var(--theme-surface-variant) !important;
  border-bottom: 1px solid var(--theme-border);
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .scenario-header-row:hover {
  background: var(--theme-hover-overlay) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .scenario-title {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .scenario-header-content {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .scenario-title-row {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .scenario-duration {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .scenario-tag {
  background: var(--theme-surface-variant);
  color: var(--theme-text-secondary);
  border: 1px solid var(--theme-border);
}

/* Steps List Dark Theme */
[data-theme="dark"] .cucumber-steps-list {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .cucumber-step-row {
  border-bottom: 1px solid var(--theme-border-light);
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .cucumber-step-row:hover {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .step-keyword {
  color: #60A5FA;
  font-weight: 600;
}

[data-theme="dark"] .step-text {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .step-duration {
  color: var(--theme-text-secondary);
}

/* Error Display Dark Theme */
[data-theme="dark"] .step-error-block {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
}

[data-theme="dark"] .error-header {
  color: var(--theme-error);
}

[data-theme="dark"] .error-label {
  color: var(--theme-error);
}

[data-theme="dark"] .step-error-message {
  background: var(--theme-surface-variant);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .error-actions {
  background: var(--theme-surface-variant);
  border-top: 1px solid var(--theme-border);
}

/* Screenshot Display Dark Theme */
[data-theme="dark"] .step-screenshots {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .screenshots-header {
  color: var(--theme-info);
}

[data-theme="dark"] .screenshots-label {
  color: var(--theme-info);
}

[data-theme="dark"] .screenshot-thumbnail {
  border: 2px solid var(--theme-border);
  background: var(--theme-surface);
}

[data-theme="dark"] .screenshot-thumbnail:hover {
  border-color: var(--theme-info);
}

[data-theme="dark"] .thumbnail-overlay {
  background: rgba(0, 0, 0, 0.7);
}

/* Alert Messages Dark Theme */
[data-theme="dark"] .cucumber-alert {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
  color: var(--theme-text-primary);
}

[data-theme="dark"] .cucumber-alert.error {
  background: rgba(248, 113, 113, 0.1);
  border-color: var(--theme-error);
  color: var(--theme-error);
}

[data-theme="dark"] .cucumber-alert.info {
  background: rgba(34, 211, 238, 0.1);
  border-color: var(--theme-info);
  color: var(--theme-info);
}

[data-theme="dark"] .cucumber-alert.warning {
  background: rgba(251, 191, 36, 0.1);
  border-color: var(--theme-warning);
  color: var(--theme-warning);
}

/* Comprehensive Vuetify Component Overrides for Dark Theme */

/* Dropdown menus and overlays */
[data-theme="dark"] .v-overlay__content {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

[data-theme="dark"] .v-list {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-list-item {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-list-item:hover {
  background: var(--theme-hover-overlay) !important;
}

[data-theme="dark"] .v-list-item--active {
  background: rgba(96, 165, 250, 0.2) !important;
  color: #60A5FA !important;
}

/* Text fields */
[data-theme="dark"] .v-text-field {
  background: var(--theme-surface-variant) !important;
}

[data-theme="dark"] .v-text-field .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-text-field .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-text-field .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.7 !important;
}

[data-theme="dark"] .v-text-field .v-label {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-text-field:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-text-field:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
}

[data-theme="dark"] .v-select {
  background: var(--theme-surface-variant) !important;
}

[data-theme="dark"] .v-select .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-select .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-select .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.7 !important;
}

[data-theme="dark"] .v-select:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-select:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
}

[data-theme="dark"] .v-chip {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-btn {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-btn:hover {
  background: var(--theme-hover-overlay) !important;
}

/* Status-specific colors that work in both themes */
.cucumber-step-row .v-icon[color="success"] {
  color: var(--theme-success) !important;
}

.cucumber-step-row .v-icon[color="error"] {
  color: var(--theme-error) !important;
}

.cucumber-step-row .v-icon[color="warning"] {
  color: var(--theme-warning) !important;
}

.cucumber-step-row .v-icon[color="info"] {
  color: var(--theme-info) !important;
}

/* Responsive adjustments for dark theme */
@media (max-width: 768px) {
  [data-theme="dark"] .modern-header {
    background: var(--theme-background);
  }

  [data-theme="dark"] .controls-bar {
    background: var(--theme-surface);
    border-bottom: 1px solid var(--theme-border);
  }
}
</style>