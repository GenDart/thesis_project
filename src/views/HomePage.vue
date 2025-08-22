<template>
  <ion-page>
    <!-- Header -->
    <ion-header>
      <ion-toolbar color="success">
        <ion-title style="font-weight: bold; letter-spacing: 1px">
          🍉 Watermelon Detector
        </ion-title>
        <ion-buttons slot="end">
          <!-- Refresh Button -->
          <ion-button fill="clear" @click="resetScan">
            <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="toggleHistory">
            <ion-icon :icon="timeOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Content -->
    <ion-content fullscreen class="detector-bg">
      <div class="ion-padding detector-container">
        <!-- App heading -->
        <h2 class="detector-title">Check Watermelon Ripeness</h2>
        <p class="detector-subtitle">
          (crimson-sweet-f1) <br>
          Snap or upload a picture and let AI detect if it’s ripe or unripe.
        </p>

        <!-- Action buttons -->
        <ion-button
          expand="block"
          shape="round"
          color="success"
          @click="takePicture"
          :disabled="loading"
        >
          📷 Take Picture
        </ion-button>

        <ion-button
          expand="block"
          shape="round"
          color="tertiary"
          @click="triggerUpload"
          :disabled="loading"
        >
          ⬆️ Upload Image
        </ion-button>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        />

        <!-- Spinner while analyzing -->
        <div v-if="loading" class="loading-container">
          <ion-spinner name="crescent" color="success"></ion-spinner>
          <div class="loading-text">Analyzing your watermelon...</div>
        </div>

        <!-- Display photo -->
        <ion-card v-if="photo && !loading" class="photo-card">
          <ion-img :src="photo"></ion-img>
        </ion-card>

        <!-- Display result -->
        <ion-card
          v-if="predictionResult && !loading"
          class="result-card"
          :style="{ borderColor: predictionColor }"
        >
          <ion-card-content>
            <h3 :style="{ color: predictionColor }">
              Prediction: {{ predictionResult }}
            </h3>
            <p v-if="predictionPercent !== null">
              Accuracy: <b>{{ predictionPercent }}%</b>
            </p>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- History Modal -->
      <ion-modal :is-open="showHistory" @did-dismiss="showHistory = false">
        <ion-header>
          <ion-toolbar color="success">
            <ion-title>📜 Scan History</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="showHistory = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <ion-list v-if="history.length > 0">
            <ion-item v-for="entry in history" :key="entry.id" lines="full">
              <!-- Thumbnail -->
              <ion-thumbnail slot="start">
                <ion-img :src="entry.image"></ion-img>
              </ion-thumbnail>

              <!-- Result info -->
              <ion-label @click="reRunPrediction(entry)">
                <h3>
                  <b
                    :style="{
                      color: entry.result === 'Ripe' ? 'green' : 'orange',
                    }"
                  >
                    {{ entry.result }}
                  </b>
                  ({{ entry.accuracy }}%)
                </h3>
                <p>{{ new Date(entry.created_at).toLocaleString() }}</p>
              </ion-label>

              <!-- Delete Icon -->
              <ion-button
                slot="end"
                fill="clear"
                color="danger"
                @click="handleDelete(entry.id)"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>

          <div v-else class="empty-history">
            <ion-icon
              name="document-text-outline"
              style="font-size: 3rem; color: #bbb"
            ></ion-icon>
            <p>No history yet 🍉</p>
          </div>

          <!-- Clear All Button -->
          <ion-button
            expand="block"
            color="medium"
            fill="outline"
            v-if="history.length > 0"
            @click="handleClearAll"
            style="margin-top: 20px; border-radius: 12px"
          >
            🧹 Clear All History
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { Camera, CameraResultType } from "@capacitor/camera";
import { ref, onMounted } from "vue";
import {
  initDB,
  addHistory,
  getHistory,
  deleteHistory,
  clearHistory,
} from "../services/db";
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonImg,
  IonModal,
  IonList,
  IonItem,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonThumbnail,
  IonLabel,
} from "@ionic/vue";
import { timeOutline, refreshOutline, closeOutline, trashOutline } from "ionicons/icons";

