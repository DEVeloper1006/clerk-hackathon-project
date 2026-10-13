import type { FastifyPluginAsync } from 'fastify'
import { ruleSchema } from '@clerk/shared'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as rulesService from './rules.service.js'

interface IdParams {
  id: string
}

export const rulesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/', async (request) => ok(await rulesService.listRules(request.user.tenantId)))

  app.post('/', async (request, reply) => {
    const body = ruleSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await rulesService.createRule(request.user.tenantId, body.data))
  })

  app.patch<{ Params: IdParams }>('/:id', async (request, reply) => {
    const body = ruleSchema.partial().safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await rulesService.updateRule(request.user.tenantId, request.params.id, body.data))
  })

  app.delete<{ Params: IdParams }>('/:id', async (request) =>
    ok({ deleted: await rulesService.deleteRule(request.user.tenantId, request.params.id) }),
  )
}
