import { trpc } from '@/lib/trpc'

export const useProbots = ({
  folderId,
  workspaceId,
  onError,
}: {
  workspaceId?: string
  folderId?: string | 'root'
  onError: (error: Error) => void
}) => {
  const { data, isLoading, refetch } = trpc.probot.listProbots.useQuery(
    {
      workspaceId: workspaceId as string,
      folderId,
    },
    {
      enabled: !!workspaceId,
      onError: (error) => {
        onError(new Error(error.message))
      },
    }
  )
  return {
    probots: data?.probots,
    isLoading,
    refetch,
  }
}
