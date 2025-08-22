import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Add a resolver to stub missing tflite_web_api_client
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '../tflite_web_api_client': '/src/shims/tflite_web_api_client.js'
    }
  }
})
