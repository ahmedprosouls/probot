import { trpc } from '@/lib/trpc'

export const useResultsQuery = ({
  probotId,
  onError,
}: {
  probotId: string
  onError?: (error: string) => void
}) => {
  const { data, error, fetchNextPage, hasNextPage, refetch } =
    trpc.results.getResults.useInfiniteQuery(
      {
        probotId,
        limit: '50',
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )

  if (error && onError) onError(error.message)
  return {
    data: data?.pages,
    isLoading: !error && !data,
    fetchNextPage,
    hasNextPage,
    refetch,
  }
}
