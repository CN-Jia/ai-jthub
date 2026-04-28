# API 契约：用户端积分接口

**Base**: `/api`  
**Auth**: Bearer JWT（除商城列表外均需登录）

---

## 邀请

### GET /points/invite
获取我的邀请码和邀请统计

**Response 200**
```json
{
  "inviteCode": "A1B2C3",
  "inviteUrl": "https://jthub.cc.cd/register?ref=A1B2C3",
  "totalInvited": 5,
  "pendingFirst": 2,
  "completedFirst": 3
}
```

### GET /points/invitees
获取我邀请的用户列表

**Response 200**
```json
{
  "list": [
    {
      "nickname": "张三",
      "registeredAt": "2026-04-01T00:00:00Z",
      "firstOrderAt": "2026-04-05T00:00:00Z"  // null 表示未首购
    }
  ]
}
```

---

## 积分账户

### GET /points/balance
获取积分余额

**Response 200**
```json
{
  "totalPoints": 320,
  "frozenPoints": 100,
  "availablePoints": 220,
  "lifetimeEarned": 500
}
```

### GET /points/logs
获取积分明细（分页）

**Query**: `page=1&pageSize=20`

**Response 200**
```json
{
  "total": 42,
  "list": [
    {
      "id": "xxx",
      "eventType": "INVITE_REGISTER",
      "delta": 50,
      "balance": 320,
      "remark": "邀请用户「张三」注册",
      "createdAt": "2026-04-28T12:00:00Z"
    }
  ]
}
```

---

## 积分商城

### GET /shop/items
获取商城商品列表（无需登录）

**Query**: `type=SERVICE|COUPON`（可选）

**Response 200**
```json
{
  "list": [
    {
      "id": "xxx",
      "name": "基础作业兑换券",
      "description": "可兑换一次基础难度作业",
      "coverUrl": "https://...",
      "type": "SERVICE",
      "pointsCost": 500,
      "stock": -1,
      "discountAmt": null
    },
    {
      "id": "yyy",
      "name": "50元优惠券",
      "type": "COUPON",
      "pointsCost": 300,
      "discountAmt": "50.00"
    }
  ]
}
```

### POST /shop/redeem
提交兑换申请

**Body**
```json
{ "shopItemId": "xxx" }
```

**Response 201**
```json
{
  "redeemOrderId": "zzz",
  "status": "PENDING",
  "frozenPoints": 500,
  "message": "兑换申请已提交，积分已冻结，等待管理员审核"
}
```

**Error 400**: 积分不足  
**Error 400**: 库存不足  
**Error 409**: 同一商品已有待审核订单

### GET /shop/redeem/my
我的兑换记录

**Response 200**
```json
{
  "list": [
    {
      "id": "zzz",
      "shopItem": { "name": "基础作业兑换券", "type": "SERVICE" },
      "pointsCost": 500,
      "status": "COMPLETED",
      "adminNote": null,
      "coupon": { "code": "JT8X9Y2Z", "discountAmt": null },
      "createdAt": "2026-04-28T12:00:00Z"
    }
  ]
}
```

---

## 优惠券

### GET /coupons/my
我的可用优惠券

**Response 200**
```json
{
  "list": [
    {
      "id": "ccc",
      "code": "JT8X9Y2Z",
      "discountAmt": "50.00",
      "status": "UNUSED",
      "expiresAt": "2026-07-28T00:00:00Z"
    }
  ]
}
```
