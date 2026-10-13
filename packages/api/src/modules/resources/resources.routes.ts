import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { z, ZodTypeAny } from 'zod'
import { fail, ok } from '../../lib.js'
import { SecretsNotConfiguredError } from '../../utils/crypto.js'
import { authenticate } from '../auth/auth.middleware.js'
import * as resourcesService from './resources.service.js'
import {
  ResourceConflictError,
  deployTriggerSchema,
  resourceCreateSchema,
  resourceParamsSchema,
  resourceUpdateSchema,
  secretsPutSchema,
  tenantParamsSchema,
} from './resources.types.js'

const NOT_FOUND = 'Resource not found'

/** Parses input or sends a 400. Returns undefined when a response was already sent. */
async function parse<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
  reply: FastifyReply,
): Promise<z.output<S> | undefined> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  await reply.code(400).send(fail(result.error.issues.map((i) => i.message).join('; ')))
  return undefined
}

/**
 * Tenant isolation for path-param routes: the :tenantId in the URL must be the caller's own tenant.
 * Runs after `authenticate`, so request.user is populated.
 */
async function requireOwnTenant(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = tenantParamsSchema.safeParse(request.params)
  if (!params.success) {
    await reply.code(400).send(fail('Invalid tenantId'))
    return
  }
  if (params.data.tenantId !== request.user.tenantId) {
    await reply.code(403).send(fail('Forbidden'))
  }
}

// Mounted at /api/tenants/:tenantId/resources
export const resourcesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireOwnTenant)

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ResourceConflictError) return reply.code(409).send(fail(error.message))
    if (error instanceof SecretsNotConfiguredError) return reply.code(503).send(fail(error.message))
    request.log.error(error)
    return reply.code(500).send(fail('Internal server error'))
  })

  app.get('/', async (request, reply) => {
    const params = await parse(tenantParamsSchema, request.params, reply)
    if (!params) return
    return ok(await resourcesService.listResources(params.tenantId))
  })

  app.post('/', async (request, reply) => {
    const params = await parse(tenantParamsSchema, request.params, reply)
    const body = params && (await parse(resourceCreateSchema, request.body, reply))
    if (!params || !body) return
    const resource = await resourcesService.createResource(params.tenantId, body)
    return reply.code(201).send(ok(resource))
  })

  app.get('/:resourceId', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    if (!params) return
    const resource = await resourcesService.getResource(params.tenantId, params.resourceId)
    return resource ? ok(resource) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.patch('/:resourceId', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    const body = params && (await parse(resourceUpdateSchema, request.body, reply))
    if (!params || !body) return
    const resource = await resourcesService.updateResource(params.tenantId, params.resourceId, body)
    return resource ? ok(resource) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.delete('/:resourceId', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    if (!params) return
    const resource = await resourcesService.requestDestroy(params.tenantId, params.resourceId)
    return resource ? reply.code(202).send(ok(resource)) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.get('/:resourceId/deployments', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    if (!params) return
    const list = await resourcesService.listDeployments(params.tenantId, params.resourceId)
    return list ? ok(list) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.post('/:resourceId/deploy', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    const body = params && (await parse(deployTriggerSchema, request.body ?? {}, reply))
    if (!params || !body) return
    const deployment = await resourcesService.triggerDeploy(
      params.tenantId,
      params.resourceId,
      body,
    )
    return deployment ? reply.code(202).send(ok(deployment)) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.get('/:resourceId/secrets', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    if (!params) return
    const list = await resourcesService.listSecrets(params.tenantId, params.resourceId)
    return list ? ok(list) : reply.code(404).send(fail(NOT_FOUND))
  })

  app.put('/:resourceId/secrets', async (request, reply) => {
    const params = await parse(resourceParamsSchema, request.params, reply)
    const body = params && (await parse(secretsPutSchema, request.body, reply))
    if (!params || !body) return
    const list = await resourcesService.putSecrets(params.tenantId, params.resourceId, body)
    return list ? ok(list) : reply.code(404).send(fail(NOT_FOUND))
  })
}
