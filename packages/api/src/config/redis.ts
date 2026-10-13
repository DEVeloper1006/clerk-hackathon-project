import { Redis } from 'ioredis'
import { env } from './env.js'

export function createRedisClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 500, 10_000),
  })
  let warned = false
  client.on('error', (err) => {
    if (!warned) {
      console.warn(
        `[redis:${name}] ${err.message || (err as NodeJS.ErrnoException).code || 'connection error'} — retrying in background`,
      )
      warned = true
    }
  })
  client.on('ready', () => {
    warned = false
  })
  return client
}

export const redis = createRedisClient('main')
