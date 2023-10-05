import {
  Flex,
  Spinner,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Stats } from '@typebot.io/schemas'
import React from 'react'
import { StatsCards } from './StatsCards'
import { ChangePlanModal } from '@/features/billing/components/ChangePlanModal'
import { Graph } from '@/features/graph/components/Graph'
import { GraphProvider } from '@/features/graph/providers/GraphProvider'
import { GroupsCoordinatesProvider } from '@/features/graph/providers/GroupsCoordinateProvider'
import { useI18n } from '@/locales'
import { trpc } from '@/lib/trpc'
import { isDefined } from '@typebot.io/lib'

export const AnalyticsGraphContainer = ({ stats }: { stats?: Stats }) => {
  const t = useI18n()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { probot, publishedProbot } = useProbot()
  const { data } = trpc.analytics.getTotalAnswersInBlocks.useQuery(
    {
      probotId: probot?.id as string,
    },
    { enabled: isDefined(publishedProbot) }
  )
  const startBlockId = publishedProbot?.groups
    .find((group) => group.blocks.at(0)?.type === 'start')
    ?.blocks.at(0)?.id

  return (
    <Flex
      w="full"
      pos="relative"
      bgColor={useColorModeValue('#f4f5f8', 'gray.850')}
      backgroundImage={useColorModeValue(
        'radial-gradient(#c6d0e1 1px, transparent 0)',
        'radial-gradient(#2f2f39 1px, transparent 0)'
      )}
      backgroundSize="40px 40px"
      backgroundPosition="-19px -19px"
      h="full"
      justifyContent="center"
    >
      {publishedProbot &&
      data?.totalAnswersInBlocks &&
      stats &&
      startBlockId ? (
        <GraphProvider isReadOnly>
          <GroupsCoordinatesProvider groups={publishedProbot?.groups}>
            <Graph
              flex="1"
              probot={publishedProbot}
              onUnlockProPlanClick={onOpen}
              totalAnswersInBlocks={
                startBlockId
                  ? [
                      {
                        blockId: startBlockId,
                        total: stats.totalViews,
                      },
                      ...data.totalAnswersInBlocks,
                    ]
                  : []
              }
            />
          </GroupsCoordinatesProvider>
        </GraphProvider>
      ) : (
        <Flex
          justify="center"
          align="center"
          boxSize="full"
          bgColor="rgba(255, 255, 255, 0.5)"
        >
          <Spinner color="gray" />
        </Flex>
      )}
      <ChangePlanModal
        onClose={onClose}
        isOpen={isOpen}
        type={t('billing.limitMessage.analytics')}
        excludedPlans={['STARTER']}
      />
      <StatsCards stats={stats} pos="absolute" />
    </Flex>
  )
}
