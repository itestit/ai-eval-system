import { kv } from '@vercel/kv'

const RATE_LIMIT_WINDOW = 60 // 1分钟
const MAX_REQUESTS = 5 // 每窗口最多5次

export async function rateLimit(
  identifier: string,
  maxRequests: number = MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
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
}
