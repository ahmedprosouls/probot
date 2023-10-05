import { Stack, Text } from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { WebhookBlock } from '@typebot.io/schemas'
import { SetVariableLabel } from '@/components/SetVariableLabel'

type Props = {
  block: WebhookBlock
}

export const WebhookContent = ({ block: { options } }: Props) => {
  const { probot } = useProbot()
  const webhook = options.webhook

  if (!webhook?.url) return <Text color="gray.500">Configure...</Text>
  return (
    <Stack w="full">
      <Text noOfLines={2} pr="6">
        {webhook.method} {webhook.url}
      </Text>
      {options.responseVariableMapping
        .filter((mapping) => mapping.variableId)
        .map((mapping) => (
          <SetVariableLabel
            key={mapping.variableId}
            variableId={mapping.variableId as string}
            variables={probot?.variables}
          />
        ))}
    </Stack>
  )
}
