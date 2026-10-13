import type { AgentType } from './agent.js'

/** Machine-executable form of a natural-language rule, produced by the rule compiler. */
export interface CompiledPolicy {
  version: 1
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
}

export interface Rule {
  id: string
  tenantId: string
  agentType: AgentType
  naturalLanguage: string
  compiledPolicy: CompiledPolicy | null
  enabled: boolean
  createdAt: string
}
