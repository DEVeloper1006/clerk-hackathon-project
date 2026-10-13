import Card from '../components/common/Card'
import { startPayPalConnect } from '../lib/paypal'

export default function Settings() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {/* TODO: implement — business profile, Zapier webhook, API keys. */}
      <Card title="PayPal">
        <button
          type="button"
          onClick={() => void startPayPalConnect()}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Connect PayPal
        </button>
      </Card>
    </div>
  )
}
