import type { Agent, AgentInput } from '@clerk/shared'

export async function listAgents(_tenantId: string): Promise<Agent[]> {
  // TODO: implement — select agents where tenant_id = tenantId.
  return []
}

export async function getAgent(_tenantId: string, _agentId: string): Promise<Agent | null> {
  // TODO: implement — select agent where id = agentId and tenant_id = tenantId.
  return null
}

export async function createAgent(_tenantId: string, _input: AgentInput): Promise<Agent | null> {
  // TODO: implement — insert agent row for the tenant.
  return null
}

export async function updateAgent(
  _tenantId: string,
  _agentId: string,
  _input: Partial<AgentInput>,
): Promise<Agent | null> {
  // TODO: implement — update agent row scoped by tenant_id.
  return null
}

export async function deleteAgent(_tenantId: string, _agentId: string): Promise<boolean> {
  // TODO: implement — delete agent row scoped by tenant_id.
  return false
}

export async function setAgentRunning(
  _tenantId: string,
  _agentId: string,
  _running: boolean,
): Promise<boolean> {
  // TODO: implement — flip enabled flag and publish a control event so the worker picks it up.
  return false
}
