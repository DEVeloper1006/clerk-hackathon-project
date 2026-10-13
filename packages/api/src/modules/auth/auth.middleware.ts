import type { FastifyReply, FastifyRequest } from 'fastify'
import { fail } from '../../lib.js'

/** preHandler hook: verifies the bearer JWT and populates request.user (with tenantId). */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    await reply.code(401).send(fail('Unauthorized'))
  }
}
