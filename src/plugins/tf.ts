// src/plugins/tf.ts
import * as tf from '@tensorflow/tfjs'
// If you also need TFLite:
// import * as tflite from '@tensorflow/tfjs-tflite'

// Optional: reduce console spam
if ((tf as any).enableProdMode) {
  (tf as any).enableProdMode()
}

export default tf
