<template>
  <div class="report-view">
    <header class="main-header">
      <div class="header-content">
        <div class="header-top">
          <div class="header-left">
            <span class="logo" style="display:flex;align-items:center;justify-content:center;background:#00a818;border-radius:50%;width:40px;height:40px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.97 3.87 9.06 8.78 9.86.34.05.47-.15.47-.34 0-.17-.01-.73-.01-1.41-3.57.77-4.32-1.72-4.32-1.72-.31-.8-.76-1.01-.76-1.01-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.6.74 1.99.57.06-.44.24-.74.43-.91-2.85-.32-5.85-1.43-5.85-6.36 0-1.4.5-2.54 1.32-3.44-.13-.33-.57-1.66.13-3.46 0 0 1.08-.35 3.54 1.31A12.3 12.3 0 0 1 12 6.84c1.09.01 2.19.15 3.22.44 2.46-1.66 3.54-1.31 3.54-1.31.7 1.8.26 3.13.13 3.46.82.9 1.32 2.04 1.32 3.44 0 4.94-3 6.04-5.86 6.36.25.22.47.65.47 1.31 0 .95-.01 1.72-.01 1.95 0 .19.13.39.48.33C18.13 21.06 22 16.97 22 12c0-5.52-4.48-10-10-10z" fill="#fff"/>
              </svg>
            </span>
          </div>
          <div class="header-actions">
            <ThemeToggle />
          </div>
        </div>
        <h1 class="main-title">Cucumber Test Results</h1>
      </div>
    </header>
    <main class="main-content">
      <div v-if="expired" class="card empty-card" style="color:#b71c1c;background:#ffebee;border:1px solid #ffcdd2;">
        <p>This report link has expired (older than 24 hours).</p>
      </div>
      <div v-else-if="reportData" class="dashboard-grid">
        <ReportViewer 
          :report="reportData" 
          :selectedFeatureIndex="selectedFeatureIndex"
          @select-feature="onSelectFeature"
        />
      </div>
      <div v-else class="card empty-card">
        <p>No report data available. Please upload a Cucumber JSON file.</p>
      </div>
    </main>
  </div>
</template>

<script>

