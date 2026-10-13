import { Client } from '@elastic/elasticsearch'
import { EventType, type AgentType, type ClerkEvent, type EventPayloads } from '@clerk/shared'
import { env } from '../config/env.js'
import { bus } from './bus.js'
import { invalidateTenantContext, loadTenantContext, type TenantContext } from './context.js'
import { llm, type LlmMessage, type LlmOptions } from './llm.js'

const elastic = new Client({ node: env.ELASTICSEARCH_URL })

/**
 * Base class for every Clerk agent.
 * Subclasses declare which events they care about and implement `handle`.
 * All errors are caught and logged — a bad event must never crash the worker.
 */
export abstract class BaseAgent {
  abstract readonly type: AgentType
  abstract readonly subscriptions: EventType[]

  private running = false

  async start(): Promise<void> {
    this.running = true
    for (const type of this.subscriptions) {
      await bus.subscribe(type, (event) => this.dispatch(event))
    }
    // Every agent drops cached rules when they change.
    await bus.subscribe(EventType.RuleUpdated, async (event) => {
      invalidateTenantContext(event.tenantId)
    })
    console.log(`[${this.type}] started — listening for ${this.subscriptions.join(', ')}`)
  }

  async stop(): Promise<void> {
    this.running = false
    console.log(`[${this.type}] stopped`)
  }

  protected abstract handle(event: ClerkEvent, context: TenantContext): Promise<void>

  protected loadContext(tenantId: string): Promise<TenantContext> {
    return loadTenantContext(tenantId, this.type)
  }

  protected callLlm(messages: LlmMessage[], options?: LlmOptions): Promise<string> {
    return llm.complete(messages, options)
  }

  /** Logs an action to `{tenantId}-agent-events` and publishes it for the dashboard. */
  protected async logAction(
    tenantId: string,
    action: string,
    detail: Record<string, unknown> = {},
  ): Promise<void> {
    const payload: EventPayloads[EventType.AgentAction] = { agentType: this.type, action, detail }
    await Promise.allSettled([
      elastic.index({
        index: `${tenantId.toLowerCase()}-agent-events`,
        document: { tenantId, ...payload, timestamp: new Date().toISOString() },
      }),
      bus.publish(tenantId, EventType.AgentAction, payload),
    ])
  }

  private async dispatch(event: ClerkEvent): Promise<void> {
    if (!this.running) return
    try {
      const context = await this.loadContext(event.tenantId)
      await this.handle(event, context)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${this.type}] failed on ${event.type}:`, message)
      await this.logAction(event.tenantId, 'error', { eventType: event.type, message })
    }
  }
}
