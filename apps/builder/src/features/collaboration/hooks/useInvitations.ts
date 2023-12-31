import { fetcher } from '@/helpers/fetcher'
import { Invitation } from '@typebot.io/prisma'
import useSWR from 'swr'
import { env } from '@typebot.io/env'

export const useInvitations = ({
  probotId,
  onError,
}: {
  probotId?: string
  onError: (error: Error) => void
}) => {
  const { data, error, mutate } = useSWR<{ invitations: Invitation[] }, Error>(
    probotId ? `/api/probots/${probotId}/invitations` : null,
    fetcher,
    {
      dedupingInterval: env.NEXT_PUBLIC_E2E_TEST ? 0 : undefined,
    }
  )
  if (error) onError(error)
  return {
    invitations: data?.invitations,
    isLoading: !error && !data,
    mutate,
  }
}
