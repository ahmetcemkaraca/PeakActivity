import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAgentStore = defineStore('agent', () => {
  const agentConfigYaml = ref(`
# Örnek Ajan Yapılandırması
agents:
  - name: ProductivityAgent
    role: Verimlilik uzmanı
    goal: Kullanıcının odaklanma süresini artırmak ve dikkat dağınıklığını azaltmak
    backstory: ActivityWatch verilerini analiz ederek kişiselleştirilmiş verimlilik stratejileri sunar.
    tools: [] # Buraya özel araçlar eklenebilir
tasks:
  - name: AnalyzeFocusPatterns
    agent: ProductivityAgent
    description: Kullanıcının son 24 saatteki odaklanma desenlerini ActivityWatch verilerinden analiz et.
    expected_output: "Odaklanma süreleri, dikkat dağınıklığı anları ve bağlam değişimleri hakkında detaylı analiz."
  - name: SuggestOptimizations
    agent: ProductivityAgent
    description: Analizlere dayanarak, kullanıcının verimliliğini artırmak için kişiselleştirilmiş öneriler ve eylem adımları sun.
    expected_output: "Uygulanabilir verimlilik ipuçları ve dikkat dağınıklığını azaltma stratejileri listesi."
`);
  const topic = ref('');
  const output = ref<any>(null);
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  const configError = ref<string | null>(null);
  const topicError = ref<string | null>(null);

  function $reset() {
    agentConfigYaml.value = `
# Örnek Ajan Yapılandırması
agents:
  - name: ProductivityAgent
    role: Verimlilik uzmanı
    goal: Kullanıcının odaklanma süresini artırmak ve dikkat dağınıklığını azaltmak
    backstory: ActivityWatch verilerini analiz ederek kişiselleştirilmiş verimlilik stratejileri sunar.
    tools: [] # Buraya özel araçlar eklenebilir
tasks:
  - name: AnalyzeFocusPatterns
    agent: ProductivityAgent
    description: Kullanıcının son 24 saatteki odaklanma desenlerini ActivityWatch verilerinden analiz et.
    expected_output: "Odaklanma süreleri, dikkat dağınıklığı anları ve bağlam değişimleri hakkında detaylı analiz."
  - name: SuggestOptimizations
    agent: ProductivityAgent
    description: Analizlere dayanarak, kullanıcının verimliliğini artırmak için kişiselleştirilmiş öneriler ve eylem adımları sun.
    expected_output: "Uygulanabilir verimlilik ipuçları ve dikkat dağınıklığını azaltma stratejileri listesi."
`;
    topic.value = '';
    output.value = null;
    error.value = null;
    isLoading.value = false;
    configError.value = null;
    topicError.value = null;
  }

  return {
    agentConfigYaml,
    topic,
    output,
    error,
    isLoading,
    configError,
    topicError,
    $reset,
  };
});
