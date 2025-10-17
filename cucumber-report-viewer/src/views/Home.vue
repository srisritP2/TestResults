<template>
  <div class="home">
    <LandingPage @report-uploaded="onReportUploaded" />
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage.vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  components: {
    LandingPage
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const onReportUploaded = (reportData) => {
      console.log('Report uploaded:', reportData); // Debug log
      
      // Store the report data in Vuex
      store.commit('setReportData', reportData);
      
      // Navigate to report view
      if (reportData._uploadedId) {
        router.push({ name: 'Report', params: { id: reportData._uploadedId } });
      } else {
        router.push('/report');
      }
    };
    return { onReportUploaded };
  }
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
</style>