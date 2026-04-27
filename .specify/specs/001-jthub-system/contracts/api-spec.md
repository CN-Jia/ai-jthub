# API Contract: JT-Hub RESTful API v2

**Version**: v2.1 | **Updated**: 2026-04-23（移除小程序登录描述，改为PC端虚拟登录）  
**Base URL**: `https://yourdomain.com/api`  
**Auth**: Bearer JWT（Header: `Authorization: Bearer <token>`）

---

## 通用规范

### 统一响应格式

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "error": { "code": "ORDER_NOT_FOUND", "message": "订单不存在" } }
```

### 错误码清单

| Code | HTTP | 说明 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 未登录或 Token 无效 |
| `FORBIDDEN` | 403 | 无权限（非管理员） |
| `ORDER_NOT_FOUND` | 404 | 订单不存在 |
| `INVALID_STATUS_TRANSITION` | 422 | 状态流转不合法 |
| `VALIDATION_ERROR` | 400 | 请求参数校验失败 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 认证接口（Auth）

### POST `/auth/mp-login` — 用户登录

PC 端登录：传入 `pc_${wechatId}` 作为 code，后端生成对应用户并返回 JWT。

```json
// Request（PC 端）
{ "code": "pc_Jt--04_user" }

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "userId": "clxxx..."
  }
}
```

> 开发模式：直接用 code 作为虚拟 openid，创建或复用对应用户

### POST `/auth/admin-login` — 管理员登录

```json
// Request
{ "username": "admin", "password": "your_password" }

// Response 200
{ "success": true, "data": { "token": "eyJhbGci..." } }
```

---

## 公开接口（无需登录）

### GET `/order-types` — 获取需求类型列表

用于前端表单下拉框和首页价格表展示。

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "期末作业",
      "description": "期末考核作业、大作业",
      "price": "200-500元",
      "sortOrder": 2
    }
  ]
}
```

> 只返回 `isActive = true` 的类型，按 `sortOrder` 升序

---

### GET `/activities` — 获取活动/公告列表

用于前端首页和活动 Tab 展示。

```json
// Query: ?type=PROMO&limit=10

// Response 200
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "clxxx...",
        "title": "期末季全场9折",
        "content": "2026年6月1日-30日，所有期末作业享9折优惠",
        "type": "PROMO",
        "startAt": "2026-06-01T00:00:00Z",
        "endAt": "2026-06-30T23:59:59Z",
        "isExpired": false,
        "daysLeft": 42
      }
    ],
    "total": 5
  }
}
```

---

## 订单接口（Orders）

### POST `/orders` — 创建订单（需登录）

```json
// Request
{
  "courseName": "高等数学",
  "orderTypeId": "clxxx...",
  "grade": "JUNIOR",          // FRESHMAN | SOPHOMORE | JUNIOR
  "deadline": "2026-06-30T00:00:00Z",
  "contactWechat": "wxid_xxxxx",
  "source": "MINIPROGRAM"     // MINIPROGRAM | PC
}

// Response 200（正常创建）
{
  "success": true,
  "data": {
    "orderId": "clxxx...",
    "orderNo": "JT-20260419-A3F2",
    "status": "PENDING",
    "createdAt": "2026-04-19T10:00:00Z",
    "adminWechatId": "Jt--04"   // 固定值，引导用户添加
  }
}
```

**字段校验**:
- `courseName`: 必填，2-100字
- `orderTypeId`: 必填，必须是有效的活跃类型 ID
- `grade`: 必填，枚举值之一
- `deadline`: 必填，ISO 8601 格式，必须是未来时间
- `contactWechat`: 必填，2-50字
- `source`: 必填

---

### GET `/orders/my` — 我的订单列表（需登录）

```json
// Query: ?page=1&pageSize=20&status=PENDING

// Response 200
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "clxxx...",
        "orderNo": "JT-20260419-A3F2",
        "courseName": "高等数学",
        "orderType": { "name": "期末作业" },
        "grade": "JUNIOR",
        "status": "PENDING",
        "deadline": "2026-06-30T00:00:00Z",
        "createdAt": "2026-04-19T10:00:00Z",
        "quotedPrice": null
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### GET `/orders/:id` — 订单详情（需登录，仅本人）

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "orderNo": "JT-20260419-A3F2",
    "courseName": "高等数学",
    "orderType": { "id": "...", "name": "期末作业", "price": "200-500元" },
    "grade": "JUNIOR",
    "deadline": "2026-06-30T00:00:00Z",
    "contactWechat": "wxid_xxxxx",
    "status": "ACCEPTED",
    "quotedPrice": "350元",
    "createdAt": "2026-04-19T10:00:00Z",
    "statusHistory": [
      { "fromStatus": null, "toStatus": "PENDING", "createdAt": "..." },
      { "fromStatus": "PENDING", "toStatus": "ACCEPTED", "createdAt": "..." }
    ]
  }
}
```

