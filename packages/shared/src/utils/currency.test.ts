import { describe, expect, it } from 'vitest'
import { formatCurrency } from './currency.js'

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
  })

  it('formats other currencies', () => {
    expect(formatCurrency(10, 'EUR', 'en-US')).toBe('€10.00')
  })
})
