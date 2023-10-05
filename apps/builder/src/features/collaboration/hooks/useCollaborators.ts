import { fetcher } from '@/helpers/fetcher'
import useSWR from 'swr'
import { Collaborator } from '../types'

export const useCollaborators = ({
  probotId,
  onError,
}: {
  probotId?: string
  onError: (error: Error) => void
}) => {
  const { data, error, mutate } = useSWR<
    { collaborators: Collaborator[] },
    Error
  >(probotId ? `/api/probots/${probotId}/collaborators` : null, fetcher)
  if (error) onError(error)
  return {
    collaborators: data?.collaborators,
    isLoading: !error && !data,
    mutate,
  }
}