import ReportViewer from '@/components/ReportViewer.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useStore } from 'vuex';
import { computed, ref, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';

export default {
  components: {
    ReportViewer,
    ThemeToggle,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const reportId = route && route.params && route.params.id ? route.params.id : null;
    const state = reactive({ staticReport: null });

    // Normalize report data to ensure consistent format
    const normalizeReportData = (data) => {
      if (!data) {
        console.log('🔍 normalizeReportData: data is null/undefined');
        return null;
      }
      
      console.log('🔍 normalizeReportData input:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasFeatures: !!(data.features),
        featuresIsArray: !!(data.features && Array.isArray(data.features)),
        keys: typeof data === 'object' ? Object.keys(data) : 'not object'
      });
      
      // If it's already in the correct format with features array
      if (data.features && Array.isArray(data.features)) {
        console.log('✅ Data already has features array, features count:', data.features.length);
        return data;
      }
      
      // If it's a plain array of features
      if (Array.isArray(data)) {
        console.log('✅ Data is array, converting to {features: array}, length:', data.length);
        return { features: data };
      }
      
      // If it's a single feature object
      if (data.name && (data.elements || data.scenarios)) {
        console.log('✅ Data is single feature, converting to array');
        return { features: [data] };
      }
      
      // If it has a results property (TestNG format)
      if (data.results && Array.isArray(data.results)) {
        console.log('✅ Data has results property, using as features');
        return { features: data.results };
      }
      
      // Check for compressed format from ReportUploader
      if (data.features && data.features.length > 0 && !Array.isArray(data.features)) {
        console.log('⚠️ Data has features but not as array, trying to fix');
        try {
          const featuresArray = Object.values(data.features);
          if (Array.isArray(featuresArray)) {
            return { features: featuresArray };
          }
        } catch (e) {
          console.warn('❌ Failed to convert features to array:', e);
        }
      }
      
      console.warn('⚠️ Unknown report format:', data);
      return null;
    };
    const reportData = computed(() => {
      console.log('🔍 Report Data Debug:', {
        reportId,
        hasStoreData: !!store.state.reportData,
        storeDataId: store.state.reportData?._uploadedId,
        hasLocalStorage: reportId ? !!localStorage.getItem('uploaded-report-' + reportId) : false,
        hasStaticReport: !!state.staticReport,
        localStorageKeys: Object.keys(localStorage).filter(key => key.startsWith('uploaded-report-'))
      });

      // Priority 1: Check Vuex store for session data (most recent uploads)
      if (store.state.reportData) {
        // If we have a reportId, check if it matches
        if (reportId && store.state.reportData._uploadedId === reportId) {
          console.log('✅ Found matching report in Vuex store');
          const normalized = normalizeReportData(store.state.reportData);
          console.log('✅ Normalized Vuex data:', normalized);
          return normalized;
        }
        // If no reportId (direct navigation to /report), use store data
        if (!reportId) {
          console.log('✅ Using Vuex store data for direct navigation');
          const normalized = normalizeReportData(store.state.reportData);
          console.log('✅ Normalized Vuex data:', normalized);
          return normalized;
        }
      }

      // Priority 2: Try to load from localStorage if route param id matches a static report
      if (reportId) {
        const localStorageKey = 'uploaded-report-' + reportId;
        const rawData = localStorage.getItem(localStorageKey);
        
        console.log('🔍 Checking localStorage for key:', localStorageKey);
        console.log('🔍 Raw localStorage data exists:', !!rawData);
        
        if (rawData) {
          try {
            console.log('✅ Found report in localStorage');
            const data = JSON.parse(rawData);
            console.log('🔍 Parsed localStorage data:', data);
            const normalized = normalizeReportData(data);
            console.log('✅ Normalized localStorage data:', normalized);
            return normalized;
          } catch (e) {
            console.warn('❌ Failed to parse localStorage data:', e);
          }
        } else {
          console.log('❌ No localStorage data found for key:', localStorageKey);
          
          // Check if the report exists in the index but not in storage
          try {
            const index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
            const reportInIndex = index.find(r => r.id === reportId);
            console.log('🔍 Report in index:', reportInIndex);
            
            if (reportInIndex) {
              console.log('⚠️ Report exists in index but not in localStorage storage');
            }
          } catch (e) {
            console.warn('❌ Failed to check reports index:', e);
          }
        }
      }

      // Priority 3: If fetched static report, use it
      if (state.staticReport) {
        console.log('✅ Using static report data');
        const normalized = normalizeReportData(state.staticReport);
        console.log('✅ Normalized static data:', normalized);
        return normalized;
      }

      console.log('❌ No report data found');
      return null;
    });
    // Track selected feature index, default to 0
    const selectedFeatureIndex = ref(0);
    const onSelectFeature = idx => {
      selectedFeatureIndex.value = idx;
    };

    // Extract server fetch logic for reuse
    const fetchServerReport = async (reportId) => {
      if (!reportId) return;
      
      console.log('🔍 fetchServerReport called with:', reportId);
      const serverFilename = reportId;
      
      const possiblePaths = [
        `/TestResultsJsons/${serverFilename}`,
        `TestResultsJsons/${serverFilename}`,
        `${process.env.BASE_URL || '/'}TestResultsJsons/${serverFilename}`,
        `./TestResultsJsons/${serverFilename}`
      ];
      
      if (!reportId.endsWith('.json')) {
        possiblePaths.push(
          `/TestResultsJsons/${serverFilename}.json`,
          `TestResultsJsons/${serverFilename}.json`
        );
      }
      
      for (const path of possiblePaths) {
        try {
          console.log('🔍 Fetching from:', path);
          const response = await fetch(path + '?t=' + Date.now(), { 
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (response.ok) {
            const json = await response.json();
            console.log('✅ Server fetch successful:', path);
            
            const normalized = normalizeReportData(json);
            if (normalized && normalized.features && normalized.features.length > 0) {
              state.staticReport = normalized;
              console.log('✅ Server report loaded with', normalized.features.length, 'features');
              return;
            }
          }
        } catch (error) {
          console.log('❌ Fetch failed:', path, error.message);
        }
      }
      
      console.log('❌ All server fetch attempts failed');
    };

    // Fetch static report JSON if needed
    onMounted(async () => {
      console.log('🔍 onMounted - reportId:', reportId);
      
      if (!reportId) {
        console.log('🔍 No reportId, skipping server fetch');
        return;
      }
      
      // Check if we already have the data
      if (store.state.reportData && store.state.reportData._uploadedId === reportId) {
        console.log('🔍 Already have data in Vuex store');
        return;
      }
      
      if (localStorage.getItem('uploaded-report-' + reportId)) {
        console.log('🔍 Already have data in localStorage');
        return;
      }
      
      console.log('🔍 Attempting to fetch from server...');
      await fetchServerReport(reportId);
    });

    // Soft expiry logic: check for t= timestamp in URL hash
    let expired = false;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const queryString = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const t = parseInt(params.get('t'), 10);
      if (t && !isNaN(t)) {
        const now = Date.now();
        expired = now - t > 24 * 60 * 60 * 1000;
      }
    }

    // Show a warning if the report is only available for this session
    const sessionOnly = computed(() => {
      return store.state.reportData && store.state.reportData._uploadedId === reportId;
    });

    // Watch for route changes to trigger server fetch
    watch(() => route.params.id, async (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log('🔍 Route changed, new reportId:', newId);
        state.staticReport = null; // Clear previous data
        
        // Trigger server fetch for new report
        if (!store.state.reportData || store.state.reportData._uploadedId !== newId) {
          if (!localStorage.getItem('uploaded-report-' + newId)) {
            console.log('🔍 Triggering server fetch for new route');
            await fetchServerReport(newId);
          }
        }
      }
    });

    return { reportData, selectedFeatureIndex, onSelectFeature, expired, sessionOnly };
  },
};
</script>

