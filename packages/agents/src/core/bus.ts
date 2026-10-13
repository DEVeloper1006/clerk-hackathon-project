import { Redis } from 'ioredis'
import {
  eventChannel,
  eventPattern,
  type ClerkEvent,
  type ClerkEventEnvelope,
  type EventPayloads,
  type EventType,
} from '@clerk/shared'
import { env } from '../config/env.js'

type Handler = (event: ClerkEvent) => Promise<void>

function createClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 500, 10_000),
  })
  let warned = false
  client.on('error', (err) => {
    if (!warned)
      console.warn(
        `[redis:${name}] ${err.message || (err as NodeJS.ErrnoException).code || 'connection error'} — retrying in background`,
      )
    warned = true
  })
  client.on('ready', () => {
    warned = false
  })
  return client
}

/** Worker-side mirror of packages/api/src/events/bus.ts. Same tenant-scoped channel format. */
export class AgentBus {
  private readonly pub = createClient('agents-pub')
  private readonly sub = createClient('agents-sub')
  private readonly handlers = new Map<string, Handler[]>()

  constructor() {
    this.sub.on('pmessage', (pattern: string, _channel: string, message: string) => {
      let event: ClerkEvent
      try {
        event = JSON.parse(message) as ClerkEvent
      } catch {
        console.error('[bus] dropped malformed message on', pattern)
        return
      }
      for (const handler of this.handlers.get(pattern) ?? []) void handler(event)
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

  async subscribe(type: EventType, handler: Handler): Promise<void> {
    const pattern = eventPattern(type)
    const list = this.handlers.get(pattern)
    if (list) {
      list.push(handler)
      return
    }
    this.handlers.set(pattern, [handler])
    await this.sub.psubscribe(pattern)
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.pub.quit(), this.sub.quit()])
  }
}

export const bus = new AgentBus()
