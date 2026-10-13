import { and, desc, eq } from 'drizzle-orm'
import {
  DeployStatus,
  EventType,
  InvalidTransitionError,
  ResourceStatus,
  ResourceType,
  assertTransition,
  renderMonthlyCostCents,
  type Deployment,
  type EventPayloads,
  type Resource,
  type TenantSecret,
} from '@clerk/shared'
import { db } from '../../config/db.js'
import { deployments, infraEvents, resources, secrets } from '../../db/schema.js'
import { bus } from '../../events/bus.js'
import { encryptSecret } from '../../utils/crypto.js'
import {
  ResourceConflictError,
  type DeployTriggerInput,
  type ResourceCreateInput,
  type ResourceUpdateInput,
  type SecretsPutInput,
} from './resources.types.js'

type ResourceRow = typeof resources.$inferSelect
type DeploymentRow = typeof deployments.$inferSelect

/** Datastores are managed by Render directly — there's nothing to "deploy". */
const DEPLOYABLE_TYPES: ReadonlySet<ResourceType> = new Set([
  ResourceType.WebService,
  ResourceType.Worker,
  ResourceType.CronJob,
  ResourceType.StaticSite,
])

const toResource = (row: ResourceRow): Resource => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const toDeployment = (row: DeploymentRow): Deployment => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
})

/** Audit row in infra_events + publish on the bus. Publish isn't awaited so a Redis outage can't hang a request. */
async function emit<T extends EventType>(
  tenantId: string,
  resourceId: string | null,
  type: T,
  payload: EventPayloads[T],
): Promise<void> {
  await db.insert(infraEvents).values({ tenantId, resourceId, eventType: type, payload })
  bus.publish(tenantId, type, payload).catch((err: unknown) => {
    console.error(`[resources] failed to publish ${type}:`, err)
  })
}

async function findResourceRow(tenantId: string, resourceId: string): Promise<ResourceRow | null> {
  const [row] = await db
    .select()
    .from(resources)
    .where(and(eq(resources.tenantId, tenantId), eq(resources.id, resourceId)))
    .limit(1)
  return row ?? null
}

// ─── Resources ──────────────────────────────────────────────

export async function listResources(tenantId: string): Promise<Resource[]> {
  const rows = await db
    .select()
    .from(resources)
    .where(eq(resources.tenantId, tenantId))
    .orderBy(desc(resources.createdAt))
  return rows.map(toResource)
}

export async function getResource(tenantId: string, resourceId: string): Promise<Resource | null> {
  const row = await findResourceRow(tenantId, resourceId)
  return row ? toResource(row) : null
}

export async function createResource(
  tenantId: string,
  input: ResourceCreateInput,
): Promise<Resource> {
  const [row] = await db
    .insert(resources)
    .values({
      tenantId,
      type: input.type,
      name: input.name,
      config: input.config,
      status: ResourceStatus.Requested,
      monthlyCostCents: renderMonthlyCostCents(input.type, input.config),
    })
    .returning()
  if (!row) throw new Error('Failed to insert resource')

  await emit(tenantId, row.id, EventType.ResourceRequested, {
    resourceId: row.id,
    type: row.type,
    name: row.name,
    config: row.config,
  })
  return toResource(row)
}

export async function updateResource(
  tenantId: string,
  resourceId: string,
  input: ResourceUpdateInput,
): Promise<Resource | null> {
  const existing = await findResourceRow(tenantId, resourceId)
  if (!existing) return null
  if (
    existing.status === ResourceStatus.Destroying ||
    existing.status === ResourceStatus.Destroyed
  ) {
    throw new ResourceConflictError(`Resource is ${existing.status}`)
  }

  const config = input.config ?? existing.config
  // TODO(dev): pushing config changes to Render needs a resource.update event + active→updating→active in the Infra agent.
  const [row] = await db
    .update(resources)
    .set({
      name: input.name ?? existing.name,
      config,
      monthlyCostCents: renderMonthlyCostCents(existing.type, config),
    })
    .where(and(eq(resources.tenantId, tenantId), eq(resources.id, resourceId)))
    .returning()
  return row ? toResource(row) : null
}

