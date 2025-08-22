import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/home',     // 👈 now matches /home
    name: 'Home',
    component: HomePage
  },
  {
    path: '/',
    redirect: '/home'  // 👈 redirect root to /home
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
