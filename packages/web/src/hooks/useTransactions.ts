import { useEffect, useState } from 'react'
import type { Transaction } from '@clerk/shared'
import { api } from '../lib/api'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: implement — add pagination/search params and live updates from useSocket.
    let cancelled = false
    void api<Transaction[]>('/api/transactions').then((res) => {
      if (cancelled) return
      if (res.success) setTransactions(res.data ?? [])
      else setError(res.error ?? 'Failed to load transactions')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { transactions, loading, error }
}
