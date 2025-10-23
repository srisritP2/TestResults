<template>
  <div class="landing-bg">
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">
          <span class="logo" style="display:flex;align-items:center;justify-content:center;background:#00a818;border-radius:50%;width:32px;height:32px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.97 3.87 9.06 8.78 9.86.34.05.47-.15.47-.34 0-.17-.01-.73-.01-1.41-3.57.77-4.32-1.72-4.32-1.72-.31-.8-.76-1.01-.76-1.01-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.6.74 1.99.57.06-.44.24-.74.43-.91-2.85-.32-5.85-1.43-5.85-6.36 0-1.4.5-2.54 1.32-3.44-.13-.33-.57-1.66.13-3.46 0 0 1.08-.35 3.54 1.31A12.3 12.3 0 0 1 12 6.84c1.09.01 2.19.15 3.22.44 2.46-1.66 3.54-1.31 3.54-1.31.7 1.8.26 3.13.13 3.46.82.9 1.32 2.04 1.32 3.44 0 4.94-3 6.04-5.86 6.36.25.22.47.65.47 1.31 0 .95-.01 1.72-.01 1.95 0 .19.13.39.48.33C18.13 21.06 22 16.97 22 12c0-5.52-4.48-10-10-10z" fill="#fff"/>
            </svg>
          </span>
          <span class="brand-title">Automation Test Results Viewer</span>
        </div>
        <div class="navbar-actions">
          <ThemeToggle />
          <a href="https://cucumber.io" target="_blank" class="navbar-link">cucumber.io</a>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <div class="upload-card">
        <h1 class="main-title">Publish and share your test results, straight from this Site.</h1>
        <p class="subtitle">Upload your <span class="accent">Cucumber JSON</span> test report to visualize the results.</p>
        <div class="upload-area">
          <ReportUploader @report-uploaded="handleFileUpload" />
        </div>
      </div>
      <ReportsCollection ref="reportsCollection" />
      <div class="howto-section">
        <h2>Share with your <span class="highlight">team</span></h2>
        <div class="howto-cards">
          <div class="howto-card">
            <v-icon size="32" color="primary" class="howto-icon">mdi-upload</v-icon>
            <div class="howto-title">1. Upload Reports</div>
            <div class="howto-description">Upload your Cucumber JSON files using the form above</div>
          </div>
          <div class="howto-card">
            <v-icon size="32" color="success" class="howto-icon">mdi-cloud-upload</v-icon>
            <div class="howto-title">2. Publish to Team</div>
            <div class="howto-description">Click publish to share reports with your team</div>
          </div>
          <div class="howto-card">
            <v-icon size="32" color="info" class="howto-icon">mdi-chart-line</v-icon>
            <div class="howto-title">3. Track Progress</div>
            <div class="howto-description">Monitor test results and track quality trends over time</div>
          </div>
        </div>
      </div>
    </main>
    <footer class="footer">
      Copyright © 2025 SriSri T
      <br />
      <a href="#" class="footer-link">Terms & Privacy</a>
    </footer>
  </div>
</template>

<script>
import ReportUploader from './ReportUploader.vue';
import ReportsCollection from './ReportsCollection.vue';
import ThemeToggle from './ThemeToggle.vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  components: {
    ReportUploader,
    ReportsCollection,
    ThemeToggle
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return { router, store };
  },
  methods: {
    async handleFileUpload(reportData) {
      // Use the id from the upload event if available
      const id = reportData && reportData._uploadedId;
      if (reportData) {
        this.store.commit('setReportData', reportData);
      }
      
      // Refresh the reports collection to show the new report
      if (this.$refs.reportsCollection) {
        await this.$refs.reportsCollection.refreshReports();
      }
      
      if (id) {
        this.router.push({ name: 'Report', params: { id }, query: { t: Date.now() } });
      } else {
        // fallback: use latest from index
        let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
        const latest = index && index.length ? index[0] : null;
        if (latest && latest.id) {
          this.router.push({ name: 'Report', params: { id: latest.id }, query: { t: Date.now() } });
        }
      }
    }
  }
}
</script>

