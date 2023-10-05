import { SetVariableLabel } from '@/components/SetVariableLabel'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Stack, Text } from '@chakra-ui/react'
import {
  ChatCompletionOpenAIOptions,
  CreateImageOpenAIOptions,
  OpenAIBlock,
} from '@typebot.io/schemas/features/blocks/integrations/openai'

type Props = {
  task: OpenAIBlock['options']['task']
  responseMapping:
    | ChatCompletionOpenAIOptions['responseMapping']
    | CreateImageOpenAIOptions['responseMapping']
}

export const OpenAINodeBody = ({ task, responseMapping }: Props) => {
  const { probot } = useProbot()

  return (
    <Stack>
      <Text color={task ? 'currentcolor' : 'gray.500'} noOfLines={1}>
        {task ?? 'Configure...'}
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
