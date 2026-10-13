import type { FastifyPluginAsync } from 'fastify'
import { tenantSchema } from '@clerk/shared'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as tenantsService from './tenants.service.js'

// A user only ever sees their own tenant, so these routes operate on request.user.tenantId.
export const tenantsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/me', async (request) => {
    return ok(await tenantsService.getTenant(request.user.tenantId))
  })

  app.post('/', async (request, reply) => {
    const body = tenantSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await tenantsService.createTenant(body.data))
  })

  app.patch('/me', async (request, reply) => {
    const body = tenantSchema.partial().safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    return ok(await tenantsService.updateTenant(request.user.tenantId, body.data))
  })

  app.delete('/me', async (request) => {
    return ok({ deleted: await tenantsService.deleteTenant(request.user.tenantId) })
  })
}
