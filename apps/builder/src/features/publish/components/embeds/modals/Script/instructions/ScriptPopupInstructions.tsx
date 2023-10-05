import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { PopupSettings } from '../../../settings/PopupSettings'
import { parseInitPopupCode } from '../../../snippetParsers'
import {
  parseApiHostValue,
  parseInlineScript,
  probotImportCode,
} from '../../../snippetParsers/shared'

export const ScriptPopupInstructions = () => {
  const { probot } = useProbot()
  const [inputValue, setInputValue] = useState<number>()

  const scriptSnippet = parseInlineScript(
    `${probotImportCode}

${parseInitPopupCode({
  probot: probot?.publicId ?? '',
  apiHost: parseApiHostValue(probot?.customDomain),
  autoShowDelay: inputValue,
})}`
  )

  return (
    <Stack spacing={4}>
      <PopupSettings
        onUpdateSettings={(settings) => setInputValue(settings.autoShowDelay)}
      />
      <Text>Run this script to initialize the probot:</Text>
      <CodeEditor isReadOnly value={scriptSnippet} lang="javascript" />
    </Stack>
  )
}