/** Marks the resource `destroying` and hands teardown to the Infra agent. */
export async function requestDestroy(
  tenantId: string,
  resourceId: string,
): Promise<Resource | null> {
  const existing = await findResourceRow(tenantId, resourceId)
  if (!existing) return null
  try {
    assertTransition(existing.status, ResourceStatus.Destroying)
  } catch (err) {
    if (err instanceof InvalidTransitionError) throw new ResourceConflictError(err.message)
    throw err
  }

  const [row] = await db
    .update(resources)
    .set({ status: ResourceStatus.Destroying })
    .where(
      and(
        eq(resources.tenantId, tenantId),
        eq(resources.id, resourceId),
        eq(resources.status, existing.status),
      ),
    )
    .returning()
  if (!row) throw new ResourceConflictError('Resource changed state, try again')

  // TODO(dev): event is named resource.destroyed per spec but means "destroy requested" — consider resource.destroy_requested.
  await emit(tenantId, row.id, EventType.ResourceDestroyed, {
    resourceId: row.id,
    renderServiceId: row.renderServiceId,
  })
  return toResource(row)
}

// ─── Deployments ────────────────────────────────────────────

export async function listDeployments(
  tenantId: string,
  resourceId: string,
): Promise<Deployment[] | null> {
  if (!(await findResourceRow(tenantId, resourceId))) return null
  const rows = await db
    .select()
    .from(deployments)
    .where(and(eq(deployments.tenantId, tenantId), eq(deployments.resourceId, resourceId)))
    .orderBy(desc(deployments.createdAt))
  return rows.map(toDeployment)
}

export async function triggerDeploy(
  tenantId: string,
  resourceId: string,
  input: DeployTriggerInput,
): Promise<Deployment | null> {
  const resource = await findResourceRow(tenantId, resourceId)
  if (!resource) return null
  if (!DEPLOYABLE_TYPES.has(resource.type)) {
    throw new ResourceConflictError(`${resource.type} resources can't be deployed`)
  }
  if (resource.status !== ResourceStatus.Active) {
    throw new ResourceConflictError(`Resource must be active to deploy (is ${resource.status})`)
  }

  const [row] = await db
    .insert(deployments)
    .values({
      tenantId,
      resourceId,
      status: DeployStatus.Created,
      commitHash: input.commitHash ?? null,
    })
    .returning()
  if (!row) throw new Error('Failed to insert deployment')

  await emit(tenantId, resourceId, EventType.DeploymentTriggered, {
    deploymentId: row.id,
    resourceId,
    commitHash: row.commitHash,
  })
  return toDeployment(row)
}

// ─── Secrets ────────────────────────────────────────────────

/** Keys and timestamps only — decrypted values are never returned. */
export async function listSecrets(
  tenantId: string,
  resourceId: string,
): Promise<TenantSecret[] | null> {
  if (!(await findResourceRow(tenantId, resourceId))) return null
  const rows = await db
    .select({
      id: secrets.id,
      tenantId: secrets.tenantId,
      resourceId: secrets.resourceId,
      key: secrets.key,
      createdAt: secrets.createdAt,
    })
    .from(secrets)
    .where(and(eq(secrets.tenantId, tenantId), eq(secrets.resourceId, resourceId)))
    .orderBy(secrets.key)
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
}

/** Upserts the given secrets (encrypted at rest). Keys not in the request are left alone. */
export async function putSecrets(
  tenantId: string,
  resourceId: string,
  input: SecretsPutInput,
): Promise<TenantSecret[] | null> {
  const resource = await findResourceRow(tenantId, resourceId)
  if (!resource) return null
  if (
    resource.status === ResourceStatus.Destroying ||
    resource.status === ResourceStatus.Destroyed
  ) {
    throw new ResourceConflictError(`Resource is ${resource.status}`)
  }

  const values = input.secrets.map(({ key, value }) => ({
    tenantId,
    resourceId,
    key,
    encryptedValue: encryptSecret(value),
  }))

  await db.transaction(async (tx) => {
    for (const value of values) {
      await tx
        .insert(secrets)
        .values(value)
        .onConflictDoUpdate({
          target: [secrets.tenantId, secrets.resourceId, secrets.key],
          set: { encryptedValue: value.encryptedValue },
        })
    }
    await tx.insert(infraEvents).values({
      tenantId,
      resourceId,
      eventType: 'secrets.updated',
      payload: { keys: input.secrets.map((s) => s.key) },
    })
  })
  // TODO: implement — sync decrypted values to Render via renderClient.setEnvVars once the resource is active.

  return listSecrets(tenantId, resourceId)
}
