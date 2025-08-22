// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import { StatusBar, Style } from '@capacitor/status-bar';

/* Core CSS */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './theme/variables.css'

/* ✅ Load TensorFlow.js globally (only once) */
import * as tf from '@tensorflow/tfjs'
import * as tflite from '@tensorflow/tfjs-tflite'

// Expose globally so components can use window.tf / window.tflite
;(window as any).tf = tf
// ;(window as any).tflite = tflite

const app = createApp(App).use(IonicVue).use(router)
StatusBar.setOverlaysWebView({ overlay: false });
StatusBar.setStyle({ style: Style.Light }); // or Style.Dark
StatusBar.setBackgroundColor({ color: '#2e7d32' }); // watermelon green

router.isReady().then(() => {
  app.mount('#app')
  defineCustomElements(window)
})
