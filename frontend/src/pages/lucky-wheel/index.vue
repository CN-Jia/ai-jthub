<template>
  <div class="wheel-page">
    <!-- 背景粒子 -->
    <div class="cyber-bg">
      <div class="grid-lines"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
    </div>

    <div class="wheel-container">
      <!-- 顶部信息 -->
      <div class="wheel-header">
        <button class="back-btn" @click="$router.back()">← 返回</button>
        <div class="spin-count">
          <span class="count-label">剩余次数</span>
          <span class="count-num">{{ remainingSpins }}</span>
        </div>
      </div>

      <!-- 标题 -->
      <h1 class="wheel-title">
        <span class="title-glow">幸</span>运转盘
      </h1>
      <p class="wheel-subtitle">邀请好友越多，机会越多！</p>

      <!-- 转盘区域 -->
      <div class="wheel-wrapper">
        <!-- 外圈光效 -->
        <div class="wheel-ring"></div>

        <!-- 转盘 -->
        <div class="wheel" ref="wheelRef" :class="{ spinning: isSpinning }">
          <div
            v-for="(prize, i) in prizes"
            :key="prize.id"
            class="wheel-segment"
            :style="getSegmentStyle(i)"
          >
            <div class="segment-content" :style="getContentStyle(i)">
              <span class="segment-icon">{{ prize.icon }}</span>
              <span class="segment-label">{{ prize.label.replace(/^[^\s]+\s/, '') }}</span>
            </div>
          </div>
        </div>

        <!-- 指针 -->
        <div class="wheel-pointer">
          <div class="pointer-arrow"></div>
        </div>

        <!-- 中心按钮 -->
        <button
          class="spin-btn"
          @click="spin"
          :disabled="isSpinning || remainingSpins <= 0"
        >
          <span class="spin-btn-text">{{ isSpinning ? '...' : '抽奖' }}</span>
          <span class="spin-btn-glow"></span>
        </button>
      </div>

      <!-- 提示文字 -->
      <p class="spin-hint" v-if="remainingSpins <= 0">抽奖次数已用完，邀请好友可获得更多机会</p>
      <p class="spin-hint" v-else-if="remainingSpins < 3">邀请好友可获得更多抽奖机会（最多3次）</p>

      <!-- 中奖弹窗 -->
      <Transition name="modal">
        <div v-if="showResult" class="result-modal" @click.self="showResult = false">
          <div class="result-card" :class="{ 'won': resultWon }">
            <button class="modal-close" @click="showResult = false">✕</button>

            <template v-if="resultWon">
              <div class="result-icon">{{ resultPrize?.icon }}</div>
              <h2 class="result-title">🎉 恭喜中奖！</h2>
              <p class="result-prize">{{ resultPrize?.label }}</p>

              <!-- 兑换码（现金类） -->
              <div v-if="redeemCode" class="redeem-code-box">
                <span class="redeem-label">您的兑换码</span>
                <span class="redeem-code">{{ redeemCode }}</span>
                <button class="copy-btn" @click="copyCode">复制</button>
                <p class="redeem-hint">请联系管理员凭此码兑换现金</p>
              </div>

              <!-- 折扣券提示 -->
              <p v-else class="result-hint">折扣券已发放到您的账户，下单时自动生效</p>
            </template>

            <template v-else>
              <div class="result-icon">😢</div>
              <h2 class="result-title">谢谢惠顾</h2>
              <p class="result-hint">下次一定中！</p>
            </template>

            <div class="result-actions">
              <button class="result-btn primary" @click="showResult = false">
                {{ remainingSpins > 0 ? '再试一次' : '好的，知道了' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 中奖记录 -->
      <div class="history-section" v-if="history.length > 0">
        <h3 class="section-title">
          <span class="title-line"></span>
          <span>中奖记录</span>
          <span class="title-line"></span>
        </h3>
        <div class="history-list">
          <div v-for="h in history" :key="h.createdAt" class="history-item" :class="{ 'is-won': h.won }">
            <span class="history-icon">{{ h.won ? '🎁' : '🎯' }}</span>
            <span class="history-label">{{ h.prizeLabel }}</span>
            <span v-if="h.redeemCode" class="history-code">{{ h.redeemCode }}</span>
            <span v-if="h.isRedeemed" class="history-redeemed">已兑换</span>
          </div>
        </div>
      </div>

      <!-- 活动规则 -->
      <div class="rules-section">
        <h3 class="section-title">
          <span class="title-line"></span>
          <span>活动规则</span>
          <span class="title-line"></span>
        </h3>
        <div class="rules-list">
          <div class="rule-item">📌 新用户注册即送 <strong>1次</strong> 抽奖机会</div>
          <div class="rule-item">👥 每成功邀请 <strong>1位</strong> 好友 +1次</div>
          <div class="rule-item">🎯 最多可获得 <strong>3次</strong> 抽奖机会</div>
          <div class="rule-item">💰 现金奖品凭兑换码联系管理员兑换</div>
          <div class="rule-item">🎫 折扣券自动发放，下单时自动生效</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const prizes = ref<any[]>([])
const remainingSpins = ref(0)
const history = ref<any[]>([])
const isSpinning = ref(false)
const showResult = ref(false)
const resultWon = ref(false)
const resultPrize = ref<any>(null)
const redeemCode = ref('')
const wheelRef = ref<HTMLElement | null>(null)

const SEGMENT_COUNT = 8
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

// 扇区配色
const COLORS = ['#FF6B6B', '#1A1A2E', '#4ECDC4', '#1A1A2E', '#45B7D1', '#1A1A2E', '#96CEB4', '#1A1A2E']

function getSegmentStyle(index: number) {
  const angle = index * SEGMENT_ANGLE
  return {
    transform: `rotate(${angle}deg) skewY(-${90 - SEGMENT_ANGLE}deg)`,
    background: COLORS[index % COLORS.length],
  }
}

function getContentStyle(index: number) {
  const angle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
  return {
    transform: `skewY(${90 - SEGMENT_ANGLE}deg) rotate(${SEGMENT_ANGLE / 2}deg)`,
  }
}

async function loadInfo() {
  try {
    const res: any = await api.getLuckyWheelInfo()
    prizes.value = res.data.prizes
    remainingSpins.value = res.data.remainingSpins
    history.value = res.data.history
  } catch (err: any) {
    console.error('Failed to load wheel info:', err)
  }
}

async function spin() {
  if (isSpinning.value || remainingSpins.value <= 0) return

  isSpinning.value = true

  try {
    const res: any = await api.spinLuckyWheel()
    const { prizeIndex, prize, won, redeemCode: code, remainingSpins: remaining } = res.data

    // 计算目标角度：多转几圈 + 定位到中奖扇区
    const targetAngle = 360 * 5 + (360 - prizeIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2)

    // 应用旋转动画
    if (wheelRef.value) {
      wheelRef.value.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
      wheelRef.value.style.transform = `rotate(${targetAngle}deg)`
    }

    // 动画结束后显示结果
    setTimeout(() => {
      isSpinning.value = false
      resultWon.value = won
      resultPrize.value = prize
      redeemCode.value = code || ''
      remainingSpins.value = remaining
      showResult.value = true

      // 刷新历史
      loadInfo()
    }, 4200)
  } catch (err: any) {
    isSpinning.value = false
    alert(err?.message ?? '抽奖失败，请稍后重试')
  }
}

function copyCode() {
  if (redeemCode.value) {
    navigator.clipboard.writeText(redeemCode.value).then(() => {
      alert('✅ 兑换码已复制')
    })
  }
}

onMounted(loadInfo)
</script>

<style scoped>
/* ═══ 赛博朋克背景 ═══ */
.wheel-page {
  min-height: 100vh;
  background: var(--bg);
  position: relative;
  overflow: hidden;
  padding-bottom: 60px;
}

.cyber-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}
.orb-1 {
  width: 400px; height: 400px;
  background: #00d4ff;
  top: -100px; right: -100px;
}
.orb-2 {
  width: 300px; height: 300px;
  background: #a855f7;
  bottom: -50px; left: -80px;
}

/* ═══ 容器 ═══ */
.wheel-container {
  position: relative;
  z-index: 1;
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px;
}

/* ═══ 顶部 ═══ */
.wheel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-2);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.spin-count {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 6px 16px;
}
.count-label {
  font-size: 12px;
  color: var(--text-3);
}
.count-num {
  font-size: 20px;
  font-weight: 800;
  color: #00d4ff;
  font-variant-numeric: tabular-nums;
}

