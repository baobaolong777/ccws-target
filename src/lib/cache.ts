// 简单的内存缓存，避免每次切换页面都重新加载数据
const cache = new Map<string, { data: any; timestamp: number }>()

const CACHE_TTL = 30 * 1000 // 30秒缓存

export function getCached<T>(key: string): T | null {
  const item = cache.get(key)
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data as T
  }
  return null
}

export function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
