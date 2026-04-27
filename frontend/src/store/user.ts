import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('jthub_token') ?? '')
  const userId = ref(localStorage.getItem('jthub_userId') ?? '')

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t: string, uid: string) {
    token.value = t
    userId.value = uid
    localStorage.setItem('jthub_token', t)
    localStorage.setItem('jthub_userId', uid)
  }

  function logout() {
    token.value = ''
    userId.value = ''
    localStorage.removeItem('jthub_token')
    localStorage.removeItem('jthub_userId')
  }

  return { token, userId, isLoggedIn, setAuth, logout }
})
