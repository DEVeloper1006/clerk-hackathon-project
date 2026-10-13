import { AGENT_TYPES, AgentType } from '@clerk/shared'
import { env } from './config/env.js'
import type { BaseAgent } from './core/base-agent.js'
import { bus } from './core/bus.js'
import { closeContextPool } from './core/context.js'
import { CommerceAgent } from './commerce/index.js'
import { GrowthAgent } from './growth/index.js'
import { SentinelAgent } from './sentinel/index.js'
import { TreasuryAgent } from './treasury/index.js'

const factories: Record<AgentType, () => BaseAgent> = {
  [AgentType.Sentinel]: () => new SentinelAgent(),
  [AgentType.Treasury]: () => new TreasuryAgent(),
  [AgentType.Commerce]: () => new CommerceAgent(),
  [AgentType.Growth]: () => new GrowthAgent(),
}

// AGENTS="sentinel,growth" runs a subset (one pod per agent on Astropods); empty runs all four.
const selected = env.AGENTS
  ? env.AGENTS.split(',')
      .map((s) => s.trim())
      .filter((s): s is AgentType => (AGENT_TYPES as string[]).includes(s))
  : AGENT_TYPES

const agents = selected.map((type) => factories[type]())

console.log(`[worker] starting agents: ${selected.join(', ')}`)
await Promise.all(agents.map((agent) => agent.start()))

const shutdown = async (signal: string) => {
  console.log(`[worker] ${signal} received, shutting down`)
  await Promise.allSettled(agents.map((agent) => agent.stop()))
  await Promise.allSettled([bus.close(), closeContextPool()])
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
