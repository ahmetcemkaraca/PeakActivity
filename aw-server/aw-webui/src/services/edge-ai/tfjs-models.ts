/**
 * TensorFlow.js Models for Client-Side Edge AI
 * Provides ML models that run entirely in the browser for privacy
 */

import * as tf from '@tensorflow/tfjs';

export interface ActivityClassificationInput {
  appName: string;
  title: string;
  duration: number;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
}

export interface FocusPattern {
  timestamp: number;
  focusScore: number;
  distractionScore: number;
  appSwitchFrequency: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  expectedRange: { min: number; max: number };
  actualValue: number;
}

export interface TimeSeriesPrediction {
  predictions: number[];
  confidence: number[];
  timestamps: number[];
}

/**
 * Activity Classification Model
 * Classifies activities as productive (1) or non-productive (0)
 */
export class ActivityClassifier {
  private model: tf.LayersModel | null = null;
  private readonly modelUrl = '/models/activity-classifier';
  private vocabMap: Map<string, number> = new Map();
  private readonly maxVocabSize = 10000;

  async initialize(): Promise<void> {
    try {
      // Try to load pre-trained model
      this.model = await tf.loadLayersModel(`${this.modelUrl}/model.json`);
      console.log('Loaded pre-trained activity classifier');
    } catch (error) {
      // Create new model if not found
      console.log('Creating new activity classifier model');
      this.model = this.createModel();
    }

    // Load or initialize vocabulary
    await this.loadVocabulary();
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // Input: [appName_embedding, title_embedding, duration, timeOfDay, dayOfWeek]
        tf.layers.dense({
          inputShape: [512], // 256 + 256 + 3 features
          units: 256,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Binary classification: productive vs non-productive
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private async loadVocabulary(): Promise<void> {
    try {
      const response = await fetch('/models/activity-classifier/vocab.json');
      const vocab = await response.json();
      this.vocabMap = new Map(Object.entries(vocab));
    } catch {
      // Initialize empty vocabulary
      this.vocabMap = new Map();
    }
  }

  private textToEmbedding(text: string, size: number = 256): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(size).fill(0);

    words.forEach((word, idx) => {
      if (!this.vocabMap.has(word)) {
        if (this.vocabMap.size < this.maxVocabSize) {
          this.vocabMap.set(word, this.vocabMap.size);
        }
      }

      const wordId = this.vocabMap.get(word) || 0;
      const position = wordId % size;
      embedding[position] += 1 / (idx + 1); // Position-weighted
    });

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? embedding.map(val => val / norm) : embedding;
  }

  private preprocessInput(input: ActivityClassificationInput): tf.Tensor2D {
    const appEmbedding = this.textToEmbedding(input.appName, 256);
    const titleEmbedding = this.textToEmbedding(input.title, 256);

    // Normalize features
    const duration = Math.min(input.duration / 3600, 1); // Cap at 1 hour
    const timeOfDay = input.timeOfDay / 24;
    const dayOfWeek = input.dayOfWeek / 7;

    const features = [
      ...appEmbedding,
      ...titleEmbedding,
      duration,
      timeOfDay,
      dayOfWeek
    ];

    return tf.tensor2d([features], [1, 512]);
  }

  async classify(input: ActivityClassificationInput): Promise<{
    isProductive: boolean;
    confidence: number;
  }> {
    if (!this.model) {
      await this.initialize();
    }

    const inputTensor = this.preprocessInput(input);
    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const score = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    return {
      isProductive: score > 0.5,
      confidence: score > 0.5 ? score : 1 - score
    };
  }

  async train(
    trainingData: { input: ActivityClassificationInput; label: number }[]
  ): Promise<{ loss: number; accuracy: number }> {
    if (!this.model) {
      await this.initialize();
    }

    const inputs = trainingData.map(d => this.preprocessInput(d.input));
    const labels = trainingData.map(d => d.label);

    const xs = tf.concat(inputs);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const history = await this.model!.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, acc = ${logs?.acc.toFixed(4)}`);
        }
      }
    });

    // Cleanup
    inputs.forEach(t => t.dispose());
    xs.dispose();
    ys.dispose();

    const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
    const finalAcc = history.history.acc[history.history.acc.length - 1] as number;

    return { loss: finalLoss, accuracy: finalAcc };
  }

  async save(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://activity-classifier');

      // Save vocabulary
      const vocab = Object.fromEntries(this.vocabMap);
      localStorage.setItem('activity-classifier-vocab', JSON.stringify(vocab));
    }
  }
}

/**
 * Focus Pattern Detector
 * Uses LSTM to detect focus patterns over time
 */
export class FocusPatternDetector {
  private model: tf.LayersModel | null = null;
  private readonly sequenceLength = 60; // 60 minutes of data

  async initialize(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://focus-pattern-detector');
      console.log('Loaded focus pattern detector');
    } catch {
      console.log('Creating new focus pattern detector');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          inputShape: [this.sequenceLength, 3], // [focusScore, distractionScore, appSwitchFreq]
          units: 64,
          returnSequences: true
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 3, // Predict next [focus, distraction, switches]
          activation: 'sigmoid'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  private preprocessSequence(patterns: FocusPattern[]): tf.Tensor3D {
    // Pad or truncate to sequence length
    const sequence = patterns.slice(-this.sequenceLength);
    while (sequence.length < this.sequenceLength) {
      sequence.unshift({
        timestamp: 0,
        focusScore: 0,
        distractionScore: 0,
        appSwitchFrequency: 0
      });
    }

    const features = sequence.map(p => [
      p.focusScore,
      p.distractionScore,
      p.appSwitchFrequency
    ]);

    return tf.tensor3d([features], [1, this.sequenceLength, 3]);
  }

  async detectPattern(history: FocusPattern[]): Promise<{
    nextFocusScore: number;
    nextDistractionScore: number;
    nextAppSwitchFrequency: number;
    confidence: number;
  }> {
    if (!this.model) {
      await this.initialize();
    }

    const inputTensor = this.preprocessSequence(history);
    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const [focus, distraction, switches] = await prediction.data();

    inputTensor.dispose();
    prediction.dispose();

    // Calculate confidence based on recent pattern stability
    const recentVariance = this.calculateVariance(history.slice(-10));
    const confidence = Math.max(0, 1 - recentVariance);

    return {
      nextFocusScore: focus,
      nextDistractionScore: distraction,
      nextAppSwitchFrequency: switches,
      confidence
    };
  }

  private calculateVariance(patterns: FocusPattern[]): number {
    if (patterns.length < 2) return 1;

    const mean = patterns.reduce((sum, p) => sum + p.focusScore, 0) / patterns.length;
    const variance = patterns.reduce((sum, p) => sum + Math.pow(p.focusScore - mean, 2), 0) / patterns.length;

    return Math.sqrt(variance);
  }

  async save(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://focus-pattern-detector');
    }
  }
}

/**
 * Anomaly Detector
 * Detects unusual activity patterns using autoencoder
 */
export class AnomalyDetector {
  private model: tf.LayersModel | null = null;
  private threshold: number = 0.1; // Reconstruction error threshold

  async initialize(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://anomaly-detector');
      const savedThreshold = localStorage.getItem('anomaly-detector-threshold');
      if (savedThreshold) {
        this.threshold = parseFloat(savedThreshold);
      }
      console.log('Loaded anomaly detector');
    } catch {
      console.log('Creating new anomaly detector');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    // Autoencoder architecture
    const inputDim = 24; // 24 hours

    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [inputDim], units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'relu' })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: inputDim, activation: 'sigmoid' })
      ]
    });

    // Combine encoder and decoder
    const autoencoder = tf.sequential({
      layers: [...encoder.layers, ...decoder.layers]
    });

    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return autoencoder;
  }

  private preprocessDailyPattern(hourlyActivity: number[]): tf.Tensor2D {
    // Normalize to [0, 1]
    const max = Math.max(...hourlyActivity, 1);
    const normalized = hourlyActivity.map(val => val / max);

    // Pad to 24 hours if needed
    while (normalized.length < 24) {
      normalized.push(0);
    }

    return tf.tensor2d([normalized.slice(0, 24)], [1, 24]);
  }

  async detect(hourlyActivity: number[]): Promise<AnomalyDetectionResult> {
    if (!this.model) {
      await this.initialize();
    }

    const inputTensor = this.preprocessDailyPattern(hourlyActivity);
    const reconstruction = this.model!.predict(inputTensor) as tf.Tensor;

    // Calculate reconstruction error
    const error = tf.losses.meanSquaredError(inputTensor, reconstruction);
    const anomalyScore = (await error.data())[0];

    inputTensor.dispose();
    reconstruction.dispose();
    error.dispose();

    const isAnomaly = anomalyScore > this.threshold;

    // Calculate expected range based on normal patterns
    const mean = hourlyActivity.reduce((sum, val) => sum + val, 0) / hourlyActivity.length;
    const std = Math.sqrt(
      hourlyActivity.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / hourlyActivity.length
    );

    return {
      isAnomaly,
      anomalyScore,
      expectedRange: {
        min: Math.max(0, mean - 2 * std),
        max: mean + 2 * std
      },
      actualValue: mean
    };
  }

  async trainOnNormalData(normalPatterns: number[][]): Promise<void> {
    if (!this.model) {
      await this.initialize();
    }

    const inputs = normalPatterns.map(pattern => this.preprocessDailyPattern(pattern));
    const xs = tf.concat(inputs);

    await this.model!.fit(xs, xs, {
      epochs: 50,
      batchSize: 16,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Anomaly detector epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(6)}`);
        }
      }
    });

    // Calculate threshold from training data
    const errors: number[] = [];
    for (const input of inputs) {
      const reconstruction = this.model!.predict(input) as tf.Tensor;
      const error = tf.losses.meanSquaredError(input, reconstruction);
      errors.push((await error.data())[0]);
      reconstruction.dispose();
      error.dispose();
    }

    // Set threshold to 95th percentile
    errors.sort((a, b) => a - b);
    this.threshold = errors[Math.floor(errors.length * 0.95)];

    // Cleanup
    inputs.forEach(t => t.dispose());
    xs.dispose();
  }

  async save(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://anomaly-detector');
      localStorage.setItem('anomaly-detector-threshold', this.threshold.toString());
    }
  }
}

