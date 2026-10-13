import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as transactionsService from './transactions.service.js'

const listQuery = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const transactionsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/', async (request, reply) => {
    const query = listQuery.safeParse(request.query)
    if (!query.success) return reply.code(400).send(fail(query.error.message))
    return ok(await transactionsService.listTransactions(request.user.tenantId, query.data))
  })

  app.get<{ Params: { id: string } }>('/:id', async (request) =>
    ok(await transactionsService.getTransaction(request.user.tenantId, request.params.id)),
  )
}
