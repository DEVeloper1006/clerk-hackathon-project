import {
  DeployStatus,
  ResourceStatus,
  assertTransition,
  canTransition,
  type Resource,
  type ResourceConfig,
  type ResourceType,
} from '@clerk/shared'
import { query } from '../core/context.js'

export { assertTransition, canTransition }

export type ProvisionOutcome = { ok: true; renderServiceId: string } | { ok: false; reason: string }

interface ResourceRow {
  id: string
  type: ResourceType
  name: string
  status: ResourceStatus
  render_service_id: string | null
  config: ResourceConfig
}

const NOT_IMPLEMENTED = 'Render provisioning not implemented'

// ─── Persistence (every statement scopes by tenant_id) ──────

export async function loadResource(
  tenantId: string,
  resourceId: string,
): Promise<ResourceRow | null> {
  const rows = await query<ResourceRow>(
    `SELECT id, type, name, status, render_service_id, config
       FROM resources WHERE tenant_id = $1 AND id = $2`,
    [tenantId, resourceId],
  )
  return rows[0] ?? null
}

export async function loadTenantResources(
  tenantId: string,
): Promise<Array<Pick<Resource, 'id' | 'type' | 'status' | 'config'>>> {
  return query(`SELECT id, type, status, config FROM resources WHERE tenant_id = $1`, [tenantId])
}

async function recordInfraEvent(
  tenantId: string,
  resourceId: string | null,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await query(
    `INSERT INTO infra_events (tenant_id, resource_id, event_type, payload) VALUES ($1, $2, $3, $4)`,
    [tenantId, resourceId, eventType, JSON.stringify(payload)],
  )
}

/**
 * Moves a resource from `from` to `to`. The UPDATE is guarded on the current status, so a
 * duplicate or stale event is a no-op (returns false) rather than a double transition.
 */
export async function transitionResource(
  tenantId: string,
  resourceId: string,
  from: ResourceStatus,
  to: ResourceStatus,
  patch: { renderServiceId?: string } = {},
): Promise<boolean> {
  assertTransition(from, to)
  const rows = await query<{ id: string }>(
    `UPDATE resources
        SET status = $4,
            render_service_id = COALESCE($5, render_service_id),
            updated_at = now()
      WHERE tenant_id = $1 AND id = $2 AND status = $3
      RETURNING id`,
    [tenantId, resourceId, from, to, patch.renderServiceId ?? null],
  )
  if (rows.length === 0) return false
  await recordInfraEvent(tenantId, resourceId, 'resource.status_changed', { from, to, ...patch })
  return true
}

export async function setDeploymentStatus(
  tenantId: string,
  deploymentId: string,
  status: DeployStatus,
  patch: { renderDeployId?: string; buildLog?: string } = {},
): Promise<void> {
  await query(
    `UPDATE deployments
        SET status = $3,
            render_deploy_id = COALESCE($4, render_deploy_id),
            build_log = COALESCE($5, build_log)
      WHERE tenant_id = $1 AND id = $2`,
    [tenantId, deploymentId, status, patch.renderDeployId ?? null, patch.buildLog ?? null],
  )
}

// ─── Render calls (stubbed) ─────────────────────────────────
// TODO(dev): agents can't import packages/api/src/integrations/render.ts. Move RenderClient into
// @clerk/shared (it only needs fetch) or give agents a copy, then replace these stubs.

async function provisionOnRender(
  _tenantId: string,
  _resource: ResourceRow,
): Promise<string | null> {
  // TODO: implement — switch on resource.type → createWebService/createWorker/createCronJob/createPostgres/createKeyValue, named via renderResourceName(tenantId, resource.name).
  return null
}

async function destroyOnRender(_tenantId: string, _resource: ResourceRow): Promise<boolean> {
  // TODO: implement — deleteService or deletePostgresDb by resource.render_service_id; treat 404 as already gone.
  return false
}

