import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as paypalService from './paypal.service.js'
import {
  handleWebhook,
  verifyWebhookSignature,
  type PayPalWebhookEvent,
} from './paypal.webhooks.js'

const callbackQuery = z.object({ code: z.string(), state: z.string() })

export const paypalRoutes: FastifyPluginAsync = async (app) => {
  app.get('/connect', { preHandler: authenticate }, async (request) => {
    return ok({ url: paypalService.buildConnectUrl(request.user.tenantId) })
  })

  app.get('/callback', async (request, reply) => {
    const query = callbackQuery.safeParse(request.query)
    if (!query.success) return reply.code(400).send(fail('Missing code or state'))
    // TODO(dev): state should be a signed value, not a raw tenantId, to prevent CSRF/tenant spoofing.
    const connected = await paypalService.exchangeCode(query.data.state, query.data.code)
    return ok({ connected })
  })

  app.post('/webhooks', async (request, reply) => {
    if (!(await verifyWebhookSignature(request))) {
      return reply.code(401).send(fail('Invalid webhook signature'))
    }
    await handleWebhook(request.body as PayPalWebhookEvent)
    return ok({ received: true })
  })
}
