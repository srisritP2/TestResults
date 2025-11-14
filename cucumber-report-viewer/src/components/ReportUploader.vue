<template>
  <v-card class="mx-auto my-8 pa-6 mobile-uploader-card" max-width="420">
    <v-card-title class="text-h6 font-weight-bold">Upload Cucumber JSON Report</v-card-title>
    <v-card-text>
      <v-file-input
        v-model="selectedFile"
        accept=".json"
        label="Select or drag a Cucumber JSON file"
        prepend-icon="mdi-file-upload"
        show-size
        @change="onFileChange"
        outlined
        dense
        :rules="[fileTypeRule]"
      />
      <v-alert v-if="errorMessage" type="error" dense class="mt-2">{{ errorMessage }}</v-alert>
      
      <!-- Storage Status Alert -->
      <v-alert 
        v-if="showStorageInfo && storageStatus" 
        :type="storageStatus.type" 
        dense 
        class="mt-2"
        dismissible
        @click:close="dismissStorageInfo"
      >
        <div class="d-flex align-center">
          <v-icon 
            :color="storageStatus.type === 'success' ? 'success' : storageStatus.type === 'warning' ? 'warning' : 'info'" 
            class="mr-2"
          >
            {{ storageStatus.strategy === 'server' ? 'mdi-cloud-upload' :
               storageStatus.strategy === 'persistent' ? 'mdi-check-circle' : 
               storageStatus.strategy === 'compressed' ? 'mdi-alert-circle' : 'mdi-information' }}
          </v-icon>
          <div>
            <div class="font-weight-medium">
              {{ storageStatus.strategy === 'server' ? 'Uploaded to Server!' :
                 storageStatus.strategy === 'persistent' ? 'Saved Successfully!' : 
                 storageStatus.strategy === 'compressed' ? 'Saved with Compression' : 'Session Only' }}
            </div>
            <div class="text-caption">{{ storageStatus.message }}</div>
          </div>
        </div>
      </v-alert>
      
      <div v-if="selectedFile && !errorMessage" class="mt-2">
        <v-chip color="primary" class="ma-1">{{ selectedFile.name }}</v-chip>
        <span class="grey--text text--darken-1">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="success" :disabled="!selectedFile || !!errorMessage" @click="uploadReport">Upload</v-btn>
    </v-card-actions>
    
    <!-- Storage Management Section -->
    <v-card-text v-if="hasStoredReports" class="pt-0">
      <v-divider class="mb-3"></v-divider>
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-subtitle-2 font-weight-medium">Previously Uploaded Reports</span>
        <v-btn size="small" variant="text" color="primary" @click="showStorageManager = !showStorageManager">
          {{ showStorageManager ? 'Hide' : 'Manage' }}
          <v-icon size="16" class="ml-1">{{ showStorageManager ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </div>
      
      <v-expand-transition>
        <div v-show="showStorageManager">
          <div class="storage-info mb-3">
            <v-chip size="small" color="info" variant="outlined">
              {{ storedReports.length }} report{{ storedReports.length !== 1 ? 's' : '' }} stored
            </v-chip>
            <v-chip size="small" color="secondary" variant="outlined" class="ml-2">
              {{ formatStorageSize(getTotalStorageSize()) }} used
            </v-chip>
          </div>
          
          <div class="stored-reports-list">
            <div 
              v-for="report in storedReports" 
              :key="report.id" 
              class="stored-report-item d-flex align-center justify-space-between pa-2 mb-1"
              :class="{ 'session-only': report.storageStrategy === 'session' }"
            >
              <div class="flex-grow-1 clickable-area" @click="viewStoredReport(report.id)">
                <div class="text-body-2 font-weight-medium">{{ report.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(report.date) }} • {{ formatStorageSize(report.size) }}
                  <v-chip 
                    size="x-small" 
                    :color="getStorageChipColor(report.storageStrategy)"
                    variant="flat"
                    class="ml-1"
                  >
                    {{ getStorageLabel(report.storageStrategy) }}
                  </v-chip>
                </div>
              </div>
              <div class="report-actions">
                <v-btn 
                  size="small" 
                  variant="text" 
                  color="primary" 
                  @click="viewStoredReport(report.id)"
                  icon="mdi-eye"
                  class="mr-1"
                  title="View Report"
                ></v-btn>
                <v-btn 
                  size="small" 
                  variant="text" 
                  color="success" 
                  @click="downloadStoredReport(report.id, report.name)"
                  icon="mdi-download"
                  class="mr-1"
                  title="Download JSON file for GitHub"
                ></v-btn>
                <v-btn 
                  size="small" 
                  variant="text" 
                  color="error" 
                  @click="deleteStoredReport(report.id)"
                  icon="mdi-delete"
                  title="Delete Report"
                ></v-btn>
              </div>
            </div>
          </div>
          
          <v-btn 
            v-if="storedReports.length > 0"
            size="small" 
            variant="outlined" 
            color="error" 
            @click="clearAllStoredReports"
            class="mt-2"
          >
            <v-icon size="16" class="mr-1">mdi-delete-sweep</v-icon>
            Clear All
          </v-btn>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script>
import UploadService from '@/services/UploadService';

// Enhanced Cucumber JSON validation and normalization utilities
function detectCucumberFormat(json) {
  // Format 1: Standard array of features
  if (Array.isArray(json) && json.length > 0) {
    const firstItem = json[0];
    if (firstItem.name && (firstItem.elements || firstItem.scenarios)) {
      return { format: 'standard', data: json };
    }
  }
  
  // Format 2: Wrapped in features property
  if (json.features && Array.isArray(json.features)) {
    return { format: 'wrapped', data: json.features };
  }
  
  // Format 3: Single feature object
  if (json.name && (json.elements || json.scenarios)) {
    return { format: 'single', data: [json] };
  }
  
  // Format 4: TestNG/other format with results property
  if (json.results && Array.isArray(json.results)) {
    return { format: 'testng', data: json.results };
  }
  
  return { format: 'unknown', data: null };
}

function validateCucumberFeatures(features) {
  if (!Array.isArray(features) || features.length === 0) {
    return { valid: false, error: 'No features found' };
  }
  
  // Check if at least one feature has scenarios/elements
  const hasValidFeatures = features.some(feature => {
    return feature.name && (
      (feature.elements && Array.isArray(feature.elements)) ||
      (feature.scenarios && Array.isArray(feature.scenarios))
    );
  });
  
  if (!hasValidFeatures) {
    return { valid: false, error: 'No valid features with scenarios found' };
  }
  
  return { valid: true };
}

export default {
  data() {
    return {
      selectedFile: null,
      errorMessage: '',
      storageStatus: null,
      showStorageInfo: false,
      showStorageManager: false,
      $uploadService: UploadService
    };
  },
  computed: {
    storedReports() {
      try {
        return JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      } catch (e) {
        return [];
      }
    },
    hasStoredReports() {
      return this.storedReports.length > 0;
    }
  },
  methods: {
    fileTypeRule(file) {
      if (!file) return true;
      if (file.name && file.name.endsWith('.json')) return true;
      return 'Only .json files are allowed';
    },
    onFileChange(file) {
      this.errorMessage = '';
      if (!file) return;
      if (file.name && !file.name.endsWith('.json')) {
        this.errorMessage = 'Please select a valid .json file.';
        this.selectedFile = null;
        return;
      }
      // Optionally, check file size here
    },
    uploadReport() {
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            
            // Detect and normalize the format
            const formatResult = detectCucumberFormat(jsonData);
            
            if (formatResult.format === 'unknown' || !formatResult.data) {
              this.errorMessage = `Unsupported file format. Expected Cucumber JSON report but found: ${typeof jsonData}. Please check the file format.`;
              return;
            }
            
            // Validate the normalized data
            const validation = validateCucumberFeatures(formatResult.data);
            if (!validation.valid) {
              this.errorMessage = `Invalid Cucumber JSON report: ${validation.error}. Please ensure the file contains valid test results.`;
              return;
            }
            
            // Use the normalized data
            let reportData = formatResult.data;
            console.log(`✅ Detected format: ${formatResult.format}, Features: ${reportData.length}`);
            
            // Auto-fix skipped steps with duration (common Cucumber bug)
            const fixedSteps = this.fixSkippedStepsWithDuration(reportData);
            if (fixedSteps > 0) {
              console.log(`🔧 Auto-fixed ${fixedSteps} skipped steps that had duration values`);
            }
            // Generate a unique id for the report
            const id = 'report-' + Date.now();
            const name = this.selectedFile.name.replace(/\.json$/i, '');
            const date = new Date().toISOString();
            
            // Set report data in store for immediate viewing
            this.$store.commit('setReportData', reportData);
            
            // Try to upload to server first
            try {
              const uploadResult = await this.$uploadService.uploadReport(id, reportData, name);
              
              if (uploadResult.success) {
                // Server upload successful
                this.showStorageStatus('server', `Report uploaded to server successfully! Available at: ${uploadResult.url}`);
                
                // Also save to localStorage as backup
                this.saveToLocalStorage(id, reportData, name, date, 'server');
                
                this.$emit('report-uploaded', { 
                  ...reportData, 
                  _uploadedId: id, 
                  _storageStrategy: 'server',
                  _storageMessage: 'Report saved to server and will be available in the reports index.',
                  _serverUrl: uploadResult.url
                });
                
                this.selectedFile = null;
                return;
              }
            } catch (serverError) {
              console.warn('Server upload failed, falling back to localStorage:', serverError.message);
            }
            
            // Fallback to localStorage if server upload fails
            const reportSize = JSON.stringify(reportData).length;
            const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage
            
            let storageStrategy = 'session'; // default to session-only
            let storageMessage = 'Report uploaded successfully for this session.';
            
            if (reportSize < maxSize) {
              try {
                // Try to save full report to localStorage
                localStorage.setItem('uploaded-report-' + id, JSON.stringify(reportData));
                storageStrategy = 'persistent';
                storageMessage = 'Report saved successfully! It will persist across browser sessions.';
              } catch (e) {
                // localStorage quota exceeded, try compressed storage
                try {
                  // Simple compression: remove whitespace and store essential data only
                  const compressedData = {
                    features: reportData.features.map(f => ({
                      name: f.name,
                      uri: f.uri,
                      id: f.id,
                      tags: f.tags,
                      elements: f.elements ? f.elements.map(e => ({
                        name: e.name,
                        id: e.id,
                        type: e.type,
                        keyword: e.keyword,
                        tags: e.tags,
                        steps: e.steps ? e.steps.map(s => ({
                          name: s.name,
                          keyword: s.keyword,
                          result: s.result,
                          duration: s.duration
                        })) : []
                      })) : []
                    }))
                  };
                  localStorage.setItem('uploaded-report-' + id, JSON.stringify(compressedData));
                  storageStrategy = 'compressed';
                  storageMessage = 'Report saved with compression. Some detailed information may be reduced to fit storage limits.';
                } catch (e2) {
                  // Even compressed storage failed, fall back to session-only
                  console.warn('Could not save report to localStorage:', e2);
                  storageStrategy = 'session';
                }
              }
            } else {
              storageMessage = 'Large report uploaded successfully (session only due to size).';
            }
            
            // Save to localStorage index
            this.saveToLocalStorage(id, reportData, name, date, storageStrategy);
            
            // Show storage status to user
            this.$emit('report-uploaded', { 
              ...reportData, 
              _uploadedId: id, 
              _storageStrategy: storageStrategy,
              _storageMessage: storageMessage
            });
            
            // Display storage status message
            this.showStorageStatus(storageStrategy, storageMessage);
            this.selectedFile = null;
          } catch (err) {
            this.errorMessage = 'Invalid JSON file: ' + (err && err.message ? err.message : 'Unknown error.');
          }
        };
        reader.readAsText(this.selectedFile);
      }
    },
    showStorageStatus(strategy, message) {
      this.storageStatus = {
        strategy,
        message,
        type: this.getStorageAlertType(strategy)
      };
      this.showStorageInfo = true;
      
      // Auto-hide success messages after 5 seconds
      if (strategy === 'persistent' || strategy === 'server') {
        setTimeout(() => {
          this.showStorageInfo = false;
        }, 5000);
      }
    },
    getStorageAlertType(strategy) {
      switch (strategy) {
        case 'server': return 'success';
        case 'persistent': return 'success';
        case 'compressed': return 'warning';
        case 'session': return 'info';
        default: return 'info';
      }
    },
    saveToLocalStorage(id, reportData, name, date, storageStrategy) {
      try {
        const reportSize = JSON.stringify(reportData).length;
        
        // Calculate statistics from the report data
        const stats = this.calculateReportStatistics(reportData);
        
        // Update index with storage strategy info and statistics
        let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
        const reportEntry = { 
          id, 
          name, 
          date, 
          size: reportSize,
          storageStrategy,
          persistent: storageStrategy !== 'session',
          // Add calculated statistics
          features: stats.features,
          scenarios: stats.scenarios,
          steps: stats.steps,
          passed: stats.passed,
          failed: stats.failed,
          skipped: stats.skipped,
          duration: stats.duration,
          tags: stats.tags
        };
        
        index.unshift(reportEntry);
        localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
        
        console.log(`✅ Saved report ${id} to localStorage with stats:`, stats);
      } catch (error) {
        console.warn('Failed to update localStorage index:', error);
      }
    },

    calculateReportStatistics(reportData) {
      let features = 0;
      let scenarios = 0;
      let steps = 0;
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      let duration = 0;
      const tags = new Set();

      // Handle both array format and object format
      const featuresArray = Array.isArray(reportData) ? reportData : reportData.features || [];
      
      featuresArray.forEach(feature => {
        features++;
        
        // Collect feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => tags.add(tag.name || tag));
        }
        
        // Process scenarios/elements
        const elements = feature.elements || feature.scenarios || [];
        elements.forEach(element => {
          if (element.type === 'scenario' || !element.type) {
            scenarios++;
            
            // Collect scenario tags
            if (element.tags) {
              element.tags.forEach(tag => tags.add(tag.name || tag));
            }
            
            // Process steps
            if (element.steps) {
              element.steps.forEach(step => {
                steps++;
                
                if (step.result) {
                  switch (step.result.status) {
                    case 'passed':
                      passed++;
                      break;
                    case 'failed':
                      failed++;
                      break;
                    case 'skipped':
                    case 'pending':
                    case 'undefined':
                      skipped++;
                      break;
                  }
                  
                  // Add duration (convert from nanoseconds to milliseconds if needed)
                  if (step.result.duration) {
                    const stepDuration = step.result.duration > 1000000 
                      ? step.result.duration / 1000000 // Convert nanoseconds to milliseconds
                      : step.result.duration;
                    duration += stepDuration;
                  }
                }
              });
            }
          }
        });
      });

      return {
        features,
        scenarios,
        steps,
        passed,
        failed,
        skipped,
        duration: Math.round(duration),
        tags: Array.from(tags)
      };
    },
    dismissStorageInfo() {
      this.showStorageInfo = false;
    },
    fixSkippedStepsWithDuration(features) {
      let fixedCount = 0;
      
      features.forEach(feature => {
        if (feature.elements) {
          feature.elements.forEach(element => {
            if (element.steps) {
              element.steps.forEach(step => {
                // Fix steps marked as skipped but with duration > 0
                if (step.result && 
                    step.result.status === 'skipped' && 
                    step.result.duration && 
                    step.result.duration > 0) {
                  step.result.status = 'passed';
                  fixedCount++;
                }
              });
            }
          });
        }
      });
      
      return fixedCount;
    },
    // Storage Management Methods
    getTotalStorageSize() {
      return this.storedReports.reduce((total, report) => total + (report.size || 0), 0);
    },
    formatStorageSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'Unknown date';
      }
    },
    getStorageChipColor(strategy) {
      switch (strategy) {
        case 'server': return 'primary';
        case 'persistent': return 'success';
        case 'compressed': return 'warning';
        case 'session': return 'info';
        default: return 'grey';
      }
    },
    getStorageLabel(strategy) {
      switch (strategy) {
        case 'server': return 'Server';
        case 'persistent': return 'Saved';
        case 'compressed': return 'Compressed';
        case 'session': return 'Session';
        default: return 'Unknown';
      }
    },
    deleteStoredReport(reportId) {
      try {
        // Remove from localStorage
        localStorage.removeItem('uploaded-report-' + reportId);
        
        // Update index
        let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
        index = index.filter(report => report.id !== reportId);
        localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
        
        // Force reactivity update
        this.$forceUpdate();
        
        // Show success message
        this.showStorageStatus('success', `Report "${reportId}" deleted successfully.`);
      } catch (e) {
        console.error('Error deleting report:', e);
        this.errorMessage = 'Failed to delete report. Please try again.';
      }
    },
    clearAllStoredReports() {
      if (confirm('Are you sure you want to delete all stored reports? This action cannot be undone.')) {
        try {
          // Remove all stored reports
          this.storedReports.forEach(report => {
            localStorage.removeItem('uploaded-report-' + report.id);
          });
          
          // Clear index
          localStorage.removeItem('uploaded-reports-index');
          
          // Force reactivity update
          this.$forceUpdate();
          
          // Show success message
          this.showStorageStatus('success', 'All stored reports have been deleted.');
          this.showStorageManager = false;
        } catch (e) {
          console.error('Error clearing reports:', e);
          this.errorMessage = 'Failed to clear reports. Please try again.';
        }
      }
    },
    downloadStoredReport(reportId, reportName) {
      try {
        // Load the report data from localStorage
        const reportData = localStorage.getItem('uploaded-report-' + reportId);
        
        if (reportData) {
          // Create a blob from the JSON data
          const blob = new Blob([reportData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportId}.json`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Show success message with instructions
          this.showStorageStatus('success', 
            `Downloaded ${reportId}.json! Copy this file to cucumber-report-viewer/public/TestResultsJsons/ and push to GitHub.`
          );
          
          console.log(`✅ Downloaded report: ${reportId}.json`);
        } else {
          // Report not found in localStorage
          this.showStorageStatus('error', `Report "${reportId}" not found in localStorage.`);
          
          // Remove from index since it's not available
          let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
          index = index.filter(report => report.id !== reportId);
          localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
          this.$forceUpdate();
        }
      } catch (e) {
        console.error('Error downloading stored report:', e);
        this.errorMessage = 'Failed to download report. Please try again.';
      }
    },
    viewStoredReport(reportId) {
      try {
        // Load the report data from localStorage
        const reportData = localStorage.getItem('uploaded-report-' + reportId);
        
        if (reportData) {
          // Parse and set the report data in the store
          const parsedData = JSON.parse(reportData);
          this.$store.commit('setReportData', { ...parsedData, _uploadedId: reportId });
          
          // Navigate to the report view
          this.$router.push({ 
            name: 'Report', 
            params: { id: reportId }, 
            query: { t: Date.now() } 
          });
        } else {
          // Report not found in localStorage, show error
          this.showStorageStatus('error', `Report "${reportId}" not found. It may have been deleted or expired.`);
          
          // Remove from index since it's not available
          let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
          index = index.filter(report => report.id !== reportId);
          localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
          this.$forceUpdate();
        }
      } catch (e) {
        console.error('Error loading stored report:', e);
        this.errorMessage = 'Failed to load report. Please try again.';
      }
    }
  }
};
</script>

<style scoped>
.stored-report-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.stored-report-item:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.stored-report-item.session-only {
  border-left: 4px solid #2196f3;
  background: linear-gradient(90deg, #e3f2fd 0%, #fafafa 20%);
}

.storage-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.stored-reports-list {
  max-height: 300px;
  overflow-y: auto;
}

.stored-reports-list::-webkit-scrollbar {
  width: 6px;
}

.stored-reports-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.stored-reports-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.stored-reports-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Enhanced alert styling */
.v-alert {
  border-radius: 8px !important;
}

.v-alert .v-icon {
  margin-right: 8px !important;
}

/* File input styling */
.v-file-input {
  margin-bottom: 8px;
}

/* Card styling improvements */
.v-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.v-card-title {
  padding-bottom: 8px !important;
}

/* Button styling */
.v-btn {
  border-radius: 6px !important;
}

/* Chip styling */
.v-chip {
  border-radius: 6px !important;
}

/* Clickable area styling */
.clickable-area {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-area:hover {
  color: #1976d2;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .mobile-uploader-card {
    margin: 16px 8px !important;
    padding: 16px !important;
    max-width: none !important;
    width: calc(100% - 16px) !important;
  }
  
  .v-card-title {
    font-size: 1.1rem !important;
    line-height: 1.3 !important;
  }
  
  .storage-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .stored-reports-list {
    max-height: 250px;
  }
  
  .stored-report-item {
    padding: 12px !important;
    margin-bottom: 8px !important;
  }
  
  .report-actions {
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
  
  .clickable-area {
    padding-right: 8px;
  }
}

@media (max-width: 480px) {
  .mobile-uploader-card {
    margin: 12px 4px !important;
    padding: 12px !important;
    border-radius: 8px !important;
  }
  
  .v-card-title {
    font-size: 1rem !important;
    padding-bottom: 12px !important;
  }
  
  .v-file-input {
    margin-bottom: 12px;
  }
  
  .stored-report-item {
    padding: 10px !important;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .report-actions {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
    gap: 4px;
  }
  
  .text-body-2 {
    font-size: 0.9rem !important;
  }
  
  .text-caption {
    font-size: 0.75rem !important;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .stored-report-item {
    min-height: 48px;
  }
  
  .clickable-area {
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .v-btn {
    min-height: 44px !important;
    min-width: 44px !important;
  }
}

/* Dark Theme Compatibility for ReportUploader */

/* Main Card Dark Theme */
[data-theme="dark"] .v-card {
  background: var(--theme-surface) !important;
  border: 1px solid var(--theme-border) !important;
  box-shadow: 0 4px 12px var(--theme-shadow) !important;
}

/* Card Title Dark Theme */
[data-theme="dark"] .v-card-title {
  color: var(--theme-text-primary) !important;
  background: var(--theme-surface) !important;
}

/* Card Text Dark Theme */
[data-theme="dark"] .v-card-text {
  background: var(--theme-surface) !important;
  color: var(--theme-text-primary) !important;
}

/* File Input Dark Theme */
[data-theme="dark"] .v-file-input {
  background: var(--theme-surface-variant) !important;
}

[data-theme="dark"] .v-file-input .v-field {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-file-input .v-field__input {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-file-input .v-field__input::placeholder {
  color: var(--theme-text-secondary) !important;
  opacity: 0.8 !important;
}

[data-theme="dark"] .v-file-input .v-field__prepend-inner {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-file-input .v-label {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-file-input:hover .v-field {
  background: var(--theme-surface) !important;
  border-color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .v-file-input:focus-within .v-field {
  background: var(--theme-surface) !important;
  border-color: #60A5FA !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Alert Dark Theme */
[data-theme="dark"] .v-alert {
  background: var(--theme-surface-variant) !important;
  border: 1px solid var(--theme-border) !important;
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .v-alert.v-alert--type-error {
  background: rgba(248, 113, 113, 0.1) !important;
  border-color: var(--theme-error) !important;
  color: var(--theme-error) !important;
}

[data-theme="dark"] .v-alert.v-alert--type-success {
  background: rgba(52, 211, 153, 0.1) !important;
  border-color: var(--theme-success) !important;
  color: var(--theme-success) !important;
}

[data-theme="dark"] .v-alert.v-alert--type-warning {
  background: rgba(251, 191, 36, 0.1) !important;
  border-color: var(--theme-warning) !important;
  color: var(--theme-warning) !important;
}

[data-theme="dark"] .v-alert.v-alert--type-info {
  background: rgba(34, 211, 238, 0.1) !important;
  border-color: var(--theme-info) !important;
  color: var(--theme-info) !important;
}

/* Alert Icons Dark Theme */
[data-theme="dark"] .v-alert .v-icon {
  color: inherit !important;
}

/* Chip Dark Theme */
[data-theme="dark"] .v-chip {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

/* Button Dark Theme */
[data-theme="dark"] .v-btn {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

[data-theme="dark"] .v-btn:hover {
  background: var(--theme-hover-overlay) !important;
}

[data-theme="dark"] .v-btn:disabled {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-secondary) !important;
  opacity: 0.6;
}

/* Divider Dark Theme */
[data-theme="dark"] .v-divider {
  border-color: var(--theme-border) !important;
}

/* Storage Management Section Dark Theme */
[data-theme="dark"] .stored-report-item {
  background: var(--theme-surface-variant);
  border: 1px solid var(--theme-border);
}

[data-theme="dark"] .stored-report-item:hover {
  background: var(--theme-hover-overlay);
  border-color: var(--theme-text-secondary);
}

[data-theme="dark"] .stored-report-item.session-only {
  border-left: 4px solid #60A5FA;
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.1) 0%, var(--theme-surface-variant) 20%);
}

[data-theme="dark"] .text-body-2 {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .text-caption {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .text-medium-emphasis {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .text-subtitle-2 {
  color: var(--theme-text-primary) !important;
}

/* Storage Info Dark Theme */
[data-theme="dark"] .storage-info {
  background: var(--theme-surface);
}

[data-theme="dark"] .storage-info .v-chip {
  background: var(--theme-surface-variant) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border) !important;
}

/* Stored Reports List Dark Theme */
[data-theme="dark"] .stored-reports-list {
  background: var(--theme-surface);
}

[data-theme="dark"] .stored-reports-list::-webkit-scrollbar-track {
  background: var(--theme-surface-variant);
}

[data-theme="dark"] .stored-reports-list::-webkit-scrollbar-thumb {
  background: var(--theme-text-secondary);
}

[data-theme="dark"] .stored-reports-list::-webkit-scrollbar-thumb:hover {
  background: var(--theme-text-primary);
}

/* Clickable Area Dark Theme */
[data-theme="dark"] .clickable-area {
  color: var(--theme-text-primary);
}

[data-theme="dark"] .clickable-area:hover {
  color: #60A5FA;
}

/* Report Actions Dark Theme */
[data-theme="dark"] .report-actions .v-btn {
  background: transparent !important;
  color: var(--theme-text-secondary) !important;
  border: none !important;
}

[data-theme="dark"] .report-actions .v-btn:hover {
  background: var(--theme-hover-overlay) !important;
  color: var(--theme-text-primary) !important;
}

/* Expand Transition Dark Theme */
[data-theme="dark"] .v-expand-transition-enter-active,
[data-theme="dark"] .v-expand-transition-leave-active {
  background: var(--theme-surface);
}

/* Card Actions Dark Theme */
[data-theme="dark"] .v-card-actions {
  background: var(--theme-surface) !important;
  border-top: 1px solid var(--theme-border-light);
}

/* Text Color Overrides for Dark Theme */
[data-theme="dark"] .grey--text {
  color: var(--theme-text-secondary) !important;
}

[data-theme="dark"] .text--darken-1 {
  color: var(--theme-text-secondary) !important;
}

/* Font Weight Classes Dark Theme */
[data-theme="dark"] .font-weight-medium {
  color: var(--theme-text-primary) !important;
}

[data-theme="dark"] .font-weight-bold {
  color: var(--theme-text-primary) !important;
}

/* Responsive Dark Theme Adjustments */
@media (max-width: 768px) {
  [data-theme="dark"] .v-card {
    background: var(--theme-surface) !important;
    border: 1px solid var(--theme-border) !important;
  }
  
  [data-theme="dark"] .stored-report-item {
    background: var(--theme-surface-variant);
    border: 1px solid var(--theme-border);
  }
}

@media (max-width: 480px) {
  [data-theme="dark"] .v-card-title {
    background: var(--theme-surface) !important;
    color: var(--theme-text-primary) !important;
  }
  
  [data-theme="dark"] .v-card-text {
    background: var(--theme-surface) !important;
  }
}
</style>