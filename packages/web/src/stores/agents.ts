import { create } from 'zustand'
import type { Agent, EventPayloads, EventType } from '@clerk/shared'

export type AgentActivity = EventPayloads[EventType.AgentAction] & { timestamp: string }

const MAX_ACTIVITY = 200

interface AgentsState {
  agents: Agent[]
  activity: AgentActivity[]
  setAgents: (agents: Agent[]) => void
  pushActivity: (entry: AgentActivity) => void
}

export const useAgentsStore = create<AgentsState>()((set) => ({
  agents: [],
  activity: [],
  setAgents: (agents) => set({ agents }),
  pushActivity: (entry) =>
    set((state) => ({ activity: [entry, ...state.activity].slice(0, MAX_ACTIVITY) })),
}))
