import { z } from 'zod'
import { AgentType } from '../types/agent.js'

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

export type TenantInput = z.infer<typeof tenantSchema>
export type AgentInput = z.infer<typeof agentSchema>
export type RuleInput = z.infer<typeof ruleSchema>