/**
 * Time Series Predictor
 * Predicts future productivity patterns
 */
export class TimeSeriesPredictor {
  private model: tf.LayersModel | null = null;
  private readonly inputSteps = 14; // Use 14 days to predict next 7 days
  private readonly outputSteps = 7;

  async initialize(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://time-series-predictor');
      console.log('Loaded time series predictor');
    } catch {
      console.log('Creating new time series predictor');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          inputShape: [this.inputSteps, 1],
          units: 50,
          returnSequences: true
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 50,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 25,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: this.outputSteps
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async predict(historicalData: number[]): Promise<TimeSeriesPrediction> {
    if (!this.model) {
      await this.initialize();
    }

    // Take last inputSteps days
    const recentData = historicalData.slice(-this.inputSteps);

    // Normalize
    const mean = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
    const std = Math.sqrt(
      recentData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentData.length
    );
    const normalized = recentData.map(val => (val - mean) / (std || 1));

    const inputTensor = tf.tensor3d([normalized.map(val => [val])], [1, this.inputSteps, 1]);
    const prediction = this.model!.predict(inputTensor) as tf.Tensor;
    const predictionData = await prediction.data();

    inputTensor.dispose();
    prediction.dispose();

    // Denormalize predictions
    const predictions = Array.from(predictionData).map(val => val * (std || 1) + mean);

    // Calculate confidence based on historical variance
    const variance = std / mean;
    const baseConfidence = Math.max(0, 1 - variance);
    const confidence = predictions.map((_, idx) =>
      baseConfidence * Math.pow(0.9, idx) // Decrease confidence for further predictions
    );

    // Generate timestamps (assuming daily data)
    const lastTimestamp = Date.now();
    const timestamps = predictions.map((_, idx) =>
      lastTimestamp + (idx + 1) * 24 * 60 * 60 * 1000
    );

    return {
      predictions,
      confidence,
      timestamps
    };
  }

  async save(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://time-series-predictor');
    }
  }
}

