import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('../pages/home/index.vue') },
    { path: '/login', component: () => import('../pages/login/index.vue') },
    { path: '/register', component: () => import('../pages/register/index.vue') },
    { path: '/activity', component: () => import('../pages/activity/index.vue') },
    { path: '/forum', component: () => import('../pages/forum/index.vue') },
    { path: '/forum/:id', component: () => import('../pages/forum/detail.vue') },
    { path: '/submit', component: () => import('../pages/submit/index.vue'), meta: { requiresAuth: true } },
    { path: '/result', component: () => import('../pages/result/index.vue'), meta: { requiresAuth: true } },
    { path: '/my-orders', component: () => import('../pages/my-orders/index.vue'), meta: { requiresAuth: true } },
    { path: '/orders/:id', component: () => import('../pages/order-detail/index.vue'), meta: { requiresAuth: true } },
    { path: '/feedback', component: () => import('../pages/feedback/index.vue'), meta: { requiresAuth: true } },
    { path: '/profile', component: () => import('../pages/profile/index.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const store = useUserStore()
  if (to.meta.requiresAuth && !store.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
