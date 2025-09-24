import { defineStore } from 'pinia';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from './auth';

interface PredictionState {
  prediction: any | null;
  loading: boolean;
  error: string | null;
}

export const usePredictionStore = defineStore('prediction', {
  state: (): PredictionState => ({
    prediction: null,
    loading: false,
    error: null,
  }),

  actions: {
    // fetchTaskCompletionPrediction yerine daha genel bir fetchAIInsight metodu ekliyoruz
    async fetchAIInsight(insightType: string, startDate?: string, endDate?: string) {
      this.loading = true;
      this.error = null;
      this.prediction = null;

      try {
        const authStore = useAuthStore();
        const user = authStore.user;
        if (!user) {
          throw new Error('Kullanıcı kimliği doğrulanmamış.');
        }

        const generateInsightCallable = httpsCallable(functions, 'generateInsight');
        const result = await generateInsightCallable({
          userId: user.uid,
          insightType,
          startDate,
          endDate,
        });
        this.prediction = result.data;
      } catch (error: any) {
        console.error('Yapay zeka içgörüsü alınırken hata oluştu:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
