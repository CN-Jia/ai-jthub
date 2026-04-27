import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 默认需求类型
  const orderTypes = [
    { name: '期中内作业', description: '期中考试前的平时作业、小测验类', price: '100-300元', sortOrder: 1 },
    { name: '期末作业',   description: '期末考核作业、大作业、报告类',   price: '200-500元', sortOrder: 2 },
    { name: '毕业设计',   description: '毕业论文、毕业设计项目',          price: '500-2000元', sortOrder: 3 },
  ]

  for (const type of orderTypes) {
    await prisma.orderType.upsert({
      where: { name: type.name },
      create: type,
      update: { price: type.price, description: type.description, sortOrder: type.sortOrder },
    })
  }

  console.log('✅ OrderTypes seeded:', orderTypes.map(t => t.name).join(', '))

  // 示例活动公告
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  await prisma.activity.upsert({
    where: { id: 'seed-activity-1' },
    create: {
      id: 'seed-activity-1',
      title: '🎉 期末季特惠',
      content: '本月所有期末作业享9折优惠！数量有限，先到先得。提交需求时备注"期末季"即可享受折扣。',
      type: 'PROMO',
      startAt: now,
      endAt: endOfMonth,
      isActive: true,
    },
    update: {},
  })

  await prisma.activity.upsert({
    where: { id: 'seed-activity-2' },
    create: {
      id: 'seed-activity-2',
      title: '📢 接单公告',
      content: '目前正常接单，响应时间约1-2小时。提交需求后请添加微信 Jt--04，备注订单号，方便快速沟通。',
      type: 'NOTICE',
      startAt: now,
      endAt: null,
      isActive: true,
    },
    update: {},
  })

  console.log('✅ Activities seeded')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
