# Data Model: JT-Hub 数据库设计 v2

**Branch**: `001-jthub-system` | **Updated**: 2026-04-23 v3（移除微信小程序端）

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户 ====================
model User {
  id        String   @id @default(cuid())
  openid    String   @unique          // 用户标识（PC端为 pc_${wechatId} 虚拟ID）
  nickname  String?                   // 昵称（可选）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders        Order[]
  notifications Notification[]

  @@map("users")
}

// ==================== 需求类型（管理员维护）====================
model OrderType {
  id          String   @id @default(cuid())
  name        String   @unique          // 如：期中内作业、期末作业、毕业设计
  description String?                   // 类型说明（可选）
  price       String                    // 参考价格，如 "200-500元"
  sortOrder   Int      @default(0)      // 排序权重，越小越靠前
  isActive    Boolean  @default(true)   // 是否在前端展示

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orders      Order[]

  @@map("order_types")
}

// ==================== 活动/公告（管理员维护）====================
model Activity {
  id        String       @id @default(cuid())
  title     String                        // 活动标题
  content   String       @db.Text         // 活动内容（富文本/纯文本）
  type      ActivityType                  // 类型：折扣活动 or 公告通知
  startAt   DateTime                      // 活动开始时间
  endAt     DateTime?                     // 活动结束时间（null = 永久）
  isActive  Boolean      @default(true)   // 是否启用

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([isActive, startAt])
  @@map("activities")
}

enum ActivityType {
  PROMO    // 折扣活动
  NOTICE   // 公告通知
}

// ==================== 订单 ====================
model Order {
  id             String      @id @default(cuid())
  orderNo        String      @unique          // 格式：JT-YYYYMMDD-XXXX
  courseName     String                       // 课程名称（用户填写）
  grade          Grade                        // 年级

  // 需求类型关联（管理员维护的类型）
  orderTypeId    String
  orderType      OrderType   @relation(fields: [orderTypeId], references: [id])

  deadline       DateTime                     // 作业截止时间
  contactWechat  String                       // 联系微信号

  status         OrderStatus @default(PENDING)
  source         OrderSource                  // 来源：MINIPROGRAM / PC

  // 用户关联（登录用户有 userId）
  userId         String?
  user           User?       @relation(fields: [userId], references: [id])

  // 管理员操作字段
  adminNote      String?     @db.Text         // 内部备注（不对用户展示）
  quotedPrice    String?                      // 管理员最终报价（覆盖类型参考价）

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  statusHistory  StatusHistory[]
  notifications  Notification[]

  @@index([status])
  @@index([createdAt])
  @@index([userId])
  @@index([contactWechat])
  @@map("orders")
}

enum Grade {
  FRESHMAN   // 大一
  SOPHOMORE  // 大二
  JUNIOR     // 大三
}

enum OrderStatus {
  PENDING      // 待确认
  ACCEPTED     // 已接单
  IN_PROGRESS  // 进行中
  COMPLETED    // 已完成
  CLOSED       // 已关闭（终态）
}

enum OrderSource {
  MINIPROGRAM  // 历史数据保留，新订单不再使用
  PC           // PC 网页端
}

// ==================== 状态变更历史 ====================
model StatusHistory {
  id         String      @id @default(cuid())
  orderId    String
  order      Order       @relation(fields: [orderId], references: [id])
  fromStatus OrderStatus?
  toStatus   OrderStatus
  operator   String                      // "admin" 或 "system"
  remark     String?                     // 变更备注
  createdAt  DateTime    @default(now())

  @@index([orderId])
  @@map("order_status_history")
}

// ==================== 通知日志 ====================
model Notification {
  id        String        @id @default(cuid())
  orderId   String
  order     Order         @relation(fields: [orderId], references: [id])
  userId    String?
  user      User?         @relation(fields: [userId], references: [id])

  channel   NotifyChannel  // 通知渠道
  type      NotifyType     // 通知类型
  status    NotifyStatus   // 发送状态
  error     String?        // 失败原因

  createdAt DateTime       @default(now())

  @@index([orderId])
  @@map("notifications")
}

enum NotifyChannel {
  SERVERCHAN   // Server酱（推给管理员）
  WECOM        // 企业微信 Webhook（备用）
}

enum NotifyType {
  NEW_ORDER      // 新订单（发给管理员）
  STATUS_CHANGE  // 状态变更（记录日志）
}

enum NotifyStatus {
  SUCCESS
  FAILED
  SKIPPED
}
```

---

## 实体关系图（ERD）

```
order_types ──┐
              │ 1:N
              ▼
users ───────► orders ────── order_status_history (1:N)
                  │
                  └────── notifications (1:N)

activities（独立，无外键关联）
```

---

## 变更说明（v1 → v3）

| 变更 | 说明 |
|---|---|
| **新增** `OrderType` 表 | 管理员动态维护需求类型和参考定价 |
| **新增** `Activity` 表 | 管理员发布活动公告 |
| **删除** `File` 表 | 移除文件上传功能，改用微信私发 |
| `title` → `courseName` | 语义更清晰（课程名称） |
| `type` (string) → `orderTypeId` (FK) | 改为关联需求类型表 |
| **新增** `grade` 字段 | 年级枚举（大一/大二/大三） |
| `contactEmail` → `contactWechat` | 改为联系微信号 |
| **删除** `estimatedPrice` | 用户无需估价，由管理员定价 |
| **删除** `description` | 课程名+类型已足够描述需求 |
| `source.MINIPROGRAM` 保留为历史兼容 | 移除小程序端，新订单均为 `PC` |
| `NotifyChannel` 删除 `EMAIL`, `WX_SUBSCRIBE` | 移除邮件和订阅消息通知 |
| **移除微信小程序** | 改为纯 PC 网页端，降低维护复杂度 |

---

## 状态机约束（后端强制校验）

```typescript
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:     ['ACCEPTED', 'CLOSED'],
  ACCEPTED:    ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['COMPLETED', 'CLOSED'],
  COMPLETED:   ['CLOSED'],
  CLOSED:      [],   // 终态，不可流转
}
```

---

## 年级枚举映射

```typescript
const GRADE_LABEL: Record<Grade, string> = {
  FRESHMAN:  '大一',
  SOPHOMORE: '大二',
  JUNIOR:    '大三',
}
```

---

## 索引策略

- `orders.status` — 管理后台按状态筛选
- `orders.createdAt` — 按时间排序
- `orders.userId` — 用户查询自己的订单
- `orders.contactWechat` — 管理员搜索
- `order_status_history.orderId` — 查询订单完整操作日志
- `activities.isActive + startAt` — 前端查询有效活动列表

---

## 数据库迁移要点

```bash
# 生成迁移文件
npx prisma migrate dev --name v2_refactor

# 需要手动处理的数据：
# 1. 插入默认 OrderType（期中内作业/期末作业/毕业设计）
# 2. 原 orders.type 字符串无法自动迁移到 orderTypeId FK
#    → 开发环境可直接清空重建，生产环境需数据迁移脚本
```

---

## 初始种子数据

```typescript
// prisma/seed.ts
const defaultOrderTypes = [
  { name: '期中内作业', description: '期中考试前的平时作业', price: '100-300元', sortOrder: 1 },
  { name: '期末作业',   description: '期末考核作业、大作业', price: '200-500元', sortOrder: 2 },
  { name: '毕业设计',   description: '毕业论文、毕业设计项目', price: '500-2000元', sortOrder: 3 },
]
```
