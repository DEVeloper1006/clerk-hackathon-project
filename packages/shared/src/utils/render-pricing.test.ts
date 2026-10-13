import { describe, expect, it } from 'vitest'
import { ResourceType } from '../types/resources.js'
import { renderMonthlyCostCents } from './render-pricing.js'

describe('renderMonthlyCostCents', () => {
  it('uses the default plan when none is given', () => {
    expect(renderMonthlyCostCents(ResourceType.WebService)).toBe(700)
  })

  it('normalizes plan names', () => {
    expect(renderMonthlyCostCents(ResourceType.Postgres, { plan: 'Basic-1GB' })).toBe(1900)
  })

  it('falls back to the default plan for unknown plans', () => {
    expect(renderMonthlyCostCents(ResourceType.KeyValue, { plan: 'mystery' })).toBe(1000)
  })

  it('prices static sites at zero', () => {
    expect(renderMonthlyCostCents(ResourceType.StaticSite)).toBe(0)
  })
})
