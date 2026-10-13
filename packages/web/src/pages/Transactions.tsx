import Card from '../components/common/Card'
import Spinner from '../components/common/Spinner'
import { useTransactions } from '../hooks/useTransactions'

export default function Transactions() {
  const { transactions, loading, error } = useTransactions()

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      {/* TODO: implement — replace with AG Grid in components/grid/. */}
      <Card>
        {loading && <Spinner />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <p className="text-sm text-slate-500">{transactions.length} transactions</p>
        )}
      </Card>
    </div>
  )
}
