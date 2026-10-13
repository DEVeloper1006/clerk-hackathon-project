import Card from '../components/common/Card'
import { useSocket } from '../hooks/useSocket'
import { useAgentsStore } from '../stores/agents'

export default function Dashboard() {
  useSocket()
  const activity = useAgentsStore((s) => s.activity)

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* TODO: implement — KPI tiles, Recharts revenue chart, Bryntum cash flow timeline. */}
      <Card title="Live agent activity">
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">No agent activity yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activity.map((a, i) => (
              <li key={`${a.timestamp}-${i}`}>
                <span className="font-medium">{a.agentType}</span> — {a.action}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
