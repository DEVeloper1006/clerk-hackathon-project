import { create } from 'zustand'
import type { Tenant } from '@clerk/shared'

interface TenantState {
  tenant: Tenant | null
  setTenant: (tenant: Tenant | null) => void
}

export const useTenantStore = create<TenantState>()((set) => ({
  tenant: null,
  setTenant: (tenant) => set({ tenant }),
}))
