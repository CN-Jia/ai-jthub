import { FastifyInstance } from 'fastify'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import os from 'node:os'

const PROM = env.PROMETHEUS_URL

// 查询 Prometheus 即时值
async function promQuery(query: string): Promise<number | null> {
  try {
    const url = `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const json: any = await res.json()
    const val = json?.data?.result?.[0]?.value?.[1]
    return val !== undefined ? parseFloat(val) : null
  } catch {
    return null
  }
}

// 查询 Prometheus 时间序列（过去N分钟）
async function promRange(
  query: string,
  minutes = 60,
  step = 60,
): Promise<Array<[number, number]>> {
  try {
    const end = Math.floor(Date.now() / 1000)
    const start = end - minutes * 60
    const url = `${PROM}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const json: any = await res.json()
    const values: Array<[number, string]> = json?.data?.result?.[0]?.values ?? []
    return values.map(([ts, v]) => [ts * 1000, parseFloat(v)])
  } catch {
    return []
  }
}

// 系统基础信息（不依赖 Prometheus，纯 Node.js os 模块）
function getOsInfo() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const uptime = os.uptime()

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? 'Unknown',
    loadAvg: os.loadavg(),
    totalMem,
    freeMem,
    usedMem,
    memUsedPct: Math.round((usedMem / totalMem) * 100),
    uptimeSeconds: uptime,
    uptimeHuman: formatUptime(uptime),
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}小时`
  if (h > 0) return `${h}小时 ${m}分钟`
  return `${m}分钟`
}

export async function adminSystemRoutes(fastify: FastifyInstance) {

  // ── 系统状态快照（卡片数据）──────────────────────────────────────
  fastify.get('/admin/system/status', { preHandler: verifyAdmin }, async (_req, reply) => {
    const osInfo = getOsInfo()

    // 并行查询 Prometheus 指标
    const [
      cpuUsage,
      memUsedBytes,
      memTotalBytes,
      diskUsedRoot,
      diskTotalRoot,
      load1,
      load5,
      netRxRate,
      netTxRate,
      openFiles,
      tcpConns,
    ] = await Promise.all([
      promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)'),
      promQuery('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes'),
      promQuery('node_memory_MemTotal_bytes'),
      promQuery('node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}'),
      promQuery('node_filesystem_size_bytes{mountpoint="/"}'),
      promQuery('node_load1'),
      promQuery('node_load5'),
      promQuery('sum(rate(node_network_receive_bytes_total{device!="lo"}[2m]))'),
      promQuery('sum(rate(node_network_transmit_bytes_total{device!="lo"}[2m]))'),
      promQuery('process_open_fds'),
      promQuery('node_netstat_Tcp_CurrEstab'),
    ])

    // 业务指标（从数据库查）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [totalOrders, todayOrders, totalUsers, pendingOrders, pendingRedeems] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.redeemOrder.count({ where: { status: 'PENDING' } }).catch(() => 0),
    ])

    const promAvailable = cpuUsage !== null

    return reply.send(successResponse({
      promAvailable,
      os: osInfo,
      cpu: {
        usagePct: cpuUsage !== null ? Math.round(cpuUsage * 10) / 10 : null,
        load1: load1 ?? osInfo.loadAvg[0],
        load5: load5 ?? osInfo.loadAvg[1],
        load15: osInfo.loadAvg[2],
        cores: osInfo.cpuCount,
      },
      memory: {
        totalBytes: memTotalBytes ?? osInfo.totalMem,
        usedBytes: memUsedBytes ?? osInfo.usedMem,
        usedPct: memTotalBytes && memUsedBytes
          ? Math.round((memUsedBytes / memTotalBytes) * 100)
          : osInfo.memUsedPct,
      },
      disk: {
        totalBytes: diskTotalRoot ?? null,
        usedBytes: diskUsedRoot ?? null,
        usedPct: diskTotalRoot && diskUsedRoot
          ? Math.round((diskUsedRoot / diskTotalRoot) * 100)
          : null,
      },
      network: {
        rxBytesPerSec: netRxRate ?? null,
        txBytesPerSec: netTxRate ?? null,
      },
      process: {
        openFiles: openFiles ?? null,
        tcpConns: tcpConns ?? null,
        nodeUptime: process.uptime(),
      },
      business: {
        totalOrders,
        todayOrders,
        totalUsers,
        pendingOrders,
        pendingRedeems,
      },
    }))
  })

  // ── 时序图数据（过去1小时折线图）──────────────────────────────────
  fastify.get('/admin/system/chart', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const minutes = Math.min(1440, Math.max(30, Number(q.minutes) || 60))
    const step = minutes <= 60 ? 60 : minutes <= 360 ? 300 : 600

    const [cpuSeries, memSeries, netRxSeries, netTxSeries] = await Promise.all([
      promRange('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)', minutes, step),
      promRange('(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100', minutes, step),
      promRange('sum(rate(node_network_receive_bytes_total{device!="lo"}[2m]))', minutes, step),
      promRange('sum(rate(node_network_transmit_bytes_total{device!="lo"}[2m]))', minutes, step),
    ])

    const promAvailable = cpuSeries.length > 0

    return reply.send(successResponse({
      promAvailable,
      minutes,
      cpu: cpuSeries,
      memory: memSeries,
      netRx: netRxSeries,
      netTx: netTxSeries,
    }))
  })
}
