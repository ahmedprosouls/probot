import { Stats } from '@typebot.io/schemas'
import { fetcher } from '@/helpers/fetcher'
import useSWR from 'swr'

export const useStats = ({
  probotId,
  onError,
}: {
  probotId?: string
  onError: (error: Error) => void
}) => {
  const { data, error, mutate } = useSWR<{ stats: Stats }, Error>(
    probotId ? `/api/probots/${probotId}/analytics/stats` : null,
    fetcher
  )
  if (error) onError(error)
  return {
    stats: data?.stats,
    isLoading: !error && !data,
    mutate,
  }
}
