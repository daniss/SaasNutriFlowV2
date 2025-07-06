"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuthNew'

interface UseFetchDataOptions<T> {
  fetchFn: (userId: string) => Promise<T>
  dependencies?: any[]
  enabled?: boolean
}

interface UseFetchDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFetchData<T>({ 
  fetchFn, 
  dependencies = [], 
  enabled = true 
}: UseFetchDataOptions<T>): UseFetchDataResult<T> {
  const { user } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user || !enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn(user.id)
      setData(result)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, fetchFn, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
