import {
  ResourceStatus,
  renderMonthlyCostCents,
  type Resource,
  type ResourceConfig,
  type ResourceType,
} from '@clerk/shared'

/** Statuses that no longer incur Render charges. */
const UNBILLED: ReadonlySet<ResourceStatus> = new Set([
  ResourceStatus.Destroyed,
  ResourceStatus.Failed,
])

export type CostInput = Pick<Resource, 'id' | 'type' | 'status'> & { config: ResourceConfig }

export interface TenantCost {
  totalCents: number
  byResource: Array<{ resourceId: string; type: ResourceType; monthlyCostCents: number }>
}

/** Monthly list price for one resource, from its type and plan (see shared render-pricing). */
export function calculateResourceCost(resource: CostInput): number {
  if (UNBILLED.has(resource.status)) return 0
  return renderMonthlyCostCents(resource.type, resource.config)
}

/** Monthly Render spend across a tenant's resources. Destroyed and failed resources are excluded. */
export function calculateTenantCost(resources: CostInput[]): TenantCost {
  const byResource = resources
    .filter((r) => !UNBILLED.has(r.status))
    .map((r) => ({ resourceId: r.id, type: r.type, monthlyCostCents: calculateResourceCost(r) }))
  return {
    totalCents: byResource.reduce((sum, r) => sum + r.monthlyCostCents, 0),
    byResource,
  }
}
