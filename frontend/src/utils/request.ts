// uni.request 封装，自动注入 JWT、统一处理 401
import { useUserStore } from '../store/user'

// 小程序环境用本地后端调试地址，正式上线改为真实域名
const BASE_URL = (() => {
  // #ifdef MP-WEIXIN
  return 'http://localhost:3000'
  // #endif
  // #ifdef H5
  return ''  // H5 走 vite proxy，无需前缀
  // #endif
  return 'http://localhost:3000'
})()

export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const store = useUserStore()
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.header as Record<string, string> ?? {}),
    }
    if (store.token) header.Authorization = `Bearer ${store.token}`

    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header,
      success: (res) => {
        const data = res.data as any
        if (data?.success === false) {
          if (res.statusCode === 401) {
            store.clearToken()
            // 回到首页（提交页）
            uni.reLaunch({ url: '/pages/submit/index' })
          }
          reject(data.error)
        } else {
          resolve(data.data as T)
        }
      },
      fail: reject,
    })
  })
}
