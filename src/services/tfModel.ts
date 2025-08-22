// src/services/tfmodel.ts

// tflite is loaded from CDN in index.html, so we declare it here
declare const tflite: any;

let model: any = null;

/**
 * Loads the TFLite model once (singleton pattern).
 */
export async function loadModel() {
  if (!model) {
    try {
      model = await tflite.loadTFLiteModel('/models/watermelon_model.tflite');
      console.log('✅ Watermelon TFLite model loaded');
    } catch (error) {
      console.error('❌ Failed to load TFLite model:', error);
      throw error;
    }
  }
  return model;
}

/**
 * Run prediction on an input tensor
 * @param imageTensor - Preprocessed tf.Tensor (e.g., resized & normalized)
 * @returns Object with label + probabilities
 */
export async function predict(imageTensor: any) {
  if (!model) {
    await loadModel();
  }

  try {
    const output = model.predict(imageTensor);
    const preds = output.dataSync();

    const unripeProb = preds[0] ?? 0;
    const ripeProb = preds[1] ?? 0;

    return {
      label: ripeProb > unripeProb ? 'Ripe' : 'Unripe',
      ripeProb,
      unripeProb
    };
  } catch (error) {
    console.error('❌ Prediction failed:', error);
    throw error;
  }
}
