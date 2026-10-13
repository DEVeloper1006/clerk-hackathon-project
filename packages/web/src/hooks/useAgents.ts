import { useEffect, useState } from 'react'
import type { Agent } from '@clerk/shared'
import { api } from '../lib/api'
import { useAgentsStore } from '../stores/agents'

export function useAgents() {
  const agents = useAgentsStore((s) => s.agents)
  const setAgents = useAgentsStore((s) => s.setAgents)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: implement — add start/stop/update mutations that call /api/agents/:id/*.
    let cancelled = false
    void api<Agent[]>('/api/agents').then((res) => {
      if (cancelled) return
      if (res.success) setAgents(res.data ?? [])
      else setError(res.error ?? 'Failed to load agents')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [setAgents])

  return { agents, loading, error }
}
