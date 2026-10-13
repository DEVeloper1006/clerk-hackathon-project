export enum ResourceType {
  WebService = 'web_service',
  Worker = 'worker',
  CronJob = 'cron_job',
  Postgres = 'postgres',
  KeyValue = 'key_value',
  StaticSite = 'static_site',
}

export enum ResourceStatus {
  Requested = 'requested',
  Provisioning = 'provisioning',
  Active = 'active',
  Updating = 'updating',
  Destroying = 'destroying',
  Destroyed = 'destroyed',
  Failed = 'failed',
}

export enum DeployStatus {
  Created = 'created',
  Building = 'building',
  Live = 'live',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export const RESOURCE_TYPES = Object.values(ResourceType)
export const RESOURCE_STATUSES = Object.values(ResourceStatus)
export const DEPLOY_STATUSES = Object.values(DeployStatus)

/** Type-specific settings (plan, region, repo, start command, schedule, …). */
export interface ResourceConfig {
  plan?: string
  region?: string
  [key: string]: unknown
}

export interface Resource {
  id: string
  tenantId: string
  type: ResourceType
  name: string
  /** Render service / database id once provisioned. */
  renderServiceId: string | null
  status: ResourceStatus
  config: ResourceConfig
  monthlyCostCents: number
  createdAt: string
  updatedAt: string
}

export interface Deployment {
  id: string
  tenantId: string
  resourceId: string
  renderDeployId: string | null
  status: DeployStatus
  commitHash: string | null
  buildLog: string | null
  createdAt: string
}

/** Secret metadata only — decrypted values never leave the API. */
export interface TenantSecret {
  id: string
  tenantId: string
  resourceId: string
  key: string
  createdAt: string
}

export interface InfraEvent {
  id: string
  tenantId: string
  resourceId: string | null
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}
