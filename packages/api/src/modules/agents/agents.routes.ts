import type { FastifyPluginAsync } from 'fastify'
import { agentSchema } from '@clerk/shared'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as agentsService from './agents.service.js'

interface IdParams {
  id: string
}

export const agentsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/', async (request) => ok(await agentsService.listAgents(request.user.tenantId)))

  app.get<{ Params: IdParams }>('/:id', async (request) =>
    ok(await agentsService.getAgent(request.user.tenantId, request.params.id)),
  )

  app.post('/', async (request, reply) => {
    const body = agentSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await agentsService.createAgent(request.user.tenantId, body.data))
  })

  app.patch<{ Params: IdParams }>('/:id', async (request, reply) => {
    const body = agentSchema.partial().safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await agentsService.updateAgent(request.user.tenantId, request.params.id, body.data))
  })

  app.delete<{ Params: IdParams }>('/:id', async (request) =>
    ok({ deleted: await agentsService.deleteAgent(request.user.tenantId, request.params.id) }),
  )

  app.post<{ Params: IdParams }>('/:id/start', async (request) =>
    ok({
      running: await agentsService.setAgentRunning(request.user.tenantId, request.params.id, true),
    }),
  )

  app.post<{ Params: IdParams }>('/:id/stop', async (request) => {
    await agentsService.setAgentRunning(request.user.tenantId, request.params.id, false)
    return ok({ running: false })
  })
}
