import { env } from '../config/env.js'

/**
 * Typed client for the Render REST API (https://api.render.com/v1).
 * Docs: https://api-docs.render.com — shapes below cover the fields Clerk uses, not the full API.
 */

export const RENDER_API_BASE = 'https://api.render.com/v1'

// ─── Shared shapes ──────────────────────────────────────────

export type RenderRegion = 'oregon' | 'ohio' | 'virginia' | 'frankfurt' | 'singapore'
export type RenderRuntime = 'node' | 'docker' | 'python' | 'go' | 'ruby' | 'rust' | 'elixir'
export type RenderServiceType =
  'web_service' | 'background_worker' | 'cron_job' | 'static_site' | 'private_service'

export interface RenderEnvVar {
  key: string
  value: string
}

export interface RenderService {
  id: string
  name: string
  type: RenderServiceType
  ownerId: string
  repo?: string
  branch?: string
  autoDeploy: 'yes' | 'no'
  suspended: 'suspended' | 'not_suspended'
  dashboardUrl: string
  serviceDetails?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type RenderDeployStatus =
  | 'created'
  | 'queued'
  | 'build_in_progress'
  | 'update_in_progress'
  | 'pre_deploy_in_progress'
  | 'live'
  | 'deactivated'
  | 'build_failed'
  | 'update_failed'
  | 'pre_deploy_failed'
  | 'canceled'

export interface RenderDeploy {
  id: string
  status: RenderDeployStatus
  trigger?: string
  commit?: { id: string; message?: string; createdAt?: string }
  createdAt: string
  updatedAt: string
  finishedAt?: string | null
}

export interface RenderPostgres {
  id: string
  name: string
  plan: string
  region: RenderRegion
  status: 'creating' | 'available' | 'unavailable' | 'suspended' | 'config_restart' | string
  version: string
  databaseName: string
  databaseUser: string
  dashboardUrl: string
  createdAt: string
  updatedAt: string
}

export interface RenderKeyValue {
  id: string
  name: string
  plan: string
  region: RenderRegion
  status: string
  dashboardUrl: string
  createdAt: string
  updatedAt: string
}

/** Render paginates list endpoints as `[{ <item>, cursor }]`. */
export interface RenderPage<T> {
  items: T[]
  /** Pass to the next call to continue; null when this was the last page. */
  cursor: string | null
}

export interface ListOptions {
  limit?: number
  cursor?: string
}

// ─── Inputs ─────────────────────────────────────────────────

interface BaseServiceInput {
  name: string
  repo?: string
  branch?: string
  image?: { imagePath: string; registryCredentialId?: string }
  autoDeploy?: boolean
  envVars?: RenderEnvVar[]
  plan?: string
  region?: RenderRegion
}

export interface CreateWebServiceInput extends BaseServiceInput {
  runtime: RenderRuntime
  buildCommand?: string
  startCommand?: string
  healthCheckPath?: string
  numInstances?: number
}

export type CreateWorkerInput = Omit<CreateWebServiceInput, 'healthCheckPath'>

export interface CreateCronJobInput extends Omit<
  CreateWebServiceInput,
  'healthCheckPath' | 'numInstances'
> {
  /** Cron expression, e.g. "0 * * * *". */
  schedule: string
}

export interface CreatePostgresDbInput {
  name: string
  plan: string
  /** Postgres major version, e.g. "16". */
  version: string
  region?: RenderRegion
  databaseName?: string
  databaseUser?: string
}

export interface CreateKeyValueInput {
  name: string
  plan: string
  region?: RenderRegion
  maxmemoryPolicy?: 'allkeys_lru' | 'noeviction' | 'volatile_lru' | string
}

export interface ListServicesOptions extends ListOptions {
  name?: string
  type?: RenderServiceType
  suspended?: 'suspended' | 'not_suspended'
}

export interface TriggerDeployInput {
  commitId?: string
  clearCache?: boolean
}

export interface CreateServiceResult {
  service: RenderService
  deployId: string | null
}

// ─── Errors ─────────────────────────────────────────────────

export class RenderApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null,
  ) {
    super(message)
    this.name = 'RenderApiError'
  }
}

// ─── Helpers ────────────────────────────────────────────────

/** Every Render resource Clerk creates is named `clerk-tenant-{tenantId}-{name}`. */
export function renderResourceName(tenantId: string, name: string): string {
  if (!tenantId) throw new Error('renderResourceName: tenantId is required')
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) throw new Error('renderResourceName: name must contain letters or numbers')
  return `clerk-tenant-${tenantId}-${slug}`
}

function toPage<R extends { cursor: string }, T>(rows: R[], pick: (row: R) => T): RenderPage<T> {
  return {
    items: rows.map(pick),
    cursor: rows.at(-1)?.cursor ?? null,
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

// ─── Client ─────────────────────────────────────────────────

export interface RenderClientOptions {
  apiKey: string
  /** Workspace that new services and datastores are created under. */
  ownerId?: string
  baseUrl?: string
  fetch?: typeof fetch
}

export class RenderClient {
  private readonly apiKey: string
  private readonly ownerId: string | undefined
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: RenderClientOptions) {
    this.apiKey = options.apiKey
    this.ownerId = options.ownerId
    this.baseUrl = options.baseUrl ?? RENDER_API_BASE
    this.fetchImpl = options.fetch ?? fetch
  }

  // Services ------------------------------------------------

  createWebService(input: CreateWebServiceInput): Promise<CreateServiceResult> {
    return this.createService('web_service', input, {
      healthCheckPath: input.healthCheckPath,
      numInstances: input.numInstances,
    })
  }

  createWorker(input: CreateWorkerInput): Promise<CreateServiceResult> {
    return this.createService('background_worker', input, { numInstances: input.numInstances })
  }

  createCronJob(input: CreateCronJobInput): Promise<CreateServiceResult> {
    return this.createService('cron_job', input, { schedule: input.schedule })
  }

  getService(serviceId: string): Promise<RenderService> {
    return this.request<RenderService>('GET', `/services/${encodeURIComponent(serviceId)}`)
  }

  async listServices(options: ListServicesOptions = {}): Promise<RenderPage<RenderService>> {
    const rows = await this.request<Array<{ service: RenderService; cursor: string }>>(
      'GET',
      `/services${query({
        limit: options.limit,
        cursor: options.cursor,
        name: options.name,
        type: options.type,
        suspended: options.suspended,
        ownerId: this.ownerId,
      })}`,
    )
    return toPage(rows, (row) => row.service)
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.request<void>('DELETE', `/services/${encodeURIComponent(serviceId)}`)
  }

  async suspendService(serviceId: string): Promise<void> {
    await this.request<void>('POST', `/services/${encodeURIComponent(serviceId)}/suspend`)
  }

  async resumeService(serviceId: string): Promise<void> {
    await this.request<void>('POST', `/services/${encodeURIComponent(serviceId)}/resume`)
  }

  // Deploys -------------------------------------------------

  triggerDeploy(serviceId: string, input: TriggerDeployInput = {}): Promise<RenderDeploy> {
    return this.request<RenderDeploy>(
      'POST',
      `/services/${encodeURIComponent(serviceId)}/deploys`,
      {
        commitId: input.commitId,
        clearCache: input.clearCache ? 'clear' : 'do_not_clear',
      },
    )
  }

  getDeploy(serviceId: string, deployId: string): Promise<RenderDeploy> {
    return this.request<RenderDeploy>(
      'GET',
      `/services/${encodeURIComponent(serviceId)}/deploys/${encodeURIComponent(deployId)}`,
    )
  }

  async listDeploys(
    serviceId: string,
    options: ListOptions = {},
  ): Promise<RenderPage<RenderDeploy>> {
    const rows = await this.request<Array<{ deploy: RenderDeploy; cursor: string }>>(
      'GET',
      `/services/${encodeURIComponent(serviceId)}/deploys${query({ ...options })}`,
    )
    return toPage(rows, (row) => row.deploy)
  }

  // Env vars ------------------------------------------------

  /** Replaces the service's full env var set. */
  async setEnvVars(serviceId: string, envVars: RenderEnvVar[]): Promise<RenderEnvVar[]> {
    const rows = await this.request<Array<{ envVar: RenderEnvVar; cursor: string }>>(
      'PUT',
      `/services/${encodeURIComponent(serviceId)}/env-vars`,
      envVars,
    )
    return rows.map((row) => row.envVar)
  }

  async getEnvVars(
    serviceId: string,
    options: ListOptions = {},
  ): Promise<RenderPage<RenderEnvVar>> {
    const rows = await this.request<Array<{ envVar: RenderEnvVar; cursor: string }>>(
      'GET',
      `/services/${encodeURIComponent(serviceId)}/env-vars${query({ ...options })}`,
    )
    return toPage(rows, (row) => row.envVar)
  }

  // Datastores ----------------------------------------------

  /** Clerk-flavored Postgres: Postgres 16 on the cheapest paid plan unless overridden. */
  createPostgres(
    input: Pick<CreatePostgresDbInput, 'name'> & Partial<CreatePostgresDbInput>,
  ): Promise<RenderPostgres> {
    return this.createPostgresDb({ plan: 'basic_256mb', version: '16', ...input })
  }

  async createPostgresDb(input: CreatePostgresDbInput): Promise<RenderPostgres> {
    return this.request<RenderPostgres>('POST', '/postgres', {
      ...input,
      ownerId: this.requireOwnerId(),
    })
  }

  getPostgresDb(postgresId: string): Promise<RenderPostgres> {
    return this.request<RenderPostgres>('GET', `/postgres/${encodeURIComponent(postgresId)}`)
  }

  async deletePostgresDb(postgresId: string): Promise<void> {
    await this.request<void>('DELETE', `/postgres/${encodeURIComponent(postgresId)}`)
  }

  async createKeyValue(input: CreateKeyValueInput): Promise<RenderKeyValue> {
    return this.request<RenderKeyValue>('POST', '/key-value', {
      ...input,
      ownerId: this.requireOwnerId(),
    })
  }

  // Internals -----------------------------------------------

  private async createService(
    type: Extract<RenderServiceType, 'web_service' | 'background_worker' | 'cron_job'>,
    input: CreateWebServiceInput,
    extraDetails: Record<string, unknown>,
  ): Promise<CreateServiceResult> {
    return this.request<CreateServiceResult>('POST', '/services', {
      type,
      name: input.name,
      ownerId: this.requireOwnerId(),
      repo: input.repo,
      branch: input.branch,
      image: input.image,
      autoDeploy: input.autoDeploy === false ? 'no' : 'yes',
      envVars: input.envVars,
      serviceDetails: {
        plan: input.plan,
        region: input.region,
        runtime: input.runtime,
        envSpecificDetails: {
          buildCommand: input.buildCommand,
          startCommand: input.startCommand,
        },
        ...extraDetails,
      },
    })
  }

  private requireOwnerId(): string {
    if (!this.ownerId) throw new RenderApiError(0, 'RENDER_OWNER_ID is not configured')
    return this.ownerId
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      throw new RenderApiError(0, `Render API unreachable: ${reason}`)
    }

    const text = await res.text()
    let parsed: unknown = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = text
      }
    }

    if (!res.ok) {
      const message =
        parsed &&
        typeof parsed === 'object' &&
        'message' in parsed &&
        typeof parsed.message === 'string'
          ? parsed.message
          : `Render API ${method} ${path} failed with ${res.status}`
      throw new RenderApiError(res.status, message, parsed)
    }

    return parsed as T
  }
}

/** App-wide client. Null when RENDER_API_KEY isn't set — callers must handle the unconfigured case. */
export const renderClient: RenderClient | null = env.RENDER_API_KEY
  ? new RenderClient({ apiKey: env.RENDER_API_KEY, ownerId: env.RENDER_OWNER_ID || undefined })
  : null