<style scoped>
.landing-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e6f9ee 100%);
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Premium Dark Theme for Landing Page */
[data-theme="dark"] .landing-bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
}

[data-theme="dark"] .landing-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(96, 165, 250, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

[data-theme="dark"] .landing-bg > * {
  position: relative;
  z-index: 1;
}

.navbar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Premium Dark Navbar */
[data-theme="dark"] .navbar {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
}

.navbar-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  height: 32px;
  width: 32px;
}

.brand-title {
  font-weight: bold;
  font-size: 1.2rem;
  color: #1e293b;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

[data-theme="dark"] .brand-title {
  color: #e2e8f0;
  text-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-link {
  color: #64748b;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}
.navbar-link:hover {
  color: #00a818;
  text-decoration: underline;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 0 1rem;
}

.upload-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 6px 32px rgba(0,168,24,0.07), 0 1.5px 6px rgba(0,0,0,0.03);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 520px;
  width: 100%;
  margin-bottom: 2.5rem;
  text-align: center;
  border-top: 4px solid #00a818;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Premium Dark Upload Card */
[data-theme="dark"] .upload-card {
  background: linear-gradient(145deg, rgba(45, 55, 72, 0.9) 0%, rgba(74, 85, 104, 0.8) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-top: 4px solid #60a5fa;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 8px 32px rgba(96, 165, 250, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .upload-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 32px 80px rgba(0, 0, 0, 0.5),
    0 12px 48px rgba(96, 165, 250, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.main-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e293b;
  transition: all 0.3s ease;
}

[data-theme="dark"] .main-title {
  color: #f1f5f9;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.accent {
  color: #00a818;
  font-weight: 600;
  transition: all 0.3s ease;
}

[data-theme="dark"] .subtitle {
  color: #cbd5e0;
}

[data-theme="dark"] .accent {
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
}

.upload-area {
  border: 2px dashed #00a818;
  border-radius: 0.8rem;
  padding: 2rem 1rem 1.5rem 1rem;
  background: #f6fff9;
  margin-bottom: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.upload-area:hover {
  border-color: #059c1b;
  transform: scale(1.02);
}

/* Premium Dark Upload Area */
[data-theme="dark"] .upload-area {
  border: 2px dashed rgba(96, 165, 250, 0.4);
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, rgba(52, 211, 153, 0.03) 100%);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent);
  transition: left 0.6s ease;
}

[data-theme="dark"] .upload-area:hover {
  border-color: rgba(96, 165, 250, 0.6);
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(52, 211, 153, 0.05) 100%);
  box-shadow: 0 8px 32px rgba(96, 165, 250, 0.2);
  transform: scale(1.02);
}

[data-theme="dark"] .upload-area:hover::before {
  left: 100%;
}

.upload-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  color: #64748b;
  font-size: 1rem;
  margin-top: 1rem;
  opacity: 0.85;
}
.upload-icon {
  width: 28px;
  height: 28px;
}

.howto-section {
  text-align: center;
  margin-top: 2rem;
}

.howto-section h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  transition: all 0.3s ease;
}

.highlight {
  color: #00a818;
  transition: all 0.3s ease;
}

[data-theme="dark"] .howto-section h2 {
  color: #f1f5f9;
}

[data-theme="dark"] .highlight {
  color: #34d399;
  text-shadow: 0 0 15px rgba(52, 211, 153, 0.4);
}

.howto-cards {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.howto-card {
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.2rem 1.5rem;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.howto-card:hover {
  box-shadow: 0 4px 16px rgba(0,168,24,0.09);
  transform: translateY(-4px);
}

/* Premium Dark How-to Cards */
[data-theme="dark"] .howto-card {
  background: linear-gradient(145deg, rgba(45, 55, 72, 0.8) 0%, rgba(74, 85, 104, 0.6) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(96, 165, 250, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .howto-card:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border-color: rgba(96, 165, 250, 0.3);
  background: linear-gradient(145deg, rgba(45, 55, 72, 0.9) 0%, rgba(74, 85, 104, 0.7) 100%);
}

.howto-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 0.5rem;
}

.howto-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
  transition: all 0.3s ease;
}

code {
  background: #f1f5f9;
  border-radius: 0.3rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.95em;
  color: #334155;
  transition: all 0.3s ease;
}

[data-theme="dark"] .howto-title {
  color: #e2e8f0;
}

[data-theme="dark"] code {
  background: rgba(74, 85, 104, 0.6);
  color: #94a3b8;
  border: 1px solid rgba(96, 165, 250, 0.2);
  backdrop-filter: blur(5px);
}

.footer {
  background: #f1f5f9;
  color: #64748b;
  text-align: center;
  padding: 1.5rem 0 1rem 0;
  font-size: 0.95rem;
  margin-top: auto;
  transition: all 0.3s ease;
}

[data-theme="dark"] .footer {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
  backdrop-filter: blur(20px);
  color: #94a3b8;
  border-top: 1px solid rgba(96, 165, 250, 0.2);
  position: relative;
}

[data-theme="dark"] .footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent);
}

.footer-link {
  color: #64748b;
  text-decoration: underline;
  margin-left: 0.5rem;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .navbar-content {
    padding: 0 1rem;
  }
  
  .brand-title {
    font-size: 1rem;
    display: none; /* Hide on mobile to save space */
  }
  
  .navbar-actions {
    gap: 0.5rem;
  }
  
  .main-content {
    padding: 1.5rem 0.75rem 0 0.75rem;
  }
  
  .upload-card {
    padding: 1.5rem 1rem;
    margin-bottom: 2rem;
    border-radius: 1rem;
  }
  
  .main-title {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }
  
  .subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }
  
  .upload-area {
    padding: 1.5rem 0.75rem 1rem 0.75rem;
    border-radius: 0.6rem;
  }
  
  .howto-section {
    margin-top: 2rem;
    padding: 0 0.5rem;
  }
  
  .howto-section h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }
  
  .howto-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .howto-card {
    padding: 1.5rem 1rem;
    border-radius: 0.8rem;
  }
  
  .howto-icon {
    width: 28px;
    height: 28px;
  }
  
  .howto-title {
    font-size: 1rem;
  }
  
  .howto-description {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .footer {
    padding: 1rem 0.5rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .navbar-content {
    padding: 0 0.75rem;
  }
  
  .logo {
    height: 28px;
    width: 28px;
  }
  
  .main-content {
    padding: 1rem 0.5rem 0 0.5rem;
  }
  
  .upload-card {
    padding: 1.25rem 0.75rem;
    margin-bottom: 1.5rem;
    border-radius: 0.8rem;
  }
  
  .main-title {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
  }
  
  .upload-area {
    padding: 1.25rem 0.5rem 0.75rem 0.5rem;
    border-radius: 0.5rem;
  }
  
  .howto-section {
    margin-top: 1.5rem;
    padding: 0 0.25rem;
  }
  
  .howto-section h2 {
    font-size: 1.3rem;
    margin-bottom: 1.25rem;
  }
  
  .howto-cards {
    gap: 0.75rem;
  }
  
  .howto-card {
    padding: 1.25rem 0.75rem;
    border-radius: 0.6rem;
  }
  
  .howto-icon {
    width: 24px;
    height: 24px;
  }
  
  .howto-title {
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
  }
  
  .howto-description {
    font-size: 0.85rem;
  }
  
  .footer {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
}

/* Very small screens */
@media (max-width: 360px) {
  .main-title {
    font-size: 1.1rem;
  }
  
  .subtitle {
    font-size: 0.85rem;
  }
  
  .upload-card {
    padding: 1rem 0.5rem;
  }
  
  .upload-area {
    padding: 1rem 0.4rem 0.6rem 0.4rem;
  }
  
  .howto-section h2 {
    font-size: 1.2rem;
  }
  
  .howto-card {
    padding: 1rem 0.5rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .howto-card {
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  
  .navbar-link {
    padding: 0.5rem;
    border-radius: 0.25rem;
  }
  
  .upload-area {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>