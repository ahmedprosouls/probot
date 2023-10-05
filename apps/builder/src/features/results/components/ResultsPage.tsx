import { Seo } from '@/components/Seo'
import { AnalyticsGraphContainer } from '@/features/analytics/components/AnalyticsGraphContainer'
import { ProbotHeader } from '@/features/editor/components/ProbotHeader'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useToast } from '@/hooks/useToast'
import {
  Flex,
  HStack,
  Button,
  Tag,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useStats } from '../hooks/useStats'
import { ResultsProvider } from '../ResultsProvider'
import { ResultsTableContainer } from './ResultsTableContainer'
import { UsageAlertBanners } from './UsageAlertBanners'

export const ResultsPage = () => {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { probot, publishedProbot } = useProbot()
  const isAnalytics = useMemo(
    () => router.pathname.endsWith('analytics'),
    [router.pathname]
  )
  const { showToast } = useToast()

  const { stats, mutate } = useStats({
    probotId: publishedProbot?.probotId,
    onError: (err) => showToast({ title: err.name, description: err.message }),
  })

  const handleDeletedResults = (total: number) => {
    if (!stats) return
    mutate({
      stats: { ...stats, totalStarts: stats.totalStarts - total },
    })
  }

  return (
    <Flex overflow="hidden" h="100vh" flexDir="column">
      <Seo
        title={
          router.pathname.endsWith('analytics')
            ? probot?.name
              ? `${probot.name} | Analytics`
              : 'Analytics'
            : probot?.name
            ? `${probot.name} | Results`
            : 'Results'
        }
      />
      <ProbotHeader />
      {workspace && <UsageAlertBanners workspace={workspace} />}
      <Flex
        h="full"
        w="full"
        bgColor={useColorModeValue(
          router.pathname.endsWith('analytics') ? '#f4f5f8' : 'white',
          router.pathname.endsWith('analytics') ? 'gray.850' : 'gray.900'
        )}
      >
        <Flex
          pos="absolute"
          zIndex={2}
          w="full"
          justifyContent="center"
          h="60px"
          display={['none', 'flex']}
        >
          <HStack maxW="1600px" w="full" px="4">
            <Button
              as={Link}
              colorScheme={!isAnalytics ? 'blue' : 'gray'}
              variant={!isAnalytics ? 'outline' : 'ghost'}
              size="sm"
              href={`/probots/${probot?.id}/results`}
            >
              <Text>Submissions</Text>
              {(stats?.totalStarts ?? 0) > 0 && (
                <Tag size="sm" colorScheme="blue" ml="1">
                  {stats?.totalStarts}
                </Tag>
              )}
            </Button>
            <Button
              as={Link}
              colorScheme={isAnalytics ? 'blue' : 'gray'}
              variant={isAnalytics ? 'outline' : 'ghost'}
              href={`/probots/${probot?.id}/results/analytics`}
              size="sm"
            >
              Analytics
            </Button>
          </HStack>
        </Flex>
        <Flex pt={['10px', '60px']} w="full" justify="center">
          {workspace &&
            publishedProbot &&
            (isAnalytics ? (
              <AnalyticsGraphContainer stats={stats} />
            ) : (
              <ResultsProvider
                probotId={publishedProbot.probotId}
                totalResults={stats?.totalStarts ?? 0}
                onDeleteResults={handleDeletedResults}
              >
                <ResultsTableContainer />
              </ResultsProvider>
            ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
