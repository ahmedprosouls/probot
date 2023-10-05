import { ProbotLinkBlock } from '@typebot.io/schemas'
import React from 'react'
import { Tag, Text } from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { byId, isNotEmpty } from '@typebot.io/lib'
import { trpc } from '@/lib/trpc'

type Props = {
  block: ProbotLinkBlock
}

export const ProbotLinkNode = ({ block }: Props) => {
  const { probot } = useProbot()

  const { data: linkedProbotData } = trpc.probot.getProbot.useQuery(
    {
      probotId: block.options.probotId as string,
    },
    {
      enabled:
        isNotEmpty(block.options.probotId) &&
        block.options.probotId !== 'current',
    }
  )

  const isCurrentProbot =
    probot &&
    (block.options.probotId === probot.id ||
      block.options.probotId === 'current')
  const linkedProbot = isCurrentProbot ? probot : linkedProbotData?.probot
  const blockTitle = linkedProbot?.groups.find(
    byId(block.options.groupId)
  )?.title

  if (!block.options.probotId)
    return <Text color="gray.500">Configure...</Text>
  return (
    <Text>
      Jump{' '}
      {blockTitle ? (
        <>
          to <Tag>{blockTitle}</Tag>
        </>
      ) : (
        <></>
      )}{' '}
      {!isCurrentProbot ? (
        <>
          in <Tag colorScheme="blue">{linkedProbot?.name}</Tag>
        </>
      ) : (
        <></>
      )}
    </Text>
  )
}
