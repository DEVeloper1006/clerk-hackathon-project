import { describe, expect, it } from 'vitest'
import { ResourceStatus, ResourceType } from '@clerk/shared'
import { calculateResourceCost, calculateTenantCost, type CostInput } from './cost-tracker.js'

const resource = (overrides: Partial<CostInput>): CostInput => ({
  id: 'r1',
  type: ResourceType.WebService,
  status: ResourceStatus.Active,
  config: {},
  ...overrides,
})

describe('cost tracker', () => {
  it('prices a resource from its plan', () => {
    expect(calculateResourceCost(resource({ config: { plan: 'standard' } }))).toBe(2500)
  })

  it('sums active resources and skips destroyed/failed ones', () => {
    const cost = calculateTenantCost([
      resource({ id: 'web', config: { plan: 'starter' } }),
      resource({ id: 'db', type: ResourceType.Postgres, config: { plan: 'basic_1gb' } }),
      resource({ id: 'gone', status: ResourceStatus.Destroyed }),
      resource({ id: 'broken', status: ResourceStatus.Failed }),
    ])
    expect(cost.totalCents).toBe(700 + 1900)
    expect(cost.byResource.map((r) => r.resourceId)).toEqual(['web', 'db'])
  })

  it('returns zero for no resources', () => {
    expect(calculateTenantCost([])).toEqual({ totalCents: 0, byResource: [] })
  })
})
