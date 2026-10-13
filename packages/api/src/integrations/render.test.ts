import { beforeAll, describe, expect, it, vi } from 'vitest'

// render.ts imports the env module, which validates process.env at import time.
vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost:5432/test')
vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
vi.stubEnv('ELASTICSEARCH_URL', 'http://localhost:9200')
vi.stubEnv('JWT_SECRET', 'test-secret-at-least-16')

let mod: typeof import('./render.js')

beforeAll(async () => {
  mod = await import('./render.js')
})

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('renderResourceName', () => {
  it('prefixes with the tenant and slugifies the name', () => {
    expect(mod.renderResourceName('t-123', 'My API Server!')).toBe(
      'clerk-tenant-t-123-my-api-server',
    )
  })

  it('rejects empty names and tenants', () => {
    expect(() => mod.renderResourceName('', 'api')).toThrow()
    expect(() => mod.renderResourceName('t1', '!!!')).toThrow()
  })
})

describe('RenderClient', () => {
  it('sends bearer auth and unwraps paginated lists', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(200, [
        { service: { id: 'srv-1' }, cursor: 'c1' },
        { service: { id: 'srv-2' }, cursor: 'c2' },
      ]),
    )
    const client = new mod.RenderClient({ apiKey: 'rnd_test', ownerId: 'own-1', fetch: fetchMock })

    const page = await client.listServices({ limit: 2 })

    expect(page.items.map((s) => s.id)).toEqual(['srv-1', 'srv-2'])
    expect(page.cursor).toBe('c2')
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe('https://api.render.com/v1/services?limit=2&ownerId=own-1')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer rnd_test')
  })

  it('wraps API errors in RenderApiError with status and message', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(404, { id: 'not-found', message: 'service not found' }))
    const client = new mod.RenderClient({ apiKey: 'rnd_test', fetch: fetchMock })

    const err = await client.getService('srv-missing').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(mod.RenderApiError)
    expect(err).toMatchObject({ status: 404, message: 'service not found' })
  })

  it('wraps network failures', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('ECONNRESET'))
    const client = new mod.RenderClient({ apiKey: 'rnd_test', fetch: fetchMock })

    await expect(client.getService('srv-1')).rejects.toMatchObject({ status: 0 })
  })

  it('requires an owner id to create resources', async () => {
    const client = new mod.RenderClient({ apiKey: 'rnd_test', fetch: vi.fn<typeof fetch>() })
    await expect(client.createPostgres({ name: 'db' })).rejects.toThrow('RENDER_OWNER_ID')
  })

  it('handles empty 2xx bodies (suspend/delete)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }))
    const client = new mod.RenderClient({ apiKey: 'rnd_test', fetch: fetchMock })
    await expect(client.suspendService('srv-1')).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST')
  })
})
