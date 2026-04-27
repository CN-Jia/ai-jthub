import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../pages/home/index.vue') },
    { path: '/activity', component: () => import('../pages/activity/index.vue') },
    { path: '/submit', component: () => import('../pages/submit/index.vue'), meta: { requiresAuth: true } },
    { path: '/result', component: () => import('../pages/result/index.vue'), meta: { requiresAuth: true } },
    { path: '/my-orders', component: () => import('../pages/my-orders/index.vue'), meta: { requiresAuth: true } },
    { path: '/orders/:id', component: () => import('../pages/order-detail/index.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const store = useUserStore()
  if (to.meta.requiresAuth && !store.isLoggedIn) {
    return { path: '/', query: { redirect: to.fullPath, needLogin: '1' } }
  }
})

export default router
