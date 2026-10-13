import Card from '../components/common/Card'

export default function Onboarding() {
  return (
    <div className="mx-auto max-w-xl p-10">
      <h1 className="mb-6 text-2xl font-semibold">Welcome to Clerk</h1>
      {/* TODO: implement — steps: create account → pick industry template → connect PayPal → review agents. */}
      <Card>
        <p className="text-sm text-slate-600">Onboarding flow coming soon.</p>
      </Card>
    </div>
  )
}