/* ═══ 标题 ═══ */
.wheel-title {
  text-align: center;
  font-size: 32px;
  font-weight: 900;
  color: var(--text-1);
  margin-bottom: 4px;
  letter-spacing: 4px;
}
.title-glow {
  color: #00d4ff;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}
.wheel-subtitle {
  text-align: center;
  font-size: 14px;
  color: var(--text-3);
  margin-bottom: 32px;
}

/* ═══ 转盘 ═══ */
.wheel-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto 32px;
}

/* 外圈光效 */
.wheel-ring {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 3px solid transparent;
  background: conic-gradient(from 0deg, #00d4ff, #a855f7, #00d4ff, #a855f7, #00d4ff) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: ring-rotate 8s linear infinite;
}

@keyframes ring-rotate {
  to { transform: rotate(360deg); }
}

/* 转盘本体 */
.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid #1a1a2e;
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.2),
    inset 0 0 30px rgba(0, 0, 0, 0.3);
}

.wheel-segment {
  position: absolute;
  width: 50%;
  height: 50%;
  top: 0;
  right: 0;
  transform-origin: 0% 100%;
  overflow: hidden;
}

.segment-content {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 200%;
  height: 200%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transform-origin: 0% 0%;
}

.segment-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}
.segment-label {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  text-align: center;
  max-width: 80px;
  line-height: 1.2;
}

