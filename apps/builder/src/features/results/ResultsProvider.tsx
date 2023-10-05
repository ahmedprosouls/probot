import { useToast } from '@/hooks/useToast'
import {
  LogicBlockType,
  ResultHeaderCell,
  ResultWithAnswers,
} from '@typebot.io/schemas'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { parseResultHeader } from '@typebot.io/lib/results'
import { useProbot } from '../editor/providers/ProbotProvider'
import { useResultsQuery } from './hooks/useResultsQuery'
import { TableData } from './types'
import { convertResultsToTableData } from './helpers/convertResultsToTableData'
import { trpc } from '@/lib/trpc'
import { isDefined } from '@typebot.io/lib/utils'

const resultsContext = createContext<{
  resultsList: { results: ResultWithAnswers[] }[] | undefined
  flatResults: ResultWithAnswers[]
  hasNextPage: boolean
  resultHeader: ResultHeaderCell[]
  totalResults: number
  tableData: TableData[]
  onDeleteResults: (totalResultsDeleted: number) => void
  fetchNextPage: () => void
  refetchResults: () => void
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
}>({})

export const ResultsProvider = ({
  children,
  probotId,
  totalResults,
  onDeleteResults,
}: {
  children: ReactNode
  probotId: string
  totalResults: number
  onDeleteResults: (totalResultsDeleted: number) => void
}) => {
  const { publishedProbot } = useProbot()
  const { showToast } = useToast()
  const { data, fetchNextPage, hasNextPage, refetch } = useResultsQuery({
    probotId,
    onError: (error) => {
      showToast({ description: error })
    },
  })

  const linkedProbotIds =
    publishedProbot?.groups
      .flatMap((group) => group.blocks)
      .reduce<string[]>(
        (probotIds, block) =>
          block.type === LogicBlockType.PROBOT_LINK &&
          isDefined(block.options.probotId) &&
          !probotIds.includes(block.options.probotId) &&
          block.options.mergeResults !== false
            ? [...probotIds, block.options.probotId]
            : probotIds,
        []
      ) ?? []

  const { data: linkedProbotsData } = trpc.getLinkedProbots.useQuery(
    {
      probotId,
    },
    {
      enabled: linkedProbotIds.length > 0,
    }
  )

  const flatResults = useMemo(
    () => data?.flatMap((d) => d.results) ?? [],
    [data]
  )

  const resultHeader = useMemo(
    () =>
      publishedProbot
        ? parseResultHeader(publishedProbot, linkedProbotsData?.probots)
        : [],
    [linkedProbotsData?.probots, publishedProbot]
  )

  const tableData = useMemo(
    () =>
      publishedProbot
        ? convertResultsToTableData(
            data?.flatMap((d) => d.results) ?? [],
            resultHeader
          )
        : [],
    [publishedProbot, data, resultHeader]
  )

  return (
    <resultsContext.Provider
      value={{
        resultsList: data,
        flatResults,
        hasNextPage: hasNextPage ?? true,
        tableData,
        resultHeader,
        totalResults,
        onDeleteResults,
        fetchNextPage,
        refetchResults: refetch,
      }}
    >
      {children}
    </resultsContext.Provider>
  )
}

export const useResults = () => useContext(resultsContext)
