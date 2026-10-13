import type { Resource } from '@clerk/shared'

export interface ResourceHealth {
  resourceId: string
  healthy: boolean
  checkedAt: string
  detail: string
}

export async function checkResourceHealth(
  _tenantId: string,
  resource: Pick<Resource, 'id' | 'renderServiceId' | 'status'>,
): Promise<ResourceHealth> {
  // TODO: implement — poll Render getService/getDeploy (or getPostgresDb) for resource.renderServiceId and map to healthy/unhealthy.
  return {
    resourceId: resource.id,
    healthy: resource.status === 'active',
    checkedAt: new Date().toISOString(),
    detail: 'Health polling not implemented; derived from stored status',
  }
}
