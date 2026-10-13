import type { Redis } from 'ioredis'
import { createRedisClient } from '../config/redis.js'
import {
  eventChannel,
  eventPattern,
  type ClerkEventEnvelope,
  type EventPayloads,
  type EventType,
} from './types.js'

type Handler<T extends EventType> = (event: ClerkEventEnvelope<T>) => void | Promise<void>

/**
 * Redis pub/sub event bus. Channels are always tenant-scoped: `clerk:{tenantId}:{eventType}`.
 * Pub/sub needs a dedicated connection for subscribing, so we keep two clients.
 */
export class EventBus {
  private readonly pub: Redis
  private readonly sub: Redis
  private readonly handlers = new Map<string, Set<Handler<EventType>>>()

  constructor() {
    this.pub = createRedisClient('bus-pub')
    this.sub = createRedisClient('bus-sub')
    this.sub.on('pmessage', (pattern: string, _channel: string, message: string) => {
      void this.dispatch(pattern, message)
    })
  }

  async publish<T extends EventType>(
    tenantId: string,
    type: T,
    payload: EventPayloads[T],
  ): Promise<void> {
    const event: ClerkEventEnvelope<T> = {
      type,
      tenantId,
      timestamp: new Date().toISOString(),
      payload,
    }
    await this.pub.publish(eventChannel(tenantId, type), JSON.stringify(event))
  }

  /** Subscribe to one event type across all tenants. Handlers receive the tenantId on the event. */
  async subscribe<T extends EventType>(type: T, handler: Handler<T>): Promise<void> {
    const pattern = eventPattern(type)
    let set = this.handlers.get(pattern)
    if (!set) {
      set = new Set()
      this.handlers.set(pattern, set)
      await this.sub.psubscribe(pattern)
    }
    set.add(handler as Handler<EventType>)
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.pub.quit(), this.sub.quit()])
  }

  private async dispatch(pattern: string, message: string): Promise<void> {
    const set = this.handlers.get(pattern)
    if (!set) return
    let event: ClerkEventEnvelope
    try {
      event = JSON.parse(message) as ClerkEventEnvelope
    } catch {
      console.error('[bus] dropped malformed message on', pattern)
      return
    }
    for (const handler of set) {
      try {
        await handler(event)
      } catch (err) {
        console.error(`[bus] handler for ${event.type} failed:`, err)
      }
    }
  }
}

export const bus = new EventBus()
