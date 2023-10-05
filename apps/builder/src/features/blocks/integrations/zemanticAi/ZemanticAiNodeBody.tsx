import React from 'react'
import { Stack, Text } from '@chakra-ui/react'
import { ZemanticAiOptions } from '@typebot.io/schemas'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { SetVariableLabel } from '@/components/SetVariableLabel'

type Props = {
  options: ZemanticAiOptions
}

export const ZemanticAiNodeBody = ({
  options: { query, projectId, responseMapping },
}: Props) => {
  const { probot } = useProbot()
  return (
    <Stack>
      <Text
        color={query && projectId ? 'currentcolor' : 'gray.500'}
        noOfLines={1}
      >
        {query && projectId ? `Ask: ${query}` : 'Configure...'}
      </Text>
      {probot &&
        responseMapping
          .map((mapping) => mapping.variableId)
          .map((variableId, idx) =>
            variableId ? (
              <SetVariableLabel
                key={variableId + idx}
                variables={probot.variables}
                variableId={variableId}
              />
            ) : null
          )}
    </Stack>
  )
}
