import axios from 'axios'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'

/** 小程序静默登录 —— code 换取 openid，查找或创建 User */
export async function mpLogin(code: string): Promise<{ userId: string; openid: string }> {
  let openid: string

  // 开发模式：AppSecret 未配置时跳过微信 API，直接用 code 作为虚拟 openid
  const isDevMode = env.NODE_ENV === 'development' &&
    (!env.WECHAT_APP_SECRET || env.WECHAT_APP_SECRET === 'your_app_secret_here')

  if (isDevMode) {
    openid = `dev_${code.slice(0, 20)}`
  } else {
    const resp = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WECHAT_APP_ID}&secret=${env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    )
    if (resp.data.errcode) {
      throw new Error(`微信登录失败: ${resp.data.errmsg}`)
    }
    openid = (resp.data as { openid: string }).openid
  }

  const user = await prisma.user.upsert({
    where: { openid },
    create: { openid },
    update: {},
  })
  return { userId: user.id, openid }
}
