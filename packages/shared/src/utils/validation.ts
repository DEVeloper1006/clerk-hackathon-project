import { z } from 'zod'
import { AgentType } from '../types/agent.js'
import { ResourceType } from '../types/resources.js'

export const industrySchema = z.enum(['freelancer', 'ecommerce', 'agency', 'other'])
export const agentTypeSchema = z.nativeEnum(AgentType)

export const tenantSchema = z.object({
  name: z.string().min(1).max(200),
  industry: industrySchema,
})

export const agentSchema = z.object({
  type: agentTypeSchema,
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).default({}),
})

export const ruleSchema = z.object({
  agentType: agentTypeSchema,
  naturalLanguage: z.string().min(1).max(2000),
  enabled: z.boolean().default(true),
})

export const resourceTypeSchema = z.nativeEnum(ResourceType)

const resourceConfigSchema = z
  .object({
    plan: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
  })
  .catchall(z.unknown())

export const resourceCreateSchema = z.object({
  type: resourceTypeSchema,
  name: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/, 'Use letters, numbers, spaces, dashes, underscores'),
  config: resourceConfigSchema.default({}),
})

export const resourceUpdateSchema = z
  .object({
    name: resourceCreateSchema.shape.name.optional(),
    config: resourceConfigSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.config !== undefined, 'Nothing to update')

export const deployTriggerSchema = z.object({
  commitHash: z
    .string()
    .regex(/^[0-9a-f]{7,40}$/i)
    .optional(),
})

export const secretsPutSchema = z.object({
  secrets: z
    .array(
      z.object({
        key: z
          .string()
          .regex(/^[A-Z_][A-Z0-9_]*$/, 'Use UPPER_SNAKE_CASE keys')
          .max(200),
        value: z.string().max(10_000),
      }),
    )
    .min(1)
    .max(100),
})

export type TenantInput = z.infer<typeof tenantSchema>
export type AgentInput = z.infer<typeof agentSchema>
export type RuleInput = z.infer<typeof ruleSchema>
export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>
export type DeployTriggerInput = z.infer<typeof deployTriggerSchema>
export type SecretsPutInput = z.infer<typeof secretsPutSchema>
