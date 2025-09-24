<template>
  <div class="activity-classifier">
    <h3>Activity Classifier (TensorFlow.js Demo)</h3>
    <input v-model="inputText" placeholder="Enter activity description" @input="classifyActivity" />
    <p v-if="classificationResult">Classification: {{ classificationResult.category }} (Confidence: {{ classificationResult.confidence }})</p>
    <p v-if="loading">Classifying...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as tf from '@tensorflow/tfjs';

interface ClassificationResult {
  category: string;
  confidence: number;
}

const inputText = ref('');
const classificationResult = ref<ClassificationResult | null>(null);
const loading = ref(false);

let model: tf.LayersModel | null = null;

onMounted(async () => {
  // Load a pre-trained model or use a simple one for demo
  // For demo, we'll use a simple logistic regression or mock
  // In real, load from tfjs model file
  model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 8, activation: 'relu', inputShape: [1] }),
      tf.layers.dense({ units: 5, activation: 'softmax' }), // 5 categories for demo
    ],
  });
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  // Mock training or load weights
  console.log('Model loaded for demo');
});

const classifyActivity = async () => {
  if (!inputText.value) {
    classificationResult.value = null;
    return;
  }

  loading.value = true;

  // Simple mock classification based on input length or keywords
  // In real, use model.predict
  const categories = ['coding', 'design', 'research', 'social', 'gaming'];
  const mockPrediction = tf.tensor2d([[inputText.value.length % 5]]); // Mock input
  const prediction = model ? model.predict(mockPrediction) as tf.Tensor : null;
  const scores = prediction ? (prediction.dataSync() as Float32Array) : [0.2, 0.2, 0.2, 0.2, 0.2];
  const maxIndex = scores.indexOf(Math.max(...scores));
  const category = categories[maxIndex];
  const confidence = Math.max(...scores);

  classificationResult.value = {
    category,
    confidence: Number(confidence.toFixed(2)),
  };

  loading.value = false;
};
</script>

<style scoped>
.activity-classifier {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 400px;
}

input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

p {
  font-weight: bold;
  color: #333;
}
</style>
