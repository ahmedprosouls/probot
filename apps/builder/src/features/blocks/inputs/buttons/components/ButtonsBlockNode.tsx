import { BlockIndices, ChoiceInputBlock } from '@typebot.io/schemas'
import React from 'react'
import { Stack, Tag, Text, Wrap } from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { SetVariableLabel } from '@/components/SetVariableLabel'
import { ItemNodesList } from '@/features/graph/components/nodes/item/ItemNodesList'

type Props = {
  block: ChoiceInputBlock
  indices: BlockIndices
}

export const ButtonsBlockNode = ({ block, indices }: Props) => {
  const { probot } = useProbot()
  const dynamicVariableName = probot?.variables.find(
    (variable) => variable.id === block.options.dynamicVariableId
  )?.name

  return (
    <Stack w="full">
      {block.options.dynamicVariableId ? (
        <Wrap spacing={1}>
          <Text>Display</Text>
          <Tag bg="orange.400" color="white">
            {dynamicVariableName}
          </Tag>
          <Text>buttons</Text>
        </Wrap>
      ) : (
        <ItemNodesList block={block} indices={indices} />
      )}
      {block.options.variableId ? (
        <SetVariableLabel
          variableId={block.options.variableId}
          variables={probot?.variables}
        />
      ) : null}
    </Stack>
  )
}
