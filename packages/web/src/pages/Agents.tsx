import Badge from '../components/common/Badge'
import Card from '../components/common/Card'
import Spinner from '../components/common/Spinner'
import { useAgents } from '../hooks/useAgents'

export default function Agents() {
  const { agents, loading, error } = useAgents()

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Agents</h1>
      {/* TODO: implement — Agent Studio: plain-English rule editor per agent. */}
      <Card>
        {loading && <Spinner />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && agents.length === 0 && (
          <p className="text-sm text-slate-500">No agents configured yet.</p>
        )}
        <ul className="space-y-2">
          {agents.map((agent) => (
            <li key={agent.id} className="flex items-center justify-between">
              <span className="capitalize">{agent.type}</span>
              <Badge tone={agent.enabled ? 'success' : 'neutral'}>
                {agent.enabled ? 'Running' : 'Stopped'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
