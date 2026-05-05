# JT-Hub v1.1

作业/毕设需求对接与进度追踪系统。用户提交需求，管理员接单处理，全流程状态跟踪 + 积分激励体系。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + TypeScript + Pinia |
| 管理端 | Vue 3 + Element Plus + Vite |
| 后端 | Node.js + Fastify + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 部署 | PM2 + Nginx |

## 项目结构

```
jthub/
├── frontend/          # 用户端（PC + 移动端响应式）
├── admin/             # 管理后台
├── backend/           # API 服务
├── deploy/            # 部署配置
├── specs/             # 功能规格文档
└── ecosystem.config.js
```

## 功能模块

### 用户端

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | Hero 动画、功能介绍、历代作品轮播、价格表 |
| 提交需求 | `/submit` | 填写课程/类型/年级/截止日期，支持积分折扣 |
| 我的订单 | `/my-orders` | 需求订单列表，点击查看详情和状态流转 |
| 积分中心 | `/points` | 积分明细、兑换记录、我的优惠券 |
| 积分商城 | `/points/shop` | 用积分兑换服务套餐或折扣券 |
| 邀请好友 | `/invite` | 专属邀请码，双向积分奖励 |
| 论坛 | `/forum` | 多板块帖子，支持 Markdown，评论互动 |
| 活动公告 | `/activity` | 系统公告和优惠活动 |
| 个人中心 | `/profile` | 修改资料、改密码、邮箱验证 |
| 认证 | `/login` `/register` `/forgot-password` | 登录注册、忘记密码 |

### 管理后台

| 模块 | 路径 | 说明 |
|------|------|------|
| 监控大屏 | `/` | 实时统计：今日/本周/累计订单、状态分布、系统资源 |
| 订单管理 | `/orders` | 需求订单列表、状态变更、设置报价、添加备注 |
| 需求类型 | `/order-types` | 增删改查，管理需求分类和参考价格 |
| 活动公告 | `/activities` | 增删改查，支持优惠活动和系统公告 |
| 论坛管理 | `/posts` | 增删改查、审核、置顶 |
| 作品轮播 | `/carousel` | 增删改查，首页展示 |
| 用户反馈 | `/feedback` | 查看、回复、状态更新 |
| 积分规则 | `/points` | 配置积分事件和分值，手动调整用户积分 |
| 积分商城 | `/points/shop` | 增删改查，管理可兑换商品 |
| 兑换审核 | `/points/redeem` | 审核通过/拒绝兑换申请 |
| 用户管理 | `/users` | 搜索、启用/禁用 |

### 订单流程

```
用户提交需求 → 已创建(CREATED)
  → 管理员确认 → 待确认(PENDING)
    → 管理员接单 → 进行中(IN_PROGRESS)
      → 完成 → 已完成(COMPLETED) → 自动发放奖励积分
任意状态 → 已取消(CANCELLED)
```

### 积分体系

| 事件 | 积分 | 说明 |
|------|------|------|
| 邀请注册 | +50 | 被邀请人注册成功 |
| 邀请首购 | +100 | 被邀请人首笔订单完成（给邀请者） |
| 新用户首购 | +30 | 新用户自己首笔订单完成 |
| 管理员调整 | ±N | 后台手动调整 |
| 积分兑换 | -N | 兑换服务套餐或折扣券 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装

```bash
git clone https://github.com/CN-Jia/ai-jthub.git
cd ai-jthub
pnpm install
```

### 配置

```bash
cp backend/.env.example backend/.env
# 编辑 .env 填入数据库连接、JWT 密钥等
```

### 数据库

```bash
cd backend
pnpm prisma db push      # 同步 schema
pnpm prisma generate     # 生成 Client
pnpm prisma db seed      # 初始化数据（如有）
```

### 开发

```bash
# 启动后端
pnpm dev:backend

# 启动前端
pnpm --filter jthub-frontend dev

# 启动管理端
pnpm --filter admin dev
```

### 构建部署

```bash
pnpm --filter backend build
pnpm --filter jthub-frontend build
pnpm --filter admin build
pm2 start ecosystem.config.js
```

## API 概览

| 模块 | 前缀 | 说明 |
|------|------|------|
| 认证 | `/api/auth/*` | 登录、注册、邮箱验证、密码重置 |
| 需求订单 | `/api/orders/*` | 创建、查询我的订单、订单详情 |
| 积分 | `/api/points/*` | 邀请、余额、明细、兑换 |
| 论坛 | `/api/posts/*` | 帖子 CRUD、评论 |
| 管理 | `/api/admin/*` | 订单管理、用户管理、内容管理 |
| 积分管理 | `/api/admin/points/*` | 规则配置、用户积分、兑换审核 |

## 明暗主题

全站支持明暗模式切换：

- 用户端：导航栏右上角切换，支持跟随系统偏好
- 管理端：顶栏切换按钮，默认暗色主题

## 版本历史

### v1.1 (2026-05-05)

- **订单流程重构**：新增 CREATED/CANCELLED 状态，完整状态流转
- **积分系统**：邀请拉新、首购奖励、积分商城、兑换审核
- **提交需求页重写**：支持积分折扣、服务套餐选择
- **论坛改版**：多板块模式，帖子审核和置顶
- **管理端重构**：删除商品逻辑，聚焦需求订单管理
- **全站暗色模式**：所有页面适配明暗切换
- **管理端 CRUD 补齐**：删除、确认弹窗、错误处理统一

### v1.0 (2026-04)

- 基础框架搭建
- 用户注册登录
- 需求提交和订单管理
- 论坛和活动公告
- 管理后台

## License

Private - All rights reserved.
