import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
import { pool } from './config/db.js'
import { bus } from './events/bus.js'
import { setupSocket } from './ws/socket.js'
import { fail, ok } from './lib.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { tenantsRoutes } from './modules/tenants/tenants.routes.js'
import { paypalRoutes } from './modules/paypal/paypal.routes.js'
import { agentsRoutes } from './modules/agents/agents.routes.js'
import { rulesRoutes } from './modules/rules/rules.routes.js'
import { transactionsRoutes } from './modules/transactions/transactions.routes.js'
import { templatesRoutes } from './modules/templates/templates.routes.js'

const app = Fastify({
  logger: env.NODE_ENV === 'development' ? { level: 'info' } : true,
})

await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })
await app.register(jwt, { secret: env.JWT_SECRET })

app.setErrorHandler<FastifyError>((error, request, reply) => {
  request.log.error(error)
  const status = error.statusCode ?? 500
  void reply.code(status).send(fail(status >= 500 ? 'Internal server error' : error.message))
})

app.setNotFoundHandler((_request, reply) => {
  void reply.code(404).send(fail('Not found'))
})

app.get('/health', async () => ok({ status: 'ok' }))

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(tenantsRoutes, { prefix: '/api/tenants' })
await app.register(paypalRoutes, { prefix: '/api/paypal' })
await app.register(agentsRoutes, { prefix: '/api/agents' })
await app.register(rulesRoutes, { prefix: '/api/rules' })
await app.register(transactionsRoutes, { prefix: '/api/transactions' })
await app.register(templatesRoutes, { prefix: '/api/templates' })

await app.ready()
const io = setupSocket(app)

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`)
  io.close()
  await Promise.allSettled([app.close(), bus.close(), pool.end()])
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
