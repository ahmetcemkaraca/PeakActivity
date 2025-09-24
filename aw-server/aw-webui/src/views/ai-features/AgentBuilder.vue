<template>
  <div class="agent-builder-view p-4">
    <h1 class="text-2xl font-bold mb-4">Yapay Zeka Ajan Oluşturucu</h1>

    <p class="mb-4">
      Bu araç, ActivityWatch verilerinizi kullanarak üretkenliğinizi artıracak akıllı ajanlar oluşturmanızı ve yönetmenizi sağlar. Ajan yapılandırmanızı girin ve bir konu belirterek ajanın görevini başlatın.
    </p>

    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">Ajan Yapılandırması ve Görevi</h2>
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Ajan Yapılandırma (YAML)</span>
          </label>
          <textarea
            v-model="agentConfigYaml"
            class="textarea textarea-bordered h-48 font-mono"
            placeholder="Ajan ve görev yapılandırmanızı YAML formatında buraya girin..."
          ></textarea>
          <label class="label">
            <span class="label-text-alt text-error" v-if="configError">{{ configError }}</span>
          </label>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Görev Konusu</span>
          </label>
          <input
            type="text"
            v-model="topic"
            placeholder="Örn: 'Odaklanma süresini artırmak için öneriler oluştur.'"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-error" v-if="topicError">{{ topicError }}</span>
          </label>
        </div>

        <div class="card-actions justify-end">
          <button
            @click="generateAgent"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            <span v-if="isLoading" class="loading loading-spinner"></span>
            <span v-else>Ajanı Oluştur ve Çalıştır</span>
          </button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl" v-if="output || error">
      <div class="card-body">
        <h2 class="card-title">Çıktı</h2>
        <div v-if="output" class="alert alert-success">
          <pre class="whitespace-pre-wrap">{{ JSON.stringify(output, null, 2) }}</pre>
        </div>
        <div v-if="error" class="alert alert-error">
          <pre class="whitespace-pre-wrap">{{ error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs } from 'vue'; // toRefs eklendi
// import { httpsCallable } from 'firebase/functions'; // Kaldırıldı
// import { functions } from '../../../firebase'; // Kaldırıldı
import { useAgentStore } from '../../stores/agent'; // Yeni Pinia store'u içe aktarın
import axios from 'axios'; // axios eklendi

const agentStore = useAgentStore();

// Pinia store'dan durumları doğrudan kullan
const { agentConfigYaml, topic, output, error, isLoading, configError, topicError } = toRefs(agentStore); // toRefs ile sarmalandı

// Firebase Callable Function'ı tanımlayın
// const generateAgentCallable = httpsCallable(functions, 'generateAgent'); // Kaldırıldı

const generateAgent = async () => {
  // Hataları sıfırla (store üzerinden)
  agentStore.configError = null;
  agentStore.topicError = null;
  agentStore.output = null;
  agentStore.error = null;

  // Giriş doğrulama
  if (!agentConfigYaml.value) {
    configError.value = 'Ajan yapılandırma YAML\'ı boş olamaz.'; // Doğrudan kullan
    return;
  }
  if (!topic.value) {
    topicError.value = 'Görev konusu boş olamaz.'; // Doğrudan kullan
    return;
  }

  isLoading.value = true;
  try {
    // const result = await generateAgentCallable({
    //   agent_config_data: agentConfigYaml.value,
    //   topic: topic.value,
    // });
    const response = await axios.post('/api/generate-agent', {
      agent_config_data: agentConfigYaml.value,
      topic: topic.value,
    });
    output.value = response.data;
  } catch (err: any) {
    console.error("Ajan oluşturma hatası:", err);
    error.value = err.message || 'Ajan oluşturma sırasında bir hata oluştu.';
    if (err.details) {
      error.value += ` Detaylar: ${JSON.stringify(err.details)}`;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Bileşenin özel stilleri */
.agent-builder-view {
  max-width: 960px;
  margin: 0 auto;
}
.textarea {
  min-height: 200px;
}
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style> 