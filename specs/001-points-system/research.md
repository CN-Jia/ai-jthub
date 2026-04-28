# Research: 积分系统

**Branch**: `001-points-system` | **Date**: 2026-04-28

## 决策记录

### 1. 积分并发安全策略

- **Decision**: 使用 Prisma 事务（`prisma.$transaction`）+ 原子 `increment`/`decrement`，在同一事务内读取余额并写入，防止并发超扣。
- **Rationale**: PostgreSQL 事务 + `SELECT ... FOR UPDATE`（Prisma 的 `$queryRaw` 或 `updateMany` with `where: { points: { gte: amount } }`）可保证余额非负，无需引入 Redis 分布式锁。
- **Alternatives considered**: Redis 乐观锁（overkill，当前并发极低），应用层加锁（不适用多进程）。

### 2. 邀请码生成方案

- **Decision**: 注册时为每个用户自动生成 6 位大写字母+数字随机邀请码，存入 `User.inviteCode`（唯一索引）。前端展示为 `https://jthub.cc.cd/register?ref=XXXXXX`。
- **Rationale**: 短码易分享，唯一性由数据库唯一索引保证，冲突概率极低（36^6 ≈ 21 亿）。
- **Alternatives considered**: UUID 截取（过长，不适合手动分享），自增数字（容易被枚举）。

### 3. 积分规则存储

- **Decision**: 积分规则（各事件奖励值）存入 `PointRule` 表，`eventType` 字段为枚举键，管理员可通过后台修改数值，服务启动时不缓存（DB 实时查询）。
- **Rationale**: 规则变更不频繁，无需缓存；存 DB 可持久化、可审计。
- **Alternatives considered**: 硬编码配置文件（无法运行时修改），Redis 缓存（引入新依赖）。

### 4. 折扣券实现方式

- **Decision**: 兑换"折扣券"类商品时，系统生成一条 `Coupon` 记录，包含唯一优惠码（8位）、折扣金额、有效期（默认 90 天）、状态（unused/used/expired）。用户提交订单时携带优惠码，订单备注中体现折扣，后端验证并标记已用。
- **Rationale**: 与现有 Order 表解耦，不修改订单金额字段，管理员核单时可见优惠码信息。
- **Alternatives considered**: 直接修改订单价格（破坏现有结构），前端展示折扣（无法防止绕过）。

### 5. 兑换状态机

```
提交 → PENDING（积分冻结）
         ↓ 管理员通过     ↓ 管理员拒绝
      COMPLETED         REJECTED
    （正式扣积分）      （积分解冻）
```

- **Decision**: 冻结字段存于 `PointBalance.frozenPoints`，`COMPLETED` 时从 `frozenPoints` 移除并从 `totalPoints` 扣减；`REJECTED` 时仅将 `frozenPoints` 归零（归还可用）。
- **Rationale**: 冻结机制防止用户在兑换审核期间重复消费同一批积分。

### 6. 事件类型枚举（PointEventType）

| 枚举值 | 触发时机 | 默认积分 |
|--------|----------|----------|
| `INVITE_REGISTER` | 被邀请者注册成功 | +50 |
| `INVITE_FIRST_ORDER` | 被邀请者首笔订单完成 | +100 |
| `NEW_USER_FIRST_ORDER` | 新用户自己首笔订单完成（被邀请者） | +30 |
| `ADMIN_ADJUST` | 管理员手动调整 | 任意 |
| `REDEEM_FREEZE` | 兑换提交冻结 | -N（冻结） |
| `REDEEM_DEDUCT` | 兑换审核通过扣减 | -N（正式） |
| `REDEEM_UNFREEZE` | 兑换审核拒绝解冻 | +N（解冻） |
