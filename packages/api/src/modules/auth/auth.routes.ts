import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { fail, ok } from '../../lib.js'
import * as authService from './auth.service.js'

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1),
})

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const body = registerBody.safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    const user = await authService.register(body.data)
    const token = user ? app.jwt.sign(user) : null
    return ok({ token })
  })

  app.post('/login', async (request, reply) => {
    const body = loginBody.safeParse(request.body)
    if (!body.success) return reply.code(400).send(fail(body.error.message))
    const user = await authService.login(body.data)
    const token = user ? app.jwt.sign(user) : null
    return ok({ token })
  })
}