/**
 * Model Manager
 * Coordinates all TensorFlow.js models
 */
export class EdgeAIModelManager {
  private activityClassifier: ActivityClassifier;
  private focusPatternDetector: FocusPatternDetector;
  private anomalyDetector: AnomalyDetector;
  private timeSeriesPredictor: TimeSeriesPredictor;

  constructor() {
    this.activityClassifier = new ActivityClassifier();
    this.focusPatternDetector = new FocusPatternDetector();
    this.anomalyDetector = new AnomalyDetector();
    this.timeSeriesPredictor = new TimeSeriesPredictor();
  }

  async initializeAll(): Promise<void> {
    console.log('Initializing Edge AI models...');
    await Promise.all([
      this.activityClassifier.initialize(),
      this.focusPatternDetector.initialize(),
      this.anomalyDetector.initialize(),
      this.timeSeriesPredictor.initialize()
    ]);
    console.log('All Edge AI models initialized');
  }

  getActivityClassifier(): ActivityClassifier {
    return this.activityClassifier;
  }

  getFocusPatternDetector(): FocusPatternDetector {
    return this.focusPatternDetector;
  }

  getAnomalyDetector(): AnomalyDetector {
    return this.anomalyDetector;
  }

  getTimeSeriesPredictor(): TimeSeriesPredictor {
    return this.timeSeriesPredictor;
  }

  async saveAll(): Promise<void> {
    console.log('Saving all Edge AI models...');
    await Promise.all([
      this.activityClassifier.save(),
      this.focusPatternDetector.save(),
      this.anomalyDetector.save(),
      this.timeSeriesPredictor.save()
    ]);
    console.log('All models saved');
  }

  getMemoryUsage(): string {
    const memInfo = tf.memory();
    return `Models: ${memInfo.numTensors} tensors, ${(memInfo.numBytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
