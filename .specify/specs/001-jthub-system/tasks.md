# Task List: JT-Hub v4 开发任务

**Updated**: 2026-04-28 v4（全面 H5 改版 + 注册登录 + 论坛 + 轮播） | **Total**: ~70 tasks

---

## Phase 1 — 后端数据库扩展

- [ ] **T01** 更新 `prisma/schema.prisma`：重构 `User` 模型（新增 username/passwordHash/nickname/phone/wechatId/grade/emailVerified/loginAttempts/lockUntil）
- [ ] **T02** 新增 `EmailVerification` 模型（邮箱验证码）
- [ ] **T03** 新增 `Post` 模型（论坛帖子，含 type/status 字段，支持管理员公告+用户讨论）
- [ ] **T04** 新增 `Comment` 模型（评论，关联 Post + User，含 isHidden）
- [ ] **T04b** 新增 `Feedback` 模型（用户反馈，含 type/status/adminReply）
- [ ] **T05** 新增 `Carousel` 模型（历代作品轮播）
- [ ] **T06** 运行 `prisma migrate dev --name v4_full_rewrite` 生成迁移
- [ ] **T07** 更新 `prisma/seed.ts`，保留默认 OrderType，清理旧 User 数据

---

## Phase 2 — 后端认证 API 重写

- [ ] **T08** 新建 `src/routes/auth.ts`：`POST /auth/register`（注册，参数校验）
- [ ] **T09** 新建 `src/routes/auth.ts`：`POST /auth/send-code`（发送邮箱验证码，60s 冷却）
- [ ] **T10** 新建 `src/routes/auth.ts`：`POST /auth/verify-email`（验证码验证，完成注册）
- [ ] **T11** 新建 `src/routes/auth.ts`：`POST /auth/login`（邮箱或用户名 + 密码，失败计数锁定）
- [ ] **T12** 新建 `src/routes/auth.ts`：`GET /auth/me`（获取当前用户信息）
- [ ] **T13** 新建 `src/routes/auth.ts`：`PUT /auth/profile`（更新个人资料）
- [ ] **T14** 新建 `src/routes/auth.ts`：`PUT /auth/password`（修改密码）
- [ ] **T15** 新建 `src/services/email.service.ts`：Resend 发送验证码邮件
- [ ] **T16** 更新 `src/config/env.ts`：新增 `RESEND_API_KEY` / `MAIL_FROM` 环境变量
- [ ] **T17** 更新 `src/middlewares/auth.middleware.ts`：适配新 User 模型

---

## Phase 3 — 后端论坛 & 轮播 API

- [ ] **T18** 新建 `src/routes/posts.ts`：`GET /posts`（列表，分页），`GET /posts/:id`（详情+评论）
- [ ] **T19** 新建 `src/routes/posts.ts`：`POST /posts/:id/comments`（发表评论，需登录）
- [ ] **T20** 新建 `src/routes/admin/posts.ts`：CRUD 文章（GET/POST/PUT/:id/DELETE/:id）
- [ ] **T21** 新建 `src/routes/admin/posts.ts`：`DELETE /admin/comments/:id`（删除/隐藏评论）
- [ ] **T22** 新建 `src/routes/carousel.ts`：`GET /carousel`（获取启用的轮播列表）
- [ ] **T23** 新建 `src/routes/admin/carousel.ts`：CRUD 轮播条目
- [ ] **T24** 新建 `src/routes/admin/users.ts`：`GET /admin/users`（用户列表），`PATCH /admin/users/:id`（禁用/启用）
- [ ] **T24b** 新建 `src/routes/feedback.ts`：`POST /feedback`（提交反馈），`GET /feedback/my`（我的反馈列表），`GET /feedback/:id`（详情）
- [ ] **T24c** 新建 `src/routes/admin/feedback.ts`：`GET /admin/feedback`（全部反馈列表），`POST /admin/feedback/:id/reply`（回复），`PATCH /admin/feedback/:id/status`（改状态）
- [ ] **T24d** 更新论坛路由：`GET /posts`（含状态过滤，用户只看 APPROVED，管理员看全部），`POST /posts`（用户发帖，status=PENDING），`PATCH /admin/posts/:id/status`（审核通过/拒绝）

---

## Phase 4 — 管理后台 UI 深色改版

> 目标风格：深色侧边栏 + 卡片数据面板，仿雨云 dashboard

