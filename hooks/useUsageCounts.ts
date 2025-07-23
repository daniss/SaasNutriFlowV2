import useSWR from 'swr'

interface UsageData {
  current: number
  type: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export function useUsageCounts() {
  const { data: clientsData, error: clientsError } = useSWR<UsageData>(
    '/api/subscription/usage?type=clients', 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000 // Refresh every minute
    }
  )

  const { data: mealPlansData, error: mealPlansError } = useSWR<UsageData>(
    '/api/subscription/usage?type=meal_plans', 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000 // Refresh every minute
    }
  )

  const { data: aiGenerationsData, error: aiGenerationsError } = useSWR<UsageData>(
    '/api/subscription/usage?type=ai_generations', 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000 // Refresh every minute
    }
  )

  return {
    clients: {
      current: clientsData?.current || 0,
      loading: !clientsData && !clientsError,
      error: clientsError
    },
    mealPlans: {
      current: mealPlansData?.current || 0,
      loading: !mealPlansData && !mealPlansError,
      error: mealPlansError
    },
    aiGenerations: {
      current: aiGenerationsData?.current || 0,
      loading: !aiGenerationsData && !aiGenerationsError,
      error: aiGenerationsError
    }
  }
}