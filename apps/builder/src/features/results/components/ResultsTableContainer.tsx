import { Stack } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { LogsModal } from './LogsModal'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useResults } from '../ResultsProvider'
import { ResultModal } from './ResultModal'
import { ResultsTable } from './table/ResultsTable'
import { useRouter } from 'next/router'

export const ResultsTableContainer = () => {
  const { query } = useRouter()
  const {
    flatResults: results,
    fetchNextPage,
    hasNextPage,
    resultHeader,
    tableData,
  } = useResults()
  const { probot, publishedProbot } = useProbot()
  const [inspectingLogsResultId, setInspectingLogsResultId] = useState<
    string | null
  >(null)
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null)

  const handleLogsModalClose = () => setInspectingLogsResultId(null)

  const handleResultModalClose = () => setExpandedResultId(null)

  const handleLogOpenIndex = (index: number) => () => {
    if (!results[index]) return
    setInspectingLogsResultId(results[index].id)
  }

  const handleResultExpandIndex = (index: number) => () => {
    if (!results[index]) return
    setExpandedResultId(results[index].id)
  }

  useEffect(() => {
    if (query.id) setExpandedResultId(query.id as string)
  }, [query.id])

  return (
    <Stack pb="28" px={['4', '0']} spacing="4" maxW="1600px" w="full">
      {publishedProbot && (
        <LogsModal
          probotId={publishedProbot?.probotId}
          resultId={inspectingLogsResultId}
          onClose={handleLogsModalClose}
        />
      )}
      <ResultModal
        resultId={expandedResultId}
        onClose={handleResultModalClose}
      />

      {probot && (
        <ResultsTable
          preferences={probot.resultsTablePreferences ?? undefined}
          resultHeader={resultHeader}
          data={tableData}
          onScrollToBottom={fetchNextPage}
          hasMore={hasNextPage}
          onLogOpenIndex={handleLogOpenIndex}
          onResultExpandIndex={handleResultExpandIndex}
        />
      )}
    </Stack>
  )
}