/* 指针 */
.wheel-pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
}
.pointer-arrow {
  width: 0;
  height: 0;
  border-left: 18px solid transparent;
  border-right: 18px solid transparent;
  border-top: 36px solid #00d4ff;
  position: relative;
}
.pointer-arrow::after {
  content: '';
  position: absolute;
  top: -36px;
  left: -12px;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 28px solid #fff;
}

/* 中心按钮 */
.spin-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #00d4ff;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow:
    0 0 20px rgba(0, 212, 255, 0.3),
    inset 0 0 20px rgba(0, 212, 255, 0.1);
}
.spin-btn:hover:not(:disabled) {
  box-shadow:
    0 0 30px rgba(0, 212, 255, 0.5),
    inset 0 0 30px rgba(0, 212, 255, 0.2);
  transform: translate(-50%, -50%) scale(1.05);
}
.spin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.spin-btn-text {
  font-size: 18px;
  font-weight: 900;
  color: #00d4ff;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}
.spin-btn-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(0, 212, 255, 0.2);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

/* ═══ 提示 ═══ */
.spin-hint {
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 32px;
}

/* ═══ 中奖弹窗 ═══ */
.result-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.result-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.result-card.won {
  border-color: #00d4ff;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.2);
}
.result-card.won::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d4ff, #a855f7, #00d4ff);
}

.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 18px;
  cursor: pointer;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.result-title {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-1);
  margin-bottom: 8px;
}
.result-prize {
  font-size: 18px;
  font-weight: 700;
  color: #00d4ff;
  margin-bottom: 20px;
}
.result-hint {
  font-size: 14px;
  color: var(--text-3);
  margin-bottom: 20px;
}

/* 兑换码 */
.redeem-code-box {
  background: rgba(0, 212, 255, 0.05);
  border: 1px dashed #00d4ff;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}
.redeem-label {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}
.redeem-code {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 900;
  color: #00d4ff;
  letter-spacing: 4px;
  margin-bottom: 12px;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
.copy-btn {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #00d4ff;
  color: #00d4ff;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.copy-btn:hover {
  background: #00d4ff;
  color: #1a1a2e;
}
.redeem-hint {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 8px;
}

.result-actions {
  margin-top: 24px;
}
.result-btn {
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.result-btn.primary {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}
.result-btn.primary:hover {
  box-shadow: 0 6px 30px rgba(0, 212, 255, 0.5);
  transform: translateY(-2px);
}

/* 弹窗动画 */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s;
}
.modal-enter-active .result-card, .modal-leave-active .result-card {
  transition: transform 0.3s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .result-card {
  transform: scale(0.9);
}

/* ═══ 历史记录 ═══ */
.history-section, .rules-section {
  margin-top: 40px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-3);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.title-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
}
.history-item.is-won {
  border-color: rgba(0, 212, 255, 0.3);
}
.history-icon {
  font-size: 20px;
}
.history-label {
  flex: 1;
  color: var(--text-1);
  font-weight: 600;
}
.history-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}
.history-redeemed {
  font-size: 11px;
  color: var(--text-3);
  background: rgba(0, 212, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

/* ═══ 规则 ═══ */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-item {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  padding: 8px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.rule-item strong {
  color: #00d4ff;
}

/* ═══ 响应式 ═══ */
@media (max-width: 480px) {
  .wheel-wrapper {
    width: 280px;
    height: 280px;
  }
  .spin-btn {
    width: 64px;
    height: 64px;
  }
  .spin-btn-text {
    font-size: 14px;
  }
  .segment-icon {
    font-size: 18px;
  }
  .segment-label {
    font-size: 9px;
  }
  .wheel-title {
    font-size: 24px;
  }
}
</style>
