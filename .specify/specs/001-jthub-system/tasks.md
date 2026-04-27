# Task List: JT-Hub v2 开发任务

**Updated**: 2026-04-23 v3（移除微信小程序端） | **Total**: 46 tasks  
**Estimated**: ~8 工作日

---

## Phase 1 — 后端数据库重构（~1.5天）

### 1.1 Schema 更新
- [x] **T01** 更新 `prisma/schema.prisma`：新增 `OrderType` 模型（id/name/description/price/sortOrder/isActive）
- [x] **T02** 更新 `prisma/schema.prisma`：新增 `Activity` 模型（id/title/content/type/startAt/endAt/isActive）
- [x] **T03** 更新 `prisma/schema.prisma`：重构 `Order` 模型（courseName/orderTypeId/grade/contactWechat，删除旧字段）
- [x] **T04** 更新 `prisma/schema.prisma`：更新 `Notification`（删除 EMAIL/WX_SUBSCRIBE 渠道）
- [ ] **T05** 更新 `prisma/schema.prisma`：删除 `File` 模型

### 1.2 迁移与种子
- [x] **T06** 运行 `prisma migrate dev --name v2_refactor` 生成迁移文件
- [x] **T07** 编写 `prisma/seed.ts`：插入3种默认 OrderType（期中内作业/期末作业/毕业设计）
- [x] **T08** 验证迁移成功，`prisma studio` 查看表结构

---

## Phase 2 — 后端 API 重构（~2.5天）

### 2.1 公开接口
- [x] **T09** 新建 `src/routes/order-types.ts`：`GET /order-types`（返回 isActive=true 的类型列表）
- [x] **T10** 新建 `src/routes/activities.ts`：`GET /activities`（返回活动列表，含 isExpired/daysLeft）
- [x] **T11** 集成 `src/services/order-type.service.ts`：getActiveOrderTypes()
- [x] **T12** 集成活动查询逻辑：getActiveActivities()

### 2.2 订单接口重构
- [x] **T13** 重写 `src/routes/orders.ts`：`POST /orders` 新字段（courseName/orderTypeId/grade/contactWechat）
- [x] **T14** 更新 `src/services/order.service.ts`：createOrder 支持新字段，校验 orderTypeId 有效且 isActive，截止日期必须未来
- [x] **T15** 更新 `src/routes/orders.ts`：`GET /orders/my` 返回新字段，关联 orderType 信息，支持 status 筛选
- [x] **T16** 更新 `src/routes/orders.ts`：`GET /orders/:id` 返回新字段 + statusHistory

### 2.3 管理员接口
- [x] **T17** 新建 `src/routes/admin/orders.ts`：`GET /admin/orders`（支持 status/keyword 筛选，含 stats 汇总）
- [x] **T18** 新建 `src/routes/admin/orders.ts`：`PATCH /admin/orders/:id/status`（状态流转校验）
- [x] **T19** 新建 `src/routes/admin/stats.ts`：`GET /admin/stats`（今日/本周/总量/各状态分布/recentOrders）
- [x] **T20** 新建 `src/routes/admin/order-types.ts`：CRUD（GET/POST/PUT/:id/DELETE/:id）
- [x] **T21** 新建 `src/routes/admin/activities.ts`：CRUD（GET/POST/PUT/:id/DELETE/:id）

### 2.4 通知服务
- [x] **T22** 更新 `src/services/notify.service.ts`：保留 Server酱，移除邮件/订阅消息
- [x] **T23** 更新 Server酱推送内容模板（新字段：courseName/grade/contactWechat）
- [x] **T24** 在 `POST /orders` 成功后异步触发 Server酱 推送

### 2.5 清理
- [ ] **T25** 更新 `src/config/env.ts`：移除 OSS/Resend/短链接环境变量
- [ ] **T26** 更新 `backend/.env.example`：同步环境变量变更

---

## Phase 3 — 管理后台重建（~2.5天）

- [x] **T27** 重建 `dashboard/index.vue`：今日/本周统计卡 + 各状态分布 + 最近5条订单表格
- [x] **T28** 重建 `orders/index.vue`：状态汇总条（可点击快速筛选）+ Table + 关键词搜索 + 分页
- [x] **T29** 重建 `order-detail/index.vue`：详情展示 + 状态下拉修改 + 报价输入 + 备注输入 + 保存
- [x] **T30** 新建 `order-types/index.vue`：表格 + 新增表单弹窗 + 编辑 + 停用/启用 + 删除
- [x] **T31** 新建 `activities/index.vue`：表格 + 新增/编辑弹窗 + 删除
- [x] **T32** 更新 `admin/src/router/index.ts`：完整路由配置

---

## Phase 4 — PC 网页端新建（~2天）

- [x] **T33** 初始化 `frontend/` Vue 3 + Vite 项目，配置 Pinia + Vue Router + axios
- [x] **T34** 新建 `pages/home/index.vue`：活动 + 价格表（点击预选跳转）+ 提交入口，60s轮询
- [x] **T35** 新建 `pages/activity/index.vue`：活动公告列表（已结束标签/剩余天数），60s轮询
- [x] **T36** 新建 `pages/submit/index.vue`：提交需求表单，支持 typeId 预选参数
- [x] **T37** 新建 `pages/result/index.vue`：提交成功（引导添加微信）
- [x] **T38** 新建 `pages/my-orders/index.vue`：我的订单列表（PC 虚拟登录）
- [x] **T39** 新建 `pages/order-detail/index.vue`：订单详情 + statusHistory 时间线
- [x] **T40** 配置 `vite.config.ts`：代理 /api → backend:3000

---

## Phase 5 — 部署（~0.5天）

- [ ] **T41** 更新 Nginx 配置：`/api` → backend，`/admin` → admin dist，`/` → frontend dist
- [ ] **T42** 更新生产环境 `.env`，运行 `prisma migrate deploy`，PM2 重启后端

---

## 状态徽标颜色规范

| 状态 | 文字 | 颜色 |
|---|---|---|
| PENDING | 待确认 | `#fa8c16`（橙） |
| ACCEPTED | 已接单 | `#1677ff`（蓝） |
| IN_PROGRESS | 进行中 | `#722ed1`（紫） |
| COMPLETED | 已完成 | `#52c41a`（绿） |
| CLOSED | 已关闭 | `#8c8c8c`（灰） |

---

## 需要保留的现有文件

| 文件 | 状态 |
|---|---|
| `backend/src/middlewares/auth.middleware.ts` | ✅ 保留 |
| `backend/src/middlewares/ratelimit.middleware.ts` | ✅ 保留 |
| `backend/src/utils/response.ts` | ✅ 保留 |
| `backend/src/utils/order-id.ts` | ✅ 保留 |
| `backend/src/services/wechat.service.ts` | ✅ 保留（开发模式兜底，PC端复用） |
| `backend/src/services/auth.service.ts` | ✅ 保留 |
| `backend/src/routes/auth.ts` | ✅ 保留 |

---

## 已删除的文件

| 文件 | 原因 |
|---|---|
| `backend/src/routes/files.ts` | 移除文件上传 |
| `backend/src/services/oss.service.ts` | 移除 OSS |
| `backend/src/services/shortlink.service.ts` | 移除短链接 |
| `weixinxcx/` | 移除微信小程序，改为纯 PC 网页端 |