async function deployOnRender(
  _tenantId: string,
  _renderServiceId: string,
  _commitHash: string | null,
): Promise<string | null> {
  // TODO: implement — renderClient.triggerDeploy(serviceId, { commitId }) and return the deploy id.
  return null
}

// ─── Lifecycle operations ───────────────────────────────────

/** requested → provisioning → active | failed */
export async function provision(tenantId: string, resourceId: string): Promise<ProvisionOutcome> {
  const resource = await loadResource(tenantId, resourceId)
  if (!resource) return { ok: false, reason: 'Resource not found' }
  if (!canTransition(resource.status, ResourceStatus.Provisioning)) {
    return { ok: false, reason: `Cannot provision a ${resource.status} resource` }
  }
  const claimed = await transitionResource(
    tenantId,
    resourceId,
    resource.status,
    ResourceStatus.Provisioning,
  )
  if (!claimed) return { ok: false, reason: 'Resource already being handled' }

  let renderServiceId: string | null = null
  let reason = NOT_IMPLEMENTED
  try {
    renderServiceId = await provisionOnRender(tenantId, resource)
  } catch (err) {
    reason = err instanceof Error ? err.message : String(err)
  }

  if (!renderServiceId) {
    await transitionResource(
      tenantId,
      resourceId,
      ResourceStatus.Provisioning,
      ResourceStatus.Failed,
    )
    return { ok: false, reason }
  }
  await transitionResource(
    tenantId,
    resourceId,
    ResourceStatus.Provisioning,
    ResourceStatus.Active,
    {
      renderServiceId,
    },
  )
  return { ok: true, renderServiceId }
}

/** destroying → destroyed | failed. Resources never provisioned on Render are destroyed immediately. */
export async function destroy(
  tenantId: string,
  resourceId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const resource = await loadResource(tenantId, resourceId)
  if (!resource) return { ok: false, reason: 'Resource not found' }
  if (resource.status !== ResourceStatus.Destroying) {
    return { ok: false, reason: `Expected destroying, found ${resource.status}` }
  }

  let removed = resource.render_service_id === null
  let reason = NOT_IMPLEMENTED
  if (!removed) {
    try {
      removed = await destroyOnRender(tenantId, resource)
    } catch (err) {
      reason = err instanceof Error ? err.message : String(err)
    }
  }

  const to = removed ? ResourceStatus.Destroyed : ResourceStatus.Failed
  await transitionResource(tenantId, resourceId, ResourceStatus.Destroying, to)
  return removed ? { ok: true } : { ok: false, reason }
}

/** Deployment: created → building → live | failed */
export async function deploy(
  tenantId: string,
  resourceId: string,
  deploymentId: string,
  commitHash: string | null,
): Promise<{ ok: true; renderDeployId: string } | { ok: false; reason: string }> {
  const resource = await loadResource(tenantId, resourceId)
  const fail = async (reason: string) => {
    await setDeploymentStatus(tenantId, deploymentId, DeployStatus.Failed, { buildLog: reason })
    return { ok: false as const, reason }
  }
  if (!resource) return fail('Resource not found')
  if (resource.status !== ResourceStatus.Active || !resource.render_service_id) {
    return fail(`Resource is not active on Render (status: ${resource.status})`)
  }

  await setDeploymentStatus(tenantId, deploymentId, DeployStatus.Building)
  let renderDeployId: string | null = null
  let reason = NOT_IMPLEMENTED
  try {
    renderDeployId = await deployOnRender(tenantId, resource.render_service_id, commitHash)
  } catch (err) {
    reason = err instanceof Error ? err.message : String(err)
  }
  if (!renderDeployId) return fail(reason)

  // TODO: implement — poll getDeploy until live/failed (Render returns immediately with "created").
  await setDeploymentStatus(tenantId, deploymentId, DeployStatus.Live, { renderDeployId })
  return { ok: true, renderDeployId }
}
