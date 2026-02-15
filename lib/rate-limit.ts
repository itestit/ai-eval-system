import { kv } from '@vercel/kv'

const RATE_LIMIT_WINDOW = 60 // 1分钟
const MAX_REQUESTS = 5 // 每窗口最多5次

// 简单的内存存储用于 fallback（仅适合单实例，生产环境建议使用 Redis）
const memoryStore = new Map<string, { count: number; reset: number }>()

export async function rateLimit(
  identifier: string,
  maxRequests: number = MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // 检查 KV 是否配置
  const isKvConfigured = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  
  if (!isKvConfigured) {
    // 使用内存限流作为 fallback
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds
    const reset = windowStart + windowSeconds
    const key = `${identifier}:${windowStart}`
    
    const record = memoryStore.get(key)
    if (!record || record.reset < now) {
      memoryStore.set(key, { count: 1, reset })
      return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset }
    }
    
    record.count++
    const remaining = Math.max(0, maxRequests - record.count)
    return {
      success: record.count <= maxRequests,
      limit: maxRequests,
      remaining,
      reset,
    }
  }

  try {
    const key = `rate_limit:${identifier}`
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds
    
    const pipeline = kv.pipeline()
    pipeline.hincrby(key, 'count', 1)
    pipeline.hset(key, { window: windowStart })
    pipeline.expire(key, windowSeconds * 2)
    
    const results = await pipeline.exec()
    const count = (results?.[0] as number) || 0
    
    const remaining = Math.max(0, maxRequests - count)
    const reset = windowStart + windowSeconds
    
    return {
      success: count <= maxRequests,
      limit: maxRequests,
      remaining,
      reset,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // 如果 KV 失败，允许请求通过
    return { success: true, limit: maxRequests, remaining: maxRequests, reset: 0 }
  }
}
