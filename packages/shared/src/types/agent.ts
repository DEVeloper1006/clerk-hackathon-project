export enum AgentType {
  Sentinel = 'sentinel',
  Treasury = 'treasury',
  Commerce = 'commerce',
  Growth = 'growth',
}

export const AGENT_TYPES = Object.values(AgentType)

export interface Agent {
  id: string
  tenantId: string
  type: AgentType
  enabled: boolean
  config: Record<string, unknown>
  createdAt: string
}
