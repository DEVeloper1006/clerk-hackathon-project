import type { AgentType } from './agent.js'
import type { Transaction } from './transaction.js'

export enum EventType {
  TransactionCreated = 'transaction.created',
  TransactionUpdated = 'transaction.updated',
  TransactionScored = 'transaction.scored',
  DisputeOpened = 'dispute.opened',
  RefundRequested = 'refund.requested',
  PayoutScheduled = 'payout.scheduled',
  ForecastUpdated = 'forecast.updated',
  InsightGenerated = 'insight.generated',
  AgentAction = 'agent.action',
  RuleUpdated = 'rule.updated',
}

export interface EventPayloads {
  [EventType.TransactionCreated]: { transaction: Transaction }
  [EventType.TransactionUpdated]: { transaction: Transaction }
  [EventType.TransactionScored]: { transactionId: string; riskScore: number; reasons: string[] }
  [EventType.DisputeOpened]: { disputeId: string; transactionId: string; reason: string }
  [EventType.RefundRequested]: { transactionId: string; amount: number; reason: string }
  [EventType.PayoutScheduled]: {
    payoutId: string
    amount: number
    currency: string
    scheduledFor: string
  }
  [EventType.ForecastUpdated]: { horizonDays: number; projectedBalance: number; currency: string }
  [EventType.InsightGenerated]: { title: string; summary: string; data?: Record<string, unknown> }
  [EventType.AgentAction]: {
    agentType: AgentType
    action: string
    detail: Record<string, unknown>
  }
  [EventType.RuleUpdated]: { ruleId: string; agentType: AgentType }
}

export interface ClerkEventEnvelope<T extends EventType = EventType> {
  type: T
  tenantId: string
  timestamp: string
  payload: EventPayloads[T]
}

/** Discriminated union of every event that can travel on the bus. */
export type ClerkEvent = { [K in EventType]: ClerkEventEnvelope<K> }[EventType]

/** Redis channel for a tenant-scoped event. Always includes the tenant id. */
export const eventChannel = (tenantId: string, type: EventType): string =>
  `clerk:${tenantId}:${type}`

/** Pattern matching one event type across all tenants (for psubscribe). */
export const eventPattern = (type: EventType): string => `clerk:*:${type}`
