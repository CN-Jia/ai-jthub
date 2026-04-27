import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '../store/admin'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/login', component: () => import('../pages/login/index.vue') },
    {
      path: '/',
      component: () => import('../pages/dashboard/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders',
      component: () => import('../pages/orders/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      component: () => import('../pages/order-detail/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/order-types',
      component: () => import('../pages/order-types/index.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/activities',
      component: () => import('../pages/activities/index.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const store = useAdminStore()
  if (to.meta.requiresAuth && !store.isLoggedIn) return '/login'
})

export default router