---

## 管理员接口（Admin，全部需要管理员 JWT）

### GET `/admin/orders` — 订单列表

```json
// Query: ?page=1&pageSize=20&status=PENDING&keyword=高等数学

// Response 200
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "clxxx...",
        "orderNo": "JT-20260419-A3F2",
        "courseName": "高等数学",
        "orderType": { "name": "期末作业" },
        "grade": "JUNIOR",
        "contactWechat": "wxid_xxxxx",
        "status": "PENDING",
        "deadline": "2026-06-30T00:00:00Z",
        "createdAt": "2026-04-19T10:00:00Z"
      }
    ],
    "total": 42,
    "stats": {
      "PENDING": 5,
      "ACCEPTED": 8,
      "IN_PROGRESS": 12,
      "COMPLETED": 15,
      "CLOSED": 2
    }
  }
}
```

---

### GET `/admin/orders/:id` — 订单详情（管理员视角）

同用户详情，额外返回 `adminNote` 字段。

---

### PATCH `/admin/orders/:id/status` — 更新订单状态

```json
// Request
{
  "status": "ACCEPTED",
  "adminNote": "已确认，预计3天完成",
  "quotedPrice": "350元"
}

// Response 200
{
  "success": true,
  "data": { "orderId": "...", "newStatus": "ACCEPTED" }
}

// Response 422（非法流转）
{
  "success": false,
  "error": { "code": "INVALID_STATUS_TRANSITION", "message": "不允许从 COMPLETED 流转到 PENDING" }
}
```

> 状态变更后异步触发 Server酱 推送给管理员（记录状态变更通知）

---

### GET `/admin/stats` — 数据统计

```json
// Response 200
{
  "success": true,
  "data": {
    "today": { "new": 5, "completed": 2 },
    "thisWeek": { "new": 23, "completed": 11 },
    "total": { "new": 156, "completed": 89 },
    "byStatus": {
      "PENDING": 5, "ACCEPTED": 8, "IN_PROGRESS": 12,
      "COMPLETED": 89, "CLOSED": 42
    },
    "recentOrders": [ ... ]   // 最近5条
  }
}
```

---

### 需求类型管理（CRUD）

#### GET `/admin/order-types` — 列表（含停用）

```json
// Response 200
{
  "success": true,
  "data": [
    { "id": "...", "name": "期末作业", "description": "...", "price": "200-500元", "sortOrder": 2, "isActive": true, "orderCount": 42 }
  ]
}
```

#### POST `/admin/order-types` — 新增

```json
// Request
{ "name": "课程设计", "description": "...", "price": "150-400元", "sortOrder": 4 }
```

#### PUT `/admin/order-types/:id` — 修改（全量替换）

```json
// Request（字段均可选）
{ "name": "...", "price": "...", "isActive": false, "sortOrder": 1 }
```

#### DELETE `/admin/order-types/:id` — 删除

> 只允许删除无关联订单的类型，否则返回 400

---

### 活动管理（CRUD）

#### GET `/admin/activities` — 列表

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "...", "title": "期末季9折", "type": "PROMO",
      "startAt": "...", "endAt": "...", "isActive": true
    }
  ]
}
```

#### POST `/admin/activities` — 新增

```json
// Request
{
  "title": "期末季全场9折",
  "content": "2026年6月所有期末作业享9折...",
  "type": "PROMO",            // PROMO | NOTICE
  "startAt": "2026-06-01T00:00:00Z",
  "endAt": "2026-06-30T23:59:59Z"
}
```

#### PUT `/admin/activities/:id` — 修改（全量替换）

#### DELETE `/admin/activities/:id` — 删除

---

## Server酱推送规范

### 新订单通知（`POST /admin/orders` 成功后触发）

```
标题: 📋 JT-Hub 新订单 #JT-20260419-A3F2
内容:
课程：高等数学
类型：期末作业
年级：大三
联系微信：wxid_xxxxx
截止：2026-06-30
提交时间：2026-04-19 18:00
```

**发送方式**: `POST https://sctapi.ftqq.com/{SERVERCHAN_TOKEN}.send`

---

## 接口变更汇总（v1 → v2）

| 接口 | 变更 |
|---|---|
| `POST /orders` | 字段全部重写（见上） |
| `GET /orders/my` | 无变化（内部字段更新） |
| `POST /orders/query` | **删除**（改为登录查询） |
| `POST /files` | **删除**（移除文件上传） |
| `GET /s/:hash` | **删除**（移除短链接） |
| `GET /order-types` | **新增** |
| `GET /activities` | **新增** |
| `PATCH /admin/orders/:id/status` | 更新（去掉邮件通知触发） |
| `GET /admin/stats` | **新增** |
| `CRUD /admin/order-types` | **新增** |
| `CRUD /admin/activities` | **新增** |
