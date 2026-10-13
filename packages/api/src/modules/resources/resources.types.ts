import { z } from 'zod'

export {
  deployTriggerSchema,
  resourceCreateSchema,
  resourceUpdateSchema,
  secretsPutSchema,
  type DeployTriggerInput,
  type ResourceCreateInput,
  type ResourceUpdateInput,
  type SecretsPutInput,
} from '@clerk/shared'

export const tenantParamsSchema = z.object({
  tenantId: z.string().uuid(),
})

export const resourceParamsSchema = tenantParamsSchema.extend({
  resourceId: z.string().uuid(),
})

export type TenantParams = z.infer<typeof tenantParamsSchema>
export type ResourceParams = z.infer<typeof resourceParamsSchema>

/** Thrown when an operation isn't valid for the resource's current state (→ 409). */
export class ResourceConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResourceConflictError'
  }
}