<!-- (fixed duplicate style tag) -->
<style scoped>
body, .report-view {
  font-family: 'Arial', 'Helvetica', 'Segoe UI', sans-serif;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.main-header {
  background: #f2f2f2;
  padding: 2rem 0 1.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

/* Premium Dark Report View */
[data-theme="dark"] .report-view {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  position: relative;
}

[data-theme="dark"] .report-view::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 25% 25%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(52, 211, 153, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

[data-theme="dark"] .main-header {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

[data-theme="dark"] .main-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent);
}
.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 0.7rem;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.main-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #222;
  text-align: center;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;
}

[data-theme="dark"] .main-title {
  color: #f1f5f9;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(96, 165, 250, 0.4);
  position: relative;
}

[data-theme="dark"] .main-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #60a5fa, #34d399);
  border-radius: 1px;
}
.main-content {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 60vh;
  position: relative;
  z-index: 1;
  padding: 0 1rem;
}
.dashboard-grid {
  display: flex;
  flex-direction: row;
  gap: 2.5rem;
  max-width: 1800px;
  width: 100%;
}
.left-col {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.right-col {
  flex: 1 1 0%;
  min-width: 0;
}
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 2rem;
  padding: 2rem 1.5rem;
  transition: all 0.3s ease;
}

.empty-card {
  text-align: center;
  color: #888;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin: 2rem auto;
  max-width: 500px;
  padding: 2rem 1.5rem;
  transition: all 0.3s ease;
}

/* Premium Dark Cards */
[data-theme="dark"] .card {
  background: linear-gradient(145deg, rgba(45, 55, 72, 0.9) 0%, rgba(74, 85, 104, 0.8) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 8px 32px rgba(96, 165, 250, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .empty-card {
  background: linear-gradient(145deg, rgba(45, 55, 72, 0.9) 0%, rgba(74, 85, 104, 0.8) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  color: #cbd5e0;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 8px 32px rgba(96, 165, 250, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .card:hover,
[data-theme="dark"] .empty-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 32px 80px rgba(0, 0, 0, 0.5),
    0 12px 48px rgba(96, 165, 250, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: rgba(96, 165, 250, 0.3);
}
</style>