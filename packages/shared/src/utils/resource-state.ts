import { ResourceStatus } from '../types/resources.js'

/**
 * Resource lifecycle. Shared so the API (which starts transitions) and the Infra agent
 * (which completes them) agree on what's legal.
 *
 *   requested → provisioning → active ⇄ updating
 *                    ↓            ↓
 *                  failed  →  destroying → destroyed
 */
export const RESOURCE_TRANSITIONS: Readonly<Record<ResourceStatus, readonly ResourceStatus[]>> = {
  [ResourceStatus.Requested]: [ResourceStatus.Provisioning, ResourceStatus.Failed],
  [ResourceStatus.Provisioning]: [ResourceStatus.Active, ResourceStatus.Failed],
  [ResourceStatus.Active]: [ResourceStatus.Updating, ResourceStatus.Destroying],
  [ResourceStatus.Updating]: [ResourceStatus.Active, ResourceStatus.Failed],
  [ResourceStatus.Destroying]: [ResourceStatus.Destroyed, ResourceStatus.Failed],
  [ResourceStatus.Destroyed]: [],
  [ResourceStatus.Failed]: [ResourceStatus.Provisioning, ResourceStatus.Destroying],
}

export function canTransition(from: ResourceStatus, to: ResourceStatus): boolean {
  return RESOURCE_TRANSITIONS[from].includes(to)
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: ResourceStatus,
    readonly to: ResourceStatus,
  ) {
    super(`Cannot move resource from ${from} to ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function assertTransition(from: ResourceStatus, to: ResourceStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to)
}
