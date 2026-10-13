import { AgentType, EventType, type ClerkEvent } from '@clerk/shared'
import { BaseAgent } from '../core/base-agent.js'
import { bus } from '../core/bus.js'
import type { TenantContext } from '../core/context.js'
import { calculateTenantCost } from './cost-tracker.js'
import { deploy, destroy, loadTenantResources, provision } from './provisioner.js'

/**
 * Alert when monthly infra spend exceeds this share of the projected balance.
 * TODO(dev): make this a per-tenant rule ("warn me when hosting is over 10% of cash").
 */
const COST_ALERT_RATIO = 0.1

export class InfraAgent extends BaseAgent {
  readonly type = AgentType.Infra
  readonly subscriptions = [
    EventType.ResourceRequested,
    EventType.ResourceDestroyed,
    EventType.DeploymentTriggered,
    EventType.ForecastUpdated,
    EventType.ResourceCostAlert,
  ]

  protected async handle(event: ClerkEvent, _context: TenantContext): Promise<void> {
    const { tenantId } = event

    switch (event.type) {
      case EventType.ResourceRequested: {
        const { resourceId } = event.payload
        const outcome = await provision(tenantId, resourceId)
        if (outcome.ok) {
          await bus.publish(tenantId, EventType.ResourceProvisioned, {
            resourceId,
            renderServiceId: outcome.renderServiceId,
          })
        } else {
          await bus.publish(tenantId, EventType.ResourceFailed, {
            resourceId,
            reason: outcome.reason,
          })
        }
        await this.logAction(tenantId, outcome.ok ? 'resource.provisioned' : 'resource.failed', {
          resourceId,
          ...outcome,
        })
        return
      }

      case EventType.ResourceDestroyed: {
        const { resourceId } = event.payload
        const outcome = await destroy(tenantId, resourceId)
        if (!outcome.ok) {
          await bus.publish(tenantId, EventType.ResourceFailed, {
            resourceId,
            reason: outcome.reason ?? 'Teardown failed',
          })
        }
        await this.logAction(
          tenantId,
          outcome.ok ? 'resource.destroyed' : 'resource.destroy_failed',
          {
            resourceId,
            ...outcome,
          },
        )
        return
      }

      case EventType.DeploymentTriggered: {
        const { deploymentId, resourceId, commitHash } = event.payload
        const outcome = await deploy(tenantId, resourceId, deploymentId, commitHash)
        if (outcome.ok) {
          await bus.publish(tenantId, EventType.DeploymentCompleted, {
            deploymentId,
            resourceId,
            renderDeployId: outcome.renderDeployId,
          })
        } else {
          await bus.publish(tenantId, EventType.DeploymentFailed, {
            deploymentId,
            resourceId,
            reason: outcome.reason,
          })
        }
        await this.logAction(tenantId, outcome.ok ? 'deployment.completed' : 'deployment.failed', {
          deploymentId,
          resourceId,
          ...outcome,
        })
        return
      }

      case EventType.ForecastUpdated: {
        const { projectedBalance, currency } = event.payload
        const cost = calculateTenantCost(await loadTenantResources(tenantId))
        // projectedBalance is in major units; costs are in cents.
        const thresholdCents = Math.max(0, Math.round(projectedBalance * 100 * COST_ALERT_RATIO))
        if (cost.totalCents > 0 && cost.totalCents > thresholdCents) {
          await bus.publish(tenantId, EventType.ResourceCostAlert, {
            monthlyCostCents: cost.totalCents,
            thresholdCents,
            projectedBalance,
            currency,
          })
        }
        return
      }

      case EventType.ResourceCostAlert: {
        // Log only — re-publishing here would loop on our own alert.
        // TODO: implement — notify via Zapier (Slack/email) once the integration is wired.
        await this.logAction(tenantId, 'cost.alert', { ...event.payload })
        return
      }

      default:
        return
    }
  }
}
