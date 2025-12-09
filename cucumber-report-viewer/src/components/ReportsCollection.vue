<template>
  <div class="reports-collection-container">
    <v-card class="reports-collection-card">
      <!-- Enhanced Header with Title and Actions -->
      <v-card-title class="reports-collection-header">
        <div class="header-left">
          <v-icon color="primary" :size="$vuetify.display.mobile ? 20 : 24" class="header-icon">mdi-folder-multiple</v-icon>
          <div class="header-text">
            <h3 class="collection-title">Test Reports</h3>
            <p class="collection-subtitle" v-if="reportsCollection.length > 0">
              {{ reportsCollection.length }} report{{ reportsCollection.length !== 1 ? 's' : '' }} available
            </p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn 
            :size="$vuetify.display.mobile ? 'x-small' : 'small'" 
            variant="outlined" 
            color="primary" 
            @click="refreshReports" 
            :loading="loading"
            class="action-btn"
          >
            <v-icon :size="$vuetify.display.mobile ? 14 : 16" :class="$vuetify.display.mobile ? '' : 'mr-1'">mdi-refresh</v-icon>
            <span v-if="!$vuetify.display.mobile">Refresh</span>
          </v-btn>
          <v-btn 
            :size="$vuetify.display.mobile ? 'x-small' : 'small'" 
            variant="text" 
            color="secondary" 
            @click="showFilters = !showFilters"
            class="action-btn"
          >
            <v-icon :size="$vuetify.display.mobile ? 14 : 16" :class="$vuetify.display.mobile ? '' : 'mr-1'">mdi-filter</v-icon>
            <span v-if="!$vuetify.display.mobile">Filter</span>
          </v-btn>
        </div>
      </v-card-title>

      <!-- Enhanced Filters -->
      <v-expand-transition>
        <v-card-text v-show="showFilters" class="filters-section">
          <div class="filters-grid">
            <v-text-field 
              v-model="searchQuery" 
              placeholder="Search reports..." 
              prepend-inner-icon="mdi-magnify"
              variant="outlined" 
              density="compact" 
              clearable 
              hide-details 
              class="search-field" 
            />
            <v-select 
              v-model="statusFilter" 
              :items="statusOptions" 
              label="Status" 
              variant="outlined" 
              density="compact"
              clearable 
              hide-details 
              class="filter-select"
            />
            <v-select 
              v-model="sortBy" 
              :items="sortOptions" 
              label="Sort by" 
              variant="outlined" 
              density="compact"
              hide-details 
              class="filter-select"
            />
            <v-select 
              v-model="syncStatusFilter" 
              :items="syncStatusOptions" 
              label="Sync Status" 
              variant="outlined"
              density="compact" 
              clearable 
              hide-details 
              class="filter-select"
            />
          </div>
        </v-card-text>
      </v-expand-transition>

      <v-card-text class="reports-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate color="primary" class="mb-2"></v-progress-circular>
          <p>Loading reports...</p>
        </div>

        <!-- Error State -->
        <v-alert v-else-if="reportsCollectionError" type="error" class="mb-4">
          {{ reportsCollectionError }}
          <template #append>
            <v-btn size="small" variant="text" @click="refreshReports">
              Retry
            </v-btn>
          </template>
        </v-alert>

        <!-- Empty State -->
        <div v-else-if="filteredReports.length === 0" class="empty-state">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-folder-open</v-icon>
          <h4 class="mb-2">No reports found</h4>
          <p class="text-medium-emphasis">
            {{ reportsCollection.length === 0 ? 'Upload your first report to get started' : 'Try adjusting your filters'
            }}
          </p>
        </div>

        <!-- Enhanced Reports List -->
        <div v-else class="reports-grid">
          <v-card v-for="report in displayedReports" :key="report.id" class="report-card"
            :class="{ 'report-failed': report.failed > 0 }" @click="navigateToReport(report)">
            <v-card-text class="report-content">
              <!-- Mobile-First Header Layout -->
              <div class="report-header">
                <!-- Top Row: Status + Date + Actions -->
                <div class="report-header-top">
                  <div class="status-and-date">
                    <v-icon :color="getStatusColor(report)" size="20" class="status-icon">
                      {{ getStatusIcon(report) }}
                    </v-icon>
                    <span class="date-info">{{ formatDate(report.date) }}</span>
                  </div>
                  <div class="report-actions">
                    <v-btn :icon="isPublished(report) ? 'mdi-cloud-check' : 'mdi-cloud-upload'" size="small"
                      variant="text" :color="isPublished(report) ? 'success' : 'primary'"
                      @click.stop="togglePublishStatus(report)"
                      :title="isPublished(report) ? 'Unpublish from GitHub Pages' : 'Publish to GitHub Pages'"></v-btn>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" @click.stop></v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="navigateToReport(report)">
                          <v-list-item-title>
                            <v-icon size="16" class="mr-2">mdi-eye</v-icon>
                            View Report
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="downloadReport(report)">
                          <v-list-item-title>
                            <v-icon size="16" class="mr-2">mdi-download</v-icon>
                            Download JSON
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="togglePublishStatus(report)">
                          <v-list-item-title>
                            <v-icon size="16" class="mr-2">{{ isPublished(report) ? 'mdi-cloud-off' : 'mdi-cloud-upload'
                              }}</v-icon>
                            {{ isPublished(report) ? 'Unpublish' : 'Publish to GitHub Pages' }}
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteReport(report)" class="text-error" :disabled="report.deleting">
                          <v-list-item-title>
                            <v-icon size="16" class="mr-2">
                              {{ report.deleting ? 'mdi-loading mdi-spin' : 'mdi-delete' }}
                            </v-icon>
                            {{ report.deleting ? 'Deleting...' : 'Delete' }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </div>

                <!-- Second Row: Test Counts + Sync Status -->
                <div class="report-header-bottom">
                  <div class="test-counts-info">
                    <span class="test-count-item">
                      <span class="passed-count">{{ report.passed || 0 }}</span>
                      <span class="count-label">passed</span>
                    </span>
                    <span class="test-count-separator">•</span>
                    <span class="test-count-item">
                      <span class="failed-count">{{ report.failed || 0 }}</span>
                      <span class="count-label">failed</span>
                    </span>
                    <span class="test-count-separator">•</span>
                    <span class="test-count-item">
                      <span class="skipped-count">{{ report.skipped || 0 }}</span>
                      <span class="count-label">skipped</span>
                    </span>
                  </div>
                  <!-- Sync Status Indicators -->
                  <div class="sync-status-indicators">
                    <v-chip v-if="getReportSyncStatus(report) !== 'synced'" :color="getSyncStatusColor(report)"
                      size="x-small" variant="outlined" class="sync-status-chip">
                      <v-icon size="12" class="mr-1">{{ getSyncStatusIcon(report) }}</v-icon>
                      {{ getSyncStatusLabel(report) }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Enhanced Progress Bar -->
              <div class="progress-section">
                <v-progress-linear :model-value="getPassPercentage(report)" :color="getProgressColor(report)" height="6"
                  rounded class="mb-2"></v-progress-linear>
                <div class="progress-stats">
                  <span class="total-tests">{{ (report.passed || 0) + (report.failed || 0) + (report.skipped || 0) }}
                    total tests</span>
                  <span class="pass-rate-text" :class="getPassRateClass(report)">
                    {{ getPassPercentage(report).toFixed(1) }}% passed
                  </span>
                </div>
              </div>

              <!-- Tags Section -->
              <div v-if="report.tags && report.tags.length" class="tags-section">
                <v-chip v-for="tag in report.tags.slice(0, $vuetify.display.mobile ? 2 : 3)" :key="tag" size="x-small" variant="outlined"
                  class="tag-chip">
                  {{ tag }}
                </v-chip>
                <span v-if="report.tags.length > ($vuetify.display.mobile ? 2 : 3)" class="more-tags">
                  +{{ report.tags.length - ($vuetify.display.mobile ? 2 : 3) }} more
                </span>
              </div>

              <!-- Report Identifier -->
              <div class="report-identifier">
                <span class="json-filename">{{ extractJsonFilename(report.id) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Load More Button with Glassmorphism -->
        <div v-if="hasMoreReports" class="load-more-container">
          <button 
            @click="loadMore" 
            :disabled="loadingMore"
            class="load-more-btn"
          >
            <v-progress-circular 
              v-if="loadingMore" 
              indeterminate 
              color="white" 
              size="20"
              width="2"
            ></v-progress-circular>
            <template v-else>
              <v-icon size="20" class="mr-2">mdi-chevron-down</v-icon>
              <span>Load More</span>
              <span class="remaining-count">({{ allFilteredReports.length - displayedReportsCount }} remaining)</span>
            </template>
          </button>
        </div>

        <!-- End of List Indicator -->
        <div v-else-if="!hasMoreReports && displayedReports.length > 0" class="end-of-list-indicator">
          <v-icon size="24" color="grey-lighten-1">mdi-check-circle</v-icon>
          <p class="mt-2">All reports loaded ({{ allFilteredReports.length }} total)</p>
        </div>
      </v-card-text>
    </v-card>

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
import ReportService from '@/services/ReportService';
import DeletionService from '@/services/DeletionService';
import ConfirmationDialog from '@/components/ConfirmationDialog.vue';

export default {
  name: 'ReportsCollection',
  components: {
    ConfirmationDialog
  },
  data() {
    return {
      reportsCollection: [],
      reportsCollectionError: '',
      statistics: null,
      loading: false,
      showFilters: false,
      searchQuery: '',
      statusFilter: null,
      sortBy: 'date',
      deletionService: new DeletionService(),
      // Infinite scroll / pagination
      displayedReportsCount: 4, // Start with 4 reports
      reportsPerPage: 4, // Load 4 more each time
      loadingMore: false,
      statusOptions: [
        { title: 'All Passed', value: 'passed' },
        { title: 'Has Failures', value: 'failed' },
        { title: 'Mixed Results', value: 'mixed' }
      ],
      sortOptions: [
        { title: 'Date (Newest)', value: 'date' },
        { title: 'Name', value: 'name' },
        { title: 'Duration', value: 'duration' },
        { title: 'Scenarios', value: 'scenarios' },
        { title: 'Pass Rate', value: 'passRate' }
      ],
      syncStatusFilter: null,
      syncStatusOptions: [
        { title: 'Synced', value: 'synced' },
        { title: 'Local Only', value: 'local-only' },
        { title: 'Published Only', value: 'published-only' },
        { title: 'Deleted', value: 'deleted' },
        { title: 'Unknown', value: 'unknown' }
      ],
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
    };
  },

  mounted() {
    this.fetchReports();

    // Listen for deletion events from other components
    window.addEventListener('reportDeleted', this.handleReportDeleted);
    window.addEventListener('reportRestored', this.handleReportRestored);
  },

  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('reportDeleted', this.handleReportDeleted);
    window.removeEventListener('reportRestored', this.handleReportRestored);
  },
  
  watch: {
    // Reset displayed count when filters change
    searchQuery() {
      this.displayedReportsCount = this.reportsPerPage;
    },
    statusFilter() {
      this.displayedReportsCount = this.reportsPerPage;
    },
    syncStatusFilter() {
      this.displayedReportsCount = this.reportsPerPage;
    },
    sortBy() {
      this.displayedReportsCount = this.reportsPerPage;
    }
  },

  computed: {
    allFilteredReports() {
      let reports = [...this.reportsCollection];

      // Filter out empty reports (no features, scenarios, or steps)
      reports = reports.filter(report => {
        const hasData = (report.features > 0 || report.scenarios > 0 || report.steps > 0);
        if (!hasData) {
          console.log(`Filtering out empty report: ${report.id}`);
        }
        return hasData;
      });

      // Apply search filter
      if (this.searchQuery) {
        reports = ReportService.searchReports(reports, this.searchQuery);
      }

      // Apply status filter
      if (this.statusFilter) {
        reports = ReportService.filterReports(reports, { status: [this.statusFilter] });
      }

      // Apply sync status filter
      if (this.syncStatusFilter) {
        reports = reports.filter(report => {
          return this.getReportSyncStatus(report) === this.syncStatusFilter;
        });
      }

      // Apply sorting
      reports = ReportService.sortReports(reports, this.sortBy);

      return reports;
    },
    
    // Display only a subset of reports for infinite scroll
    displayedReports() {
      return this.allFilteredReports.slice(0, this.displayedReportsCount);
    },
    
    // Check if there are more reports to load
    hasMoreReports() {
      return this.displayedReportsCount < this.allFilteredReports.length;
    },
    
    // For backward compatibility
    filteredReports() {
      return this.allFilteredReports;
    }
  },
  methods: {
    // Load more reports
    loadMore() {
      if (this.loadingMore || !this.hasMoreReports) return;

      this.loadingMore = true;
      
      // Simulate a small delay for smooth UX
      setTimeout(() => {
        this.displayedReportsCount += this.reportsPerPage;
        this.loadingMore = false;
        console.log(`Loaded more reports. Now showing: ${this.displayedReportsCount} of ${this.allFilteredReports.length}`);
      }, 300);
    },
    async fetchReports() {
      this.loading = true;
      this.reportsCollectionError = '';

      try {
        // Try to load enhanced index first
        const indexData = await ReportService.loadIndex();

        if (indexData.reports) {
          this.reportsCollection = indexData.reports;
          this.statistics = indexData.statistics;
        } else if (Array.isArray(indexData)) {
          // Fallback to old format
          this.reportsCollection = indexData;
        }

        // Load statistics separately if not in index
        if (!this.statistics) {
          this.statistics = await ReportService.loadStatistics();
        }

      } catch (error) {
        this.reportsCollectionError = error.message || 'Failed to load reports collection.';

        // Fallback to localStorage
        try {
          const localIndex = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
          if (localIndex.length > 0) {
            this.reportsCollection = localIndex;
          }
        } catch (e) {
          console.error('Failed to load from localStorage:', e);
        }
      } finally {
        this.loading = false;
      }
    },

    async refreshReports() {
      ReportService.clearCache();
      this.displayedReportsCount = this.reportsPerPage; // Reset to initial count
      await this.fetchReports();
    },

    navigateToReport(report) {
      this.$router.push({
        name: 'Report',
        params: { id: report.id },
        query: { t: Date.now() }
      });
    },

    async downloadReport(report) {
      try {
        // Try to fetch the report JSON file
        const possiblePaths = [
          `${process.env.BASE_URL || '/'}TestResultsJsons/${report.id}.json`,
          `/TestResults/TestResultsJsons/${report.id}.json`,
          `/TestResultsJsons/${report.id}.json`
        ];

        let reportData = null;
        let successPath = null;

        // First, try to get from localStorage
        const localData = localStorage.getItem('uploaded-report-' + report.id);
        if (localData) {
          reportData = localData;
          successPath = 'localStorage';
          console.log('✅ Found report in localStorage');
        } else {
          // Try to fetch from server
          for (const path of possiblePaths) {
            try {
              const response = await fetch(path);
              if (response.ok) {
                reportData = await response.text();
                successPath = path;
                console.log(`✅ Found report at: ${path}`);
                break;
              }
            } catch (e) {
              // Continue to next path
            }
          }
        }

        if (!reportData) {
          this.showErrorMessage(`Could not find report file for ${report.id}`);
          return;
        }

        // Create blob and download
        const blob = new Blob([reportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.id}.json`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showSuccessMessage(`Downloaded ${report.id}.json successfully!`);
        console.log(`✅ Downloaded report: ${report.id}.json from ${successPath}`);
      } catch (error) {
        console.error('Error downloading report:', error);
        this.showErrorMessage(`Failed to download report: ${error.message}`);
      }
    },

    async deleteReport(report) {
      try {
        // Show confirmation dialog first
        const confirmed = await this.showDeleteConfirmation(report);
        if (!confirmed) {
          return;
        }

        // Show loading state
        this.setReportLoading(report.id, true);

        // Use the comprehensive DeletionService
        const result = await this.deletionService.deleteReport(report.id, {
          confirm: false, // We already confirmed above
          showFeedback: false // We'll handle feedback ourselves
        });

        if (result.success && !result.cancelled) {
          // Update local collection immediately
          this.reportsCollection = this.reportsCollection.filter(r => r.id !== report.id);

          // Remove from localStorage (for uploaded reports)
          let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
          index = index.filter(r => r.id !== report.id);
          localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
          localStorage.removeItem('uploaded-report-' + report.id);

          // Show success message
          this.showSuccessMessage(result.deletionType === 'soft'
            ? 'Report hidden from collection'
            : 'Report deleted successfully'
          );

          // Emit event for parent components
          this.$emit('report-deleted', {
            report,
            result,
            deletionType: result.deletionType
          });

          console.log(`✅ Report ${report.id} deleted successfully (${result.deletionType})`);
        }

      } catch (error) {
        console.error('Failed to delete report:', error);
        this.showErrorMessage(`Failed to delete report: ${error.message}`);
      } finally {
        this.setReportLoading(report.id, false);
      }
    },

    async showDeleteConfirmation(report) {
      return new Promise((resolve) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        this.confirmationDialog = {
          show: true,
          title: isLocalhost ? 'Delete Report' : 'Hide Report',
          message: isLocalhost
            ? 'This will permanently delete the report file from the server.'
            : 'This will hide the report from the collection. The file will remain until next deployment.',
          details: `Report: ${report.name || report.id}`,
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

    setReportLoading(reportId, loading) {
      // Find the report and set loading state
      const reportIndex = this.reportsCollection.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        // Vue 3 compatible way to set reactive property
        this.reportsCollection[reportIndex] = {
          ...this.reportsCollection[reportIndex],
          deleting: loading
        };
      }
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

    // Event handlers for deletion events
    handleReportDeleted(event) {
      const { reportId, result } = event.detail;

      // Clear cache to ensure fresh data
      ReportService.clearCache();

      // Remove from local collection if it exists
      this.reportsCollection = this.reportsCollection.filter(r => r.id !== reportId);

      // Also remove from localStorage
      let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      index = index.filter(r => r.id !== reportId);
      localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
      localStorage.removeItem('uploaded-report-' + reportId);

      // Show success message
      this.showSuccessMessage(result.deletionType === 'soft'
        ? 'Report hidden from collection'
        : 'Report deleted successfully'
      );

      console.log(`📢 Received deletion event for report: ${reportId}`);
    },

    handleReportRestored(event) {
      const { reportId } = event.detail;

      // Refresh the reports list to show restored report
      this.refreshReports();

      // Show success message
      this.showSuccessMessage('Report restored successfully');

      console.log(`📢 Received restoration event for report: ${reportId}`);
    },

    // Sync Status Methods for UI Indicators
    getReportSyncStatus(report) {
      // Check if report exists in different storage locations
      const isInLocalStorage = localStorage.getItem('uploaded-report-' + report.id) !== null;
      const isPublished = this.isPublished(report);
      const isDeleted = this.isReportDeleted(report);

      if (isDeleted) {
        return 'deleted';
      } else if (isInLocalStorage && isPublished) {
        return 'synced';
      } else if (isInLocalStorage && !isPublished) {
        return 'local-only';
      } else if (!isInLocalStorage && isPublished) {
        return 'published-only';
      } else {
        return 'unknown';
      }
    },

    getSyncStatusColor(report) {
      const status = this.getReportSyncStatus(report);
      switch (status) {
        case 'synced': return 'success';
        case 'local-only': return 'info';
        case 'published-only': return 'warning';
        case 'deleted': return 'error';
        case 'unknown': return 'grey';
        default: return 'grey';
      }
    },

    getSyncStatusIcon(report) {
      const status = this.getReportSyncStatus(report);
      switch (status) {
        case 'synced': return 'mdi-check-circle';
        case 'local-only': return 'mdi-laptop';
        case 'published-only': return 'mdi-cloud';
        case 'deleted': return 'mdi-delete';
        case 'unknown': return 'mdi-help-circle';
        default: return 'mdi-help-circle';
      }
    },

    getSyncStatusLabel(report) {
      const status = this.getReportSyncStatus(report);
      switch (status) {
        case 'synced': return 'Synced';
        case 'local-only': return 'Local Only';
        case 'published-only': return 'Published';
        case 'deleted': return 'Deleted';
        case 'unknown': return 'Unknown';
        default: return 'Unknown';
      }
    },

    isReportDeleted(report) {
      try {
        const deletedReports = JSON.parse(localStorage.getItem('deleted-reports') || '[]');
        return deletedReports.some(deleted => deleted.reportId === report.id);
      } catch (e) {
        return false;
      }
    },

    getStatusIcon(report) {
      if (!report.steps || report.steps === 0) return 'mdi-help-circle';
      if (report.failed > 0) return 'mdi-close-circle';
      if (report.passed > 0) return 'mdi-check-circle';
      return 'mdi-pause-circle';
    },

    getStatusColor(report) {
      if (!report.steps || report.steps === 0) return 'grey';
      if (report.failed > 0) return 'error';
      if (report.passed > 0) return 'success';
      return 'warning';
    },

    getProgressColor(report) {
      if (!report.steps || report.steps === 0) return 'grey';
      const passRate = (report.passed / report.steps) * 100;
      if (passRate >= 90) return 'success';
      if (passRate >= 70) return 'warning';
      return 'error';
    },

    getPassPercentage(report) {
      if (!report.steps || report.steps === 0) return 0;
      return (report.passed / report.steps) * 100;
    },

    getPassRateClass(report) {
      const passRate = this.getPassPercentage(report);
      if (passRate >= 90) return 'pass-rate-excellent';
      if (passRate >= 70) return 'pass-rate-good';
      if (passRate >= 50) return 'pass-rate-warning';
      return 'pass-rate-poor';
    },

    formatReportTitle(name) {
      if (!name) return 'Untitled Report';

      // Enhanced cleaning patterns for better readability
      let cleanName = name
        // Remove "Admin Client Settings Page" entirely
        .replace(/^Admin\s+Client\s+Settings\s+Page\s*\|\|\s*/i, '')
        // Remove other common admin patterns
        .replace(/^(Admin\s+|Administration\s+)/i, '')
        // Remove "|| Test Scenarios" suffix
        .replace(/\s*\|\|\s*Test\s+Scenarios?$/i, '')
        // Remove standalone "Test Scenarios"
        .replace(/\s*Test\s+Scenarios?$/i, '')
        // Remove "Page" suffix
        .replace(/\s*Page$/i, '')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();

      // If cleaned name is too short, use a fallback approach
      if (cleanName.length < 3) {
        // Try to extract meaningful part before ||
        const beforePipe = name.split('||')[0]?.trim();
        if (beforePipe && beforePipe.length > 3) {
          cleanName = beforePipe
            .replace(/^(Admin\s+|Administration\s+)/i, '')
            .replace(/\s*Page$/i, '')
            .trim();
        } else {
          // Last resort: use original name but clean it up
          cleanName = name.replace(/\|\|/g, '•').trim();
        }
      }

      // Smart truncation with word boundaries
      if (cleanName.length > 35) {
        const words = cleanName.split(' ');
        let truncated = '';
        for (const word of words) {
          if ((truncated + word).length > 32) break;
          truncated += (truncated ? ' ' : '') + word;
        }
        cleanName = truncated + (truncated.length < cleanName.length ? '...' : '');
      }

      // Convert to professional title case
      return this.toTitleCase(cleanName) || 'Test Report';
    },

    formatReportId(id) {
      if (!id) return '';

      // Extract meaningful parts from ID
      const parts = id.split('-');
      const datePart = parts.slice(-1)[0]; // Last part is usually timestamp

      if (datePart && datePart.includes('T')) {
        try {
          const date = new Date(datePart.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
          return `#${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}`;
        } catch (e) {
          // Fallback to simple ID
        }
      }

      // Fallback: use last 8 characters
      return `#${id.slice(-8)}`;
    },

    showReportId(report) {
      // Show ID only if the title was significantly shortened or for disambiguation
      return report.name && (
        report.name.length > 45 ||
        this.reportsCollection.filter(r =>
          this.formatReportTitle(r.name) === this.formatReportTitle(report.name)
        ).length > 1
      );
    },

    toTitleCase(str) {
      return str.replace(/\w\S*/g, (txt) => {
        // Don't capitalize common words unless they're the first word
        const lowerWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const word = txt.toLowerCase();

        if (lowerWords.includes(word) && str.indexOf(txt) !== 0) {
          return word;
        }

        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },

    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;

        // Calculate time differences
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Return consistent relative time format
        if (diffMinutes < 1) {
          return 'Just now';
        } else if (diffMinutes < 60) {
          return `${diffMinutes} min ago`;
        } else if (diffHours < 24) {
          return `${diffHours} hr ago`;
        } else if (diffDays === 1) {
          return '1 day ago';
        } else if (diffDays < 30) {
          return `${diffDays} days ago`;
        } else {
          // For very old reports, show actual date
          return date.toLocaleDateString();
        }
      } catch (e) {
        return 'Unknown date';
      }
    },

    extractJsonFilename(id) {
      if (!id) return '';

      // Extract the last part after the last dash (timestamp part)
      const parts = id.split('-');
      const lastPart = parts[parts.length - 1]; // Gets "735Z" or "010Z"

      // Return the last 4 characters (like "735Z", "010Z")
      return lastPart ? lastPart.slice(-4).toUpperCase() : '';
    },

    formatDuration(duration) {
      if (!duration || duration === 0) return '0s';

      if (duration < 60) {
        return `${duration.toFixed(1)}s`;
      } else if (duration < 3600) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}m ${seconds}s`;
      } else {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes}m`;
      }
    },

    // Selective Publishing Feature Methods
    isPublished(report) {
      try {
        const publishedReports = JSON.parse(localStorage.getItem('published-reports-index') || '[]');
        return publishedReports.some(pub => pub.id === report.id);
      } catch (e) {
        console.error('Error checking published status:', e);
        return false;
      }
    },

    async togglePublishStatus(report) {
      try {
        const publishedReports = JSON.parse(localStorage.getItem('published-reports-index') || '[]');
        const isCurrentlyPublished = this.isPublished(report);

        if (isCurrentlyPublished) {
          // Unpublish: Remove from published reports
          const updatedPublished = publishedReports.filter(pub => pub.id !== report.id);
          localStorage.setItem('published-reports-index', JSON.stringify(updatedPublished));

          // Show confirmation
          this.$emit('report-unpublished', report);
          console.log(`Report ${report.id} unpublished from GitHub Pages`);

        } else {
          // Publish: Add to published reports
          const publishedReport = {
            ...report,
            publishedAt: new Date().toISOString(),
            publishStatus: 'published'
          };

          publishedReports.unshift(publishedReport);
          localStorage.setItem('published-reports-index', JSON.stringify(publishedReports));

          // Show confirmation
          this.$emit('report-published', report);
          console.log(`Report ${report.id} published to GitHub Pages`);
        }

        // Update GitHub Pages index and save file for GitHub Pages
        // Only download files when user explicitly publishes (not on automatic updates)
        const shouldDownload = !isCurrentlyPublished; // Download only when publishing, not unpublishing
        await this.updateGitHubPagesIndex(shouldDownload);
        await this.saveReportForGitHubPages(report);

        // Force reactivity update
        this.$forceUpdate();

      } catch (error) {
        console.error('Error toggling publish status:', error);
        alert('Failed to update publish status. Please try again.');
      }
    },

    async updateGitHubPagesIndex(shouldDownload = false) {
      try {
        const publishedReports = JSON.parse(localStorage.getItem('published-reports-index') || '[]');

        // Create GitHub Pages compatible index
        const githubPagesIndex = {
          reports: publishedReports.map(report => ({
            id: report.id,
            name: report.name,
            date: report.date,
            features: report.features || 0,
            scenarios: report.scenarios || 0,
            steps: report.steps || 0,
            passed: report.passed || 0,
            failed: report.failed || 0,
            skipped: report.skipped || 0,
            duration: report.duration || 0,
            tags: report.tags || [],
            size: report.size || 0,
            publishedAt: report.publishedAt,
            source: 'published'
          })),
          statistics: this.calculatePublishedStatistics(publishedReports),
          version: '1.0.0-published',
          lastUpdated: new Date().toISOString()
        };

        // Store GitHub Pages index locally
        localStorage.setItem('github-pages-index', JSON.stringify(githubPagesIndex));

        // Only download files when explicitly requested (when user clicks publish button)
        if (shouldDownload && publishedReports.length > 0) {
          console.log('🔽 Triggering GitHub Pages files download:', publishedReports.length, 'reports');
          this.downloadGitHubPagesFiles(githubPagesIndex, publishedReports);
        } else {
          console.log('📋 GitHub Pages index updated without download. shouldDownload:', shouldDownload, 'publishedCount:', publishedReports.length);
        }

        console.log('GitHub Pages index updated with', publishedReports.length, 'published reports');

      } catch (error) {
        console.error('Error updating GitHub Pages index:', error);
      }
    },

    downloadGitHubPagesFiles(githubPagesIndex, publishedReports) {
      try {
        // Only download if there are actually published reports
        if (publishedReports.length === 0) {
          console.log('No published reports to download');
          return;
        }

        // Download the index.json file
        const indexBlob = new Blob([JSON.stringify(githubPagesIndex, null, 2)], { 
          type: 'application/json' 
        });
        this.downloadFile(indexBlob, 'index.json');

        // Show instructions to user
        this.showSuccessMessage(
          `📁 Downloaded index.json with ${publishedReports.length} reports. ` +
          `Upload this file to your GitHub Pages TestResultsJsons/ folder to publish the reports.`
        );

        // Also download individual report files if they exist in localStorage
        publishedReports.forEach(report => {
          const reportData = localStorage.getItem('uploaded-report-' + report.id);
          if (reportData) {
            const reportBlob = new Blob([reportData], { type: 'application/json' });
            this.downloadFile(reportBlob, `${report.id}.json`);
          }
        });

      } catch (error) {
        console.error('Error creating GitHub Pages files:', error);
      }
    },

    downloadFile(blob, filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    async saveReportForGitHubPages(report) {
      try {
        // Get the actual report data from localStorage
        const reportData = localStorage.getItem('uploaded-report-' + report.id);
        if (reportData) {
          // Save to uploads folder and trigger index generation
          await this.saveToUploadsFolder(report.id, reportData);
        }
      } catch (error) {
        console.error('Error saving report for GitHub Pages:', error);
        alert('Failed to publish report to GitHub Pages. Please try again.');
      }
    },

    async saveToUploadsFolder(reportId, reportData) {
      try {
        // Since we can't directly write files from browser, we'll use a different approach
        // Create a form to submit the data to a backend endpoint or use the File System Access API

        if ('showDirectoryPicker' in window) {
          // Use File System Access API (modern browsers)
          await this.saveWithFileSystemAPI(reportId, reportData);
        } else {
          // Fallback: Download file with instructions
          await this.downloadWithInstructions(reportId, reportData);
        }
      } catch (error) {
        console.error('Error saving to uploads folder:', error);
        // Fallback to download
        await this.downloadWithInstructions(reportId, reportData);
      }
    },

    async saveWithFileSystemAPI(reportId, reportData) {
      try {
        // Request directory access
        const dirHandle = await window.showDirectoryPicker();

        // Create the file
        const fileHandle = await dirHandle.getFileHandle(`${reportId}.json`, { create: true });
        const writable = await fileHandle.createWritable();

        // Write the data
        await writable.write(reportData);
        await writable.close();

        console.log(`✅ Report ${reportId} saved to uploads folder`);
        alert(`Report published successfully! The file has been saved and will be included in the next GitHub Pages update.`);

        // Trigger index generation
        await this.triggerIndexGeneration();

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('User cancelled directory selection');
        } else {
          throw error;
        }
      }
    },

    async downloadWithInstructions(reportId, reportData) {
      // Create a downloadable file with clear instructions
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📁 Report ${reportId} downloaded for manual upload`);

      // Show detailed instructions
      const instructions = `
📋 To complete GitHub Pages publishing:

1. Save the downloaded file to: 
   cucumber-report-viewer/public/TestResultsJsons/

2. Run the index generator:
   cd cucumber-report-viewer/public/TestResultsJsons
   node generate-index-enhanced.js

3. Commit and push the changes:
   git add .
   git commit -m "Add new test report"
   git push

The GitHub workflow will automatically update your GitHub Pages site!
      `;

      alert(instructions);
    },

    async triggerIndexGeneration() {
      try {
        // This would ideally call the generate-index-enhanced.js script
        // Since we can't run Node.js from browser, we'll show instructions
        console.log('🔄 Index generation needed - run generate-index-enhanced.js');

        // You could implement a backend endpoint here to trigger the script
        // For now, we'll just log the instruction
      } catch (error) {
        console.error('Error triggering index generation:', error);
      }
    },

    calculatePublishedStatistics(publishedReports) {
      if (!publishedReports.length) {
        return {
          totalReports: 0,
          totalScenarios: 0,
          totalSteps: 0,
          totalPassed: 0,
          totalFailed: 0,
          totalSkipped: 0,
          passRate: '0.00',
          failRate: '0.00',
          skipRate: '0.00'
        };
      }

      const totals = publishedReports.reduce((acc, report) => ({
        scenarios: acc.scenarios + (report.scenarios || 0),
        steps: acc.steps + (report.steps || 0),
        passed: acc.passed + (report.passed || 0),
        failed: acc.failed + (report.failed || 0),
        skipped: acc.skipped + (report.skipped || 0)
      }), { scenarios: 0, steps: 0, passed: 0, failed: 0, skipped: 0 });

      const passRate = totals.steps > 0 ? (totals.passed / totals.steps * 100).toFixed(2) : '0.00';
      const failRate = totals.steps > 0 ? (totals.failed / totals.steps * 100).toFixed(2) : '0.00';
      const skipRate = totals.steps > 0 ? (totals.skipped / totals.steps * 100).toFixed(2) : '0.00';

      return {
        totalReports: publishedReports.length,
        totalScenarios: totals.scenarios,
        totalSteps: totals.steps,
        totalPassed: totals.passed,
        totalFailed: totals.failed,
        totalSkipped: totals.skipped,
        passRate,
        failRate,
        skipRate
      };
    },

    // Add event handlers
    handleReportDeleted(event) {
      const { reportId } = event.detail;
      console.log(`🗑️ Report ${reportId} deleted - refreshing collection`);
      this.refreshReports();
    },

    handleReportRestored(event) {
      const { reportId } = event.detail;
      console.log(`♻️ Report ${reportId} restored - refreshing collection`);
      this.refreshReports();
    }
  },

  async mounted() {
    await this.fetchReports();

    // Listen for deletion events to refresh the reports list
    window.addEventListener('reportDeleted', this.handleReportDeleted);
    window.addEventListener('reportRestored', this.handleReportRestored);
  },

  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('reportDeleted', this.handleReportDeleted);
    window.removeEventListener('reportRestored', this.handleReportRestored);
  }
};
</script>

<style scoped>
/* Enhanced Reports Collection Styles */
.reports-collection-container {
  width: 100%;
  margin: 0 auto 2rem auto;
  padding: 0;
  display: flex;
  justify-content: center;
}

.reports-collection-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  width: 100%;
  max-width: 1200px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

/* Header Styles */
.reports-collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collection-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.collection-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* Filters Section */
.filters-section {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  margin: 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  align-items: end;
}

.search-field {
  min-width: 300px;
}

/* Content Area */
.reports-content {
  padding: 24px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state h4 {
  color: #374151;
  margin-bottom: 8px;
}

/* Reports Grid - Expanded to show more reports */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.report-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: #ffffff;
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.report-card:nth-child(1) {
  animation-delay: 0.1s;
}

.report-card:nth-child(2) {
  animation-delay: 0.2s;
}

.report-card:nth-child(3) {
  animation-delay: 0.3s;
}

.report-card:nth-child(4) {
  animation-delay: 0.4s;
}

.report-card:nth-child(5) {
  animation-delay: 0.5s;
}

.report-card:nth-child(6) {
  animation-delay: 0.6s;
}

.report-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.2);
  transform: translateY(-4px) scale(1.02);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-card.report-failed {
  border-left: 4px solid #ef4444;
}

.report-content {
  padding: 20px;
}

/* Report Header */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.report-title-section {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.title-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.report-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-id {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  opacity: 0.8;
  margin: 0;
}

/* Optimized Report Summary */
.report-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

/* Pass Rate Color Classes */
.pass-rate-excellent {
  color: #059669 !important;
}

.pass-rate-good {
  color: #0891b2 !important;
}

.pass-rate-warning {
  color: #d97706 !important;
}

.pass-rate-poor {
  color: #dc2626 !important;
}

/* Compact Progress Section */
.compact-progress-section {
  margin-bottom: 12px;
}

.compact-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 4px;
}

.total-tests {
  color: #64748b;
}

.pass-rate-text {
  font-weight: 600;
}

/* Tags Section */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.more-tags {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Report Identifier */
.report-identifier {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.json-filename {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

/* Single Line Header: Status + Date + Pass Rate + Menu */
.report-header-single-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  gap: 12px;
}

.status-icon {
  flex-shrink: 0;
}

.date-info {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  flex: 1;
  text-align: left;
}

.test-counts-info {
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
  text-align: right;
  min-width: 80px;
  font-family: 'Courier New', monospace;
}

.passed-count {
  color: #059669;
}

.failed-count {
  color: #dc2626;
}

.skipped-count {
  color: #d97706;
}

/* Report Actions */
.report-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .reports-collection-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .search-field {
    min-width: auto;
  }

  .reports-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .report-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}

@media (max-width: 480px) {
  .reports-content {
    padding: 16px;
  }

  .reports-collection-header {
    padding: 16px;
  }

  .report-content {
    padding: 16px;
  }

  .report-header {
    flex-direction: column;
    gap: 12px;
  }
}

/* Animation Classes */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Custom Vuetify Overrides */
.v-card-title {
  padding: 0 !important;
}

.v-card-text {
  padding: 0 !important;
}

.v-progress-linear {
  border-radius: 3px !important;
}

/* Dark Theme Compatibility for ReportsCollection */

/* Main Container Dark Theme */
[data-theme="dark"] .reports-collection-container {
  background: transparent;
}

[data-theme="dark"] .reports-collection-card {
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 8px 32px var(--theme-shadow);
}

/* Header Dark Theme */
[data-theme="dark"] .reports-collection-header {
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
}

[data-theme="dark"] .collection-title {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .collection-subtitle {
  color: var(--theme-text-secondary);
}

/* Filters Section Dark Theme */
[data-theme="dark"] .filters-section {
  background: var(--theme-surface-variant);
  border-bottom: 1px solid var(--theme-border);
}

[data-theme="dark"] .search-field {
  background: var(--theme-surface) !important;
}

[data-theme="dark"] .search-field .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .search-field .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .search-field .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.8 !important;
}

[data-theme="dark"] .search-field:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .search-field:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
  box-shadow: none !important;
  outline: none !important;
}

[data-theme="dark"] .v-select {
  background: var(--theme-surface) !important;
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
  opacity: 0.8 !important;
}

[data-theme="dark"] .v-select:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-select:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Content Area Dark Theme */
[data-theme="dark"] .reports-content {
  background: var(--theme-surface);
}

/* Loading State Dark Theme */
[data-theme="dark"] .loading-state {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .loading-state p {
  color: var(--theme-text-secondary);
}

/* Empty State Dark Theme */
[data-theme="dark"] .empty-state {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .empty-state h4 {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .empty-state p {
  color: var(--theme-text-secondary);
}

/* Report Cards Dark Theme */
[data-theme="dark"] .report-card {
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 4px 16px var(--theme-shadow);
}

[data-theme="dark"] .report-card:hover {
  border-color: #60A5FA;
  box-shadow: 0 12px 35px rgba(96, 165, 250, 0.2);
  background: var(--theme-surface-variant);
}

[data-theme="dark"] .report-card.report-failed {
  border-left: 4px solid var(--theme-error);
}

[data-theme="dark"] .report-content {
  background: var(--theme-surface);
}

/* Report Header Dark Theme */
[data-theme="dark"] .report-header-single-line {
  border-bottom: 1px solid var(--theme-border-light);
}

[data-theme="dark"] .date-info {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .test-counts-info {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .passed-count {
  color: var(--theme-success);
}

[data-theme="dark"] .failed-count {
  color: var(--theme-error);
}

[data-theme="dark"] .skipped-count {
  color: var(--theme-warning);
}

/* Progress Section Dark Theme */
[data-theme="dark"] .compact-progress-section {
  background: var(--theme-surface);
}

[data-theme="dark"] .compact-stats {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .total-tests {
  color: var(--theme-text-secondary);
}

[data-theme="dark"] .pass-rate-text {
  color: var(--theme-text-primary);
}

/* Pass Rate Classes for Dark Theme */
[data-theme="dark"] .pass-rate-excellent {
  color: var(--theme-success) !important;
}

[data-theme="dark"] .pass-rate-good {
  color: #22D3EE !important;
}

[data-theme="dark"] .pass-rate-warning {
  color: var(--theme-warning) !important;
}

[data-theme="dark"] .pass-rate-poor {
  color: var(--theme-error) !important;
}

/* Tags Section Dark Theme */
[data-theme="dark"] .tags-section {
  background: var(--theme-surface);
}

[data-theme="dark"] .v-chip {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .more-tags {
  color: var(--theme-text-secondary);
}

/* Report Identifier Dark Theme */
[data-theme="dark"] .report-identifier {
  border-top: 1px solid var(--theme-border-light);
}

[data-theme="dark"] .json-filename {
  background: var(--theme-surface-variant);
  color: var(--theme-text-secondary);
  border: 1px solid var(--theme-border);
}

/* Report Actions Dark Theme */
[data-theme="dark"] .report-actions {
  background: var(--theme-surface);
}

[data-theme="dark"] .v-btn {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-btn:hover {
  background: var(--theme-hover-overlay) !important;
}

/* Menu and List Items Dark Theme */
[data-theme="dark"] .v-menu .v-list {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-list-item {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-list-item:hover {
  background: var(--theme-hover-overlay) !important;
}

[data-theme="dark"] .v-list-item-title {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-list-item.text-error {
  color: var(--theme-error) !important;
}

/* Progress Linear Dark Theme */
[data-theme="dark"] .v-progress-linear {
  background: var(--theme-surface-variant) !important;
}

/* Alert Dark Theme */
[data-theme="dark"] .v-alert {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-alert.v-alert--type-error {
  background: rgba(248, 113, 113, 0.1) !important;
  color: var(--theme-error) !important;
  border-color: var(--theme-error) !important;
}

/* Animation Keyframes for Dark Theme */
@keyframes fadeInUpDark {
  from {
    opacity: 0;
    transform: translateY(20px);
    background: var(--theme-surface-variant);
  }

  to {
    opacity: 1;
    transform: translateY(0);
    background: var(--theme-surface);
  }
}

[data-theme="dark"] .report-card {
  animation: fadeInUpDark 0.5s ease-out forwards;
}

/* Responsive Dark Theme Adjustments */
@media (max-width: 768px) {
  [data-theme="dark"] .reports-collection-header {
    background: var(--theme-surface);
    border-bottom: 1px solid var(--theme-border);
  }

  [data-theme="dark"] .filters-section {
    background: var(--theme-surface-variant);
  }

  [data-theme="dark"] .reports-content {
    background: var(--theme-background);
  }
}

@media (max-width: 480px) {
  [data-theme="dark"] .report-content {
    background: var(--theme-surface);
    border: 1px solid var(--theme-border);
  }
}
</style>

<style scoped>
/* Sync Status Indicators Styling */
.sync-status-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sync-status-chip {
  font-size: 0.7rem !important;
  height: 20px !important;
  border-radius: 10px !important;
}

.sync-status-chip .v-icon {
  margin-right: 2px !important;
}

/* Dark theme sync status indicators */
[data-theme="dark"] .sync-status-chip {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .sync-status-chip.v-chip--variant-outlined {
  background: transparent !important;
  border: 1px solid currentColor !important;
}

/* ===== MOBILE-FIRST RESPONSIVE DESIGN ===== */

/* Container and Card Styles */
.reports-collection-container {
  padding: 8px;
}

.reports-collection-card {
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* Header Styles */
.reports-collection-header {
  padding: 16px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header-icon {
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.collection-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.collection-subtitle {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 2px 0 0 0;
  line-height: 1.2;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  min-width: auto !important;
}

/* Filters Section */
.filters-section {
  padding: 12px 16px !important;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.filters-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

/* Reports Grid */
.reports-content {
  padding: 16px !important;
}

.reports-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.report-card {
  border-radius: 8px !important;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.report-card.report-failed {
  border-left: 4px solid #f44336;
}

.report-content {
  padding: 16px !important;
}

/* New Mobile-First Report Header */
.report-header {
  margin-bottom: 12px;
}

.report-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-and-date {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  flex-shrink: 0;
}

.date-info {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.report-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.report-header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.test-counts-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.test-count-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.test-count-separator {
  color: var(--theme-text-secondary);
  font-size: 0.75rem;
}

.count-label {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  text-transform: lowercase;
}

.passed-count {
  color: #4caf50;
  font-weight: 600;
  font-size: 0.875rem;
}

.failed-count {
  color: #f44336;
  font-weight: 600;
  font-size: 0.875rem;
}

.skipped-count {
  color: #ff9800;
  font-weight: 600;
  font-size: 0.875rem;
}

.sync-status-indicators {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.sync-status-chip {
  font-size: 0.75rem !important;
}

/* Progress Section */
.progress-section {
  margin-bottom: 12px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.total-tests {
  color: var(--theme-text-secondary);
}

.pass-rate-text {
  font-weight: 600;
}

.pass-rate-excellent { color: #4caf50; }
.pass-rate-good { color: #8bc34a; }
.pass-rate-warning { color: #ff9800; }
.pass-rate-poor { color: #f44336; }

/* Tags Section */
.tags-section {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-chip {
  font-size: 0.75rem !important;
}

.more-tags {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  font-style: italic;
}

/* Report Identifier */
.report-identifier {
  text-align: right;
}

.json-filename {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Empty and Loading States */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state p, .empty-state h4, .empty-state p {
  margin: 8px 0;
}

/* ===== TABLET RESPONSIVE (768px+) ===== */
@media (min-width: 768px) {
  .reports-collection-container {
    padding: 16px;
  }
  
  .filters-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 16px;
  }
  
  .reports-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 16px;
  }
  
  .report-header-bottom {
    flex-wrap: nowrap;
  }
  
  .test-counts-info {
    flex-wrap: nowrap;
  }
}

/* ===== DESKTOP RESPONSIVE (1024px+) ===== */
@media (min-width: 1024px) {
  .reports-collection-container {
    padding: 24px;
  }
  
  .reports-grid {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: 20px;
  }
  
  .report-content {
    padding: 20px !important;
  }
  
  .collection-title {
    font-size: 1.5rem;
  }
}

/* ===== LARGE DESKTOP (1440px+) ===== */
@media (min-width: 1440px) {
  .reports-grid {
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
    gap: 24px;
  }
}

/* ===== DARK THEME SUPPORT ===== */
[data-theme="dark"] .reports-collection-card {
  background: var(--theme-surface) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

[data-theme="dark"] .filters-section {
  background: rgba(255, 255, 255, 0.02) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .report-card {
  background: var(--theme-surface-variant) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .report-card:hover {
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

[data-theme="dark"] .date-info {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .count-label {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .test-count-separator {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .passed-count {
  color: #66bb6a !important;
}

[data-theme="dark"] .failed-count {
  color: #ef5350 !important;
}

[data-theme="dark"] .skipped-count {
  color: #ffb74d !important;
}

[data-theme="dark"] .total-tests {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .more-tags {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .json-filename {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .collection-title {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .collection-subtitle {
  color: var(--theme-text-secondary) !important;
}
</style>


<style scoped>
/* Load More Container */
.load-more-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  margin-top: 1rem;
}

/* Glassmorphism Load More Button */
.load-more-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.load-more-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.load-more-btn:hover::before {
  left: 100%;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.load-more-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px 0 rgba(99, 102, 241, 0.3);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.load-more-btn .remaining-count {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Dark theme adjustments */
.theme--dark .load-more-btn {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.7), rgba(139, 92, 246, 0.7));
  box-shadow: 0 8px 32px 0 rgba(96, 165, 250, 0.3);
}

.theme--dark .load-more-btn:hover {
  box-shadow: 0 12px 40px 0 rgba(96, 165, 250, 0.4);
}

/* End of List Indicator */
.end-of-list-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  opacity: 0.7;
}

.end-of-list-indicator p {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
  margin: 0;
  margin-top: 0.5rem;
}

.theme--dark .end-of-list-indicator p {
  color: rgba(255, 255, 255, 0.7);
}

/* Mobile responsive */
@media (max-width: 600px) {
  .load-more-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
  }
  
  .load-more-btn .remaining-count {
    font-size: 0.8rem;
  }
}
</style>
