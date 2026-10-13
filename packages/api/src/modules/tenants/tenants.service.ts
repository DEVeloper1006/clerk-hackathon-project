import type { Tenant, TenantInput } from '@clerk/shared'

export async function getTenant(_tenantId: string): Promise<Tenant | null> {
  // TODO: implement — select the tenant row where id = tenantId.
  return null
}

export async function createTenant(_input: TenantInput): Promise<Tenant | null> {
  // TODO: implement — insert tenant, provision ES indices via ensureTenantIndices, seed agents from template.
  return null
}

export async function updateTenant(
  _tenantId: string,
  _input: Partial<TenantInput>,
): Promise<Tenant | null> {
  // TODO: implement — update tenant row where id = tenantId.
  return null
}

export async function deleteTenant(_tenantId: string): Promise<boolean> {
  // TODO: implement — delete tenant (cascades) and drop its ES indices.
  return false
}
