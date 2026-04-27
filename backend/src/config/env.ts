import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // 微信登录（开发模式可不填，PC端用虚拟code直接登录）
  WECHAT_APP_ID: z.string().default(''),
  WECHAT_APP_SECRET: z.string().default(''),

  // Server酱推送（可选，未配置时跳过）
  SERVERCHAN_TOKEN: z.string().default(''),

  // 管理员账号
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(1),

  // 管理员微信号（展示给用户）
  ADMIN_WECHAT_ID: z.string().default('Jt--04'),

  APP_BASE_URL: z.string().default('http://localhost:3000'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid environment variables:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = result.data
