import type { FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { EventType, type ClerkEventEnvelope } from '../events/types.js'
import { bus } from '../events/bus.js'
import { env } from '../config/env.js'
import type { JwtUser } from '../modules/auth/auth.types.js'

export const tenantRoom = (tenantId: string): string => `tenant:${tenantId}`

/** Event types relayed from the Redis bus to dashboard clients. */
const RELAYED_EVENTS: EventType[] = [
  EventType.AgentAction,
  EventType.TransactionCreated,
  EventType.TransactionScored,
  EventType.ForecastUpdated,
  EventType.InsightGenerated,
]

export function setupSocket(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  })

  // Authenticate the handshake with the same JWT the REST API uses.
  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth.token
    if (typeof token !== 'string') return next(new Error('unauthorized'))
    try {
      const user = app.jwt.verify<JwtUser>(token)
      socket.data.user = user
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtUser
    void socket.join(tenantRoom(user.tenantId))
  })

  const relay = (event: ClerkEventEnvelope) => {
    io.to(tenantRoom(event.tenantId)).emit(event.type, event)
  }
  // Not awaited: subscriptions queue until Redis is reachable, so boot never blocks on Redis.
  for (const type of RELAYED_EVENTS) {
    bus.subscribe(type, relay).catch((err: unknown) => {
      app.log.error({ err, type }, 'failed to subscribe socket relay')
    })
  }

  return io
}
