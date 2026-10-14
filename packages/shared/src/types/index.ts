// Placeholder domain types. Flesh these out alongside the Drizzle schema.

export * from './events.js';

export type AgentType = 'transactions' | 'invoicing' | 'payouts' | 'infra';

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  tenantId: string;
  type: AgentType;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentConfig {
  id: string;
  tenantId: string;
  agentId: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Secret {
  id: string;
  tenantId: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}
