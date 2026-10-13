import type { FastifyPluginAsync } from 'fastify'
import { readFile } from 'node:fs/promises'
import { fail, ok } from '../../lib.js'
import { authenticate } from '../auth/auth.middleware.js'

const PRESETS = ['freelancer', 'ecommerce', 'agency'] as const
type Preset = (typeof PRESETS)[number]

const isPreset = (value: string): value is Preset => (PRESETS as readonly string[]).includes(value)

async function loadPreset(name: Preset): Promise<unknown> {
  // Presets ship as JSON next to the source; read at runtime so tsc doesn't need to copy them.
  const url = new URL(`../../../src/modules/templates/presets/${name}.json`, import.meta.url)
  return JSON.parse(await readFile(url, 'utf8')) as unknown
}

export const templatesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', authenticate)

  app.get('/', async () => ok(await Promise.all(PRESETS.map(loadPreset))))

  app.post<{ Params: { name: string } }>('/:name/apply', async (request, reply) => {
    const { name } = request.params
    if (!isPreset(name)) return reply.code(404).send(fail(`Unknown template: ${name}`))
    // TODO: implement — create the preset's agents + rules for request.user.tenantId.
    return ok({ applied: name, tenantId: request.user.tenantId })
  })
}