// Type for history entries
type HistoryEntry = {
  id: number;
  image: string;
  result: string;
  accuracy: number;
  created_at: string;
};

// TensorFlow
const tf = (window as any).tf;
let model: any = null;

const photo = ref<string | null>(null);
const predictionResult = ref("");
const predictionPercent = ref<number | null>(null);
const predictionColor = ref("black");
const loading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const showHistory = ref(false);
const history = ref<HistoryEntry[]>([]);

// Load DB on app start
onMounted(async () => {
  await initDB();
  history.value = await getHistory();
});

// Lazy-load the model
async function getModel() {
  if (!model) {
    const mod = await import("../services/tfModel");
    model = await mod.loadModel();
  }
  return model;
}

async function runPrediction(img: HTMLImageElement) {
  try {
    const tensor = tf.browser
      .fromPixels(img)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .toFloat()
      .div(255);

    const loadedModel = await getModel();
    const output = loadedModel.predict(tensor);
    const preds = output.dataSync();

    const unripeProb = preds[0];
    const ripeProb = preds[1];

    if (ripeProb > unripeProb) {
      predictionResult.value = "Ripe";
      predictionColor.value = "green";
      predictionPercent.value = Math.round(ripeProb * 100);
    } else {
      predictionResult.value = "Unripe";
      predictionColor.value = "orange";
      predictionPercent.value = Math.round(unripeProb * 100);
    }

    // Save to SQLite
    if (photo.value) {
      await addHistory(
        photo.value,
        predictionResult.value,
        predictionPercent.value!
      );
      history.value = await getHistory();
    }
  } catch (err) {
    console.error("Prediction error:", err);
    predictionResult.value = "";
    predictionPercent.value = null;
  } finally {
    loading.value = false;
  }
}

function resetScan() {
  photo.value = null;
  predictionResult.value = "";
  predictionPercent.value = null;
  predictionColor.value = "black";
}

// Delete one
async function handleDelete(entryId: number) {
  await deleteHistory(entryId);
  history.value = await getHistory();
}

// Clear all
async function handleClearAll() {
  await clearHistory();
  history.value = [];
}

async function takePicture() {
  try {
    loading.value = true;
    predictionResult.value = "";

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });

    if (!image.dataUrl) throw new Error("No image captured");
    photo.value = image.dataUrl;

    const img = new Image();
    img.src = image.dataUrl;
    img.onload = () => runPrediction(img);
  } catch (err) {
    console.error("Error taking picture:", err);
    loading.value = false;
  }
}

function triggerUpload() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();
  loading.value = true;
  predictionResult.value = "";

  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    photo.value = dataUrl;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => runPrediction(img);
  };
  reader.readAsDataURL(file);
}

function toggleHistory() {
  showHistory.value = !showHistory.value;
}

function reRunPrediction(entry: HistoryEntry) {
  photo.value = entry.image;
  predictionResult.value = entry.result;
  predictionPercent.value = entry.accuracy;
  predictionColor.value = entry.result === "Ripe" ? "green" : "orange";
  showHistory.value = false;
}
</script>

<style scoped>
.detector-bg {
  --background: linear-gradient(135deg, #fef9f9, #f3ffe6);
}

.detector-container {
  text-align: center;
}

.detector-title {
  font-weight: bold;
  font-size: 1.4rem;
  color: #2e7d32;
}

.detector-subtitle {
  font-size: 0.95rem;
  color: #444;
  margin-bottom: 20px;
}

.loading-container {
  margin-top: 20px;
  text-align: center;
}

.loading-text {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: #555;
}

.photo-card {
  margin-top: 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.result-card {
  margin-top: 20px;
  border: 2px solid;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-history {
  text-align: center;
  margin-top: 40px;
  color: #666;
  font-style: italic;
}

ion-thumbnail {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

ion-item {
  margin-bottom: 8px;
  border-radius: 12px;
  --background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
