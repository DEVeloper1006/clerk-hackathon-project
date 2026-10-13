import { useTenantStore } from '../../stores/tenant'

export default function Header() {
  const tenant = useTenantStore((s) => s.tenant)

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <span className="text-sm font-medium">{tenant?.name ?? 'No business connected'}</span>
      {tenant && !tenant.paypalConnected && (
        <span className="text-xs text-amber-600">PayPal not connected</span>
      )}
    </header>
  )
}
