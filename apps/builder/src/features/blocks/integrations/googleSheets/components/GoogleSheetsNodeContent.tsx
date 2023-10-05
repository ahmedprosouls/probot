import React from 'react'
import { Stack, Text } from '@chakra-ui/react'
import { GoogleSheetsAction, GoogleSheetsOptions } from '@typebot.io/schemas'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { SetVariableLabel } from '@/components/SetVariableLabel'

type Props = {
  options?: GoogleSheetsOptions
}

export const GoogleSheetsNodeContent = ({ options }: Props) => {
  const { probot } = useProbot()
  return (
    <Stack>
      <Text color={options?.action ? 'currentcolor' : 'gray.500'} noOfLines={1}>
        {options?.action ?? 'Configure...'}
      </Text>
      {probot &&
        options?.action === GoogleSheetsAction.GET &&
        options?.cellsToExtract
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
