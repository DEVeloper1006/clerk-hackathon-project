import { describe, expect, it } from 'vitest'
import { ResourceStatus as S } from '../types/resources.js'
import { InvalidTransitionError, assertTransition, canTransition } from './resource-state.js'

describe('resource state machine', () => {
  it.each([
    [S.Requested, S.Provisioning],
    [S.Provisioning, S.Active],
    [S.Provisioning, S.Failed],
    [S.Active, S.Updating],
    [S.Updating, S.Active],
    [S.Active, S.Destroying],
    [S.Destroying, S.Destroyed],
    [S.Failed, S.Provisioning],
    [S.Failed, S.Destroying],
  ])('allows %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each([
    [S.Requested, S.Active],
    [S.Active, S.Provisioning],
    [S.Destroyed, S.Provisioning],
    [S.Destroyed, S.Active],
    [S.Provisioning, S.Destroying],
  ])('blocks %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })

  it('treats destroyed as terminal', () => {
    for (const to of Object.values(S)) expect(canTransition(S.Destroyed, to)).toBe(false)
  })

  it('assertTransition throws a typed error', () => {
    expect(() => assertTransition(S.Requested, S.Active)).toThrow(InvalidTransitionError)
  })
})