- [ ] **T25** 全局改版：`admin/src/style` 建立深色主题 CSS 变量（`--bg-base:#0f1117` 等）
- [ ] **T26** 重建布局：左侧固定导航栏（220px）+ 右侧内容区
- [ ] **T27** 重建 `dashboard/index.vue`：数据统计卡片（今日/本周/总量）+ 最近5条订单
- [ ] **T28** `orders/index.vue`：适配深色表格样式，状态汇总条
- [ ] **T29** `order-detail/index.vue`：深色详情页
- [ ] **T30** `order-types/index.vue`：深色 CRUD 页
- [ ] **T31** `activities/index.vue`：深色 CRUD 页
- [ ] **T32** 新建 `forum/index.vue`：文章列表（标题/摘要/评论数）+ 新建/编辑/删除
- [ ] **T33** 新建 `forum/edit.vue`：文章编辑（Markdown 编辑器）
- [ ] **T34** 新建 `carousel/index.vue`：轮播管理（图片URL/课程名/好评语/排序）
- [ ] **T35** 新建 `users/index.vue`：用户列表 + 禁用操作
- [ ] **T35b** 新建 `feedback/index.vue`：反馈列表（类型/标题/用户/状态）+ 回复弹窗 + 状态更新
- [ ] **T35c** 更新 `forum/index.vue`：新增「待审核」tab，审核通过/拒绝操作
- [ ] **T36** 更新 `admin/src/router/index.ts`：新增 forum/carousel/users/feedback 路由

---

## Phase 5 — 用户端全面重写（H5 响应式 + 浅色风格）

### 5.1 全局基础
- [ ] **T37** 重建全局 CSS 变量系统（`frontend/src/style.css`），响应式断点 768/1024/1280
- [ ] **T38** 重建 `App.vue`：响应式顶部导航（桌面展开菜单 + 手机汉堡菜单），用户头像/昵称展示
- [ ] **T39** 更新 `api/index.ts`：新增注册/登录/发验证码/论坛/轮播接口

### 5.2 认证页面
- [ ] **T40** 新建 `pages/login/index.vue`：邮箱/用户名 + 密码登录页，响应式卡片布局
- [ ] **T41** 新建 `pages/register/index.vue`：注册表单（7字段）+ 邮箱验证码发送/输入流程
- [ ] **T42** 更新 `store/user.ts`：存储 username/nickname/email/grade/wechatId

### 5.3 首页改版
- [ ] **T43** 重建 `pages/home/index.vue`：顶部 Hero 区 + 历代作品轮播 + 活动公告 + 价格表
- [ ] **T44** 新建 `components/Carousel.vue`：卡片式轮播组件，自动3秒切换，支持触摸滑动
- [ ] **T45** 新建 `components/NavBar.vue`：响应式顶部导航组件（含汉堡菜单）

### 5.4 论坛
- [ ] **T46** 新建 `pages/forum/index.vue`：帖子列表（公告/讨论 tab 切换，封面/标题/摘要/评论数/时间）
- [ ] **T47** 新建 `pages/forum/detail.vue`：帖子详情（Markdown 渲染）+ 评论区
- [ ] **T47b** 新建 `pages/forum/new.vue`：用户发帖页（标题+正文+封面URL，提交后提示等待审核）
- [ ] **T48** 新建 `components/CommentBox.vue`：评论输入框 + 评论列表组件
- [ ] **T48b** 新建 `pages/feedback/index.vue`：提交反馈表单（类型下拉/标题/描述）+ 我的历史反馈列表 + 管理员回复展示

### 5.5 其他页面适配
- [ ] **T49** 重建 `pages/activity/index.vue`：响应式活动列表
- [ ] **T50** 重建 `pages/submit/index.vue`：响应式表单，微信号/年级从用户资料自动带入
- [ ] **T51** 重建 `pages/result/index.vue`：响应式成功页
- [ ] **T52** 重建 `pages/my-orders/index.vue`：响应式订单列表
- [ ] **T53** 重建 `pages/order-detail/index.vue`：响应式详情 + 时间线
- [ ] **T54** 新建 `pages/profile/index.vue`：个人资料编辑页

### 5.6 路由更新
- [ ] **T55** 更新 `router/index.ts`：新增 /login /register /forum /forum/:id /forum/new /feedback /profile 路由，未登录重定向

---

## Phase 6 — 部署更新

- [ ] **T56** 更新 `backend/.env.example`：新增 `RESEND_API_KEY` / `MAIL_FROM`
- [ ] **T57** 服务器：`pnpm prisma migrate deploy`（或 db push）应用新 schema
- [ ] **T58** 服务器：重新 build 三端，PM2 重启，Nginx 验证

---

## 状态徽标颜色

| 状态 | 颜色 |
|---|---|
| PENDING 待确认 | `#fa8c16` 橙 |
| ACCEPTED 已接单 | `#1677ff` 蓝 |
| IN_PROGRESS 进行中 | `#722ed1` 紫 |
| COMPLETED 已完成 | `#52c41a` 绿 |
| CLOSED 已关闭 | `#8c8c8c` 灰 |
