import * as tf from '@tensorflow/tfjs';
// import * as ort from 'onnxruntime-web'; // Eğer ONNX.js kullanılacaksa

export class EdgeAIService {
  private models: Map<string, tf.LayersModel | any>; // Modelleri tutacak map

  constructor() {
    this.models = new Map();
  }

  /**
   * Belirtilen URL'den bir TensorFlow.js modeli yükler.
   * @param modelName Model için benzersiz bir isim.
   * @param modelUrl Modelin yükleneceği URL (model.json).
   */
  async loadTFJSModel(modelName: string, modelUrl: string): Promise<void> {
    try {
      console.log(`Loading TensorFlow.js model: ${modelName} from ${modelUrl}`);
      const model = await tf.loadLayersModel(modelUrl);
      this.models.set(modelName, model);
      console.log(`Model ${modelName} loaded successfully.`);
    } catch (error) {
      console.error(`Failed to load TensorFlow.js model ${modelName}:`, error);
      throw new Error(`Model yüklenirken hata oluştu: ${error}`);
    }
  }

  /**
   * Yüklenen bir TensorFlow.js modelini kullanarak tahmin yapar.
   * @param modelName Kullanılacak modelin ismi.
   * @param inputData Modele verilecek giriş verisi.
   * @returns Modelin tahmin sonuçları.
   */
  async predictWithTFJSModel(
    modelName: string,
    inputData: tf.Tensor | tf.Tensor[]
  ): Promise<tf.Tensor | tf.Tensor[]> {
    const model = this.models.get(modelName);
    if (!model || !(model instanceof tf.LayersModel)) {
      throw new Error(`TensorFlow.js modeli '${modelName}' yüklenmemiş veya geçersiz.`);
    }

    try {
      console.log(`Making prediction with model: ${modelName}`);
      const prediction = model.predict(inputData);
      return prediction;
    } catch (error) {
      console.error(`Failed to make prediction with model ${modelName}:`, error);
      throw new Error(`Tahmin yapılırken hata oluştu: ${error}`);
    }
  }

  // TODO: Eğer ONNX.js kullanılacaksa, benzer metodlar buraya eklenebilir
  // async loadONNXModel(modelName: string, modelUrl: string): Promise<void> {
  //     try {
  //         console.log(`Loading ONNX.js model: ${modelName} from ${modelUrl}`);
  //         const session = await ort.InferenceSession.create(modelUrl);
  //         this.models.set(modelName, session);
  //         console.log(`Model ${modelName} loaded successfully.`);
  //     } catch (error) {
  //         console.error(`Failed to load ONNX.js model ${modelName}:`, error);
  //         throw new Error(`ONNX modeli yüklenirken hata oluştu: ${error}`);
  //     }
  // }

  // async runONNXModel(modelName: string, inputFeed: ort.OnnxValueMapType): Promise<ort.OnnxValueMapType> {
  //     const session = this.models.get(modelName);
  //     if (!session || !(session instanceof ort.InferenceSession)) {
  //         throw new Error(`ONNX modeli '${modelName}' yüklenmemiş veya geçersiz.`);
  //     }

  //     try {
  //         console.log(`Running ONNX model: ${modelName}`);
  //         const results = await session.run(inputFeed);
  //         return results;
  //     } catch (error) {
  //         console.error(`Failed to run ONNX model ${modelName}:`, error);
  //         throw new Error(`ONNX modeli çalıştırılırken hata oluştu: ${error}`);
  //     }
  // }
}
