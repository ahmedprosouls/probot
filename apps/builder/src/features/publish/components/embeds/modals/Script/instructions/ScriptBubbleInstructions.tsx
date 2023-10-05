import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Stack, Text } from '@chakra-ui/react'
import { BubbleProps } from '@typebot.io/nextjs'
import { Probot } from '@typebot.io/schemas'
import { useState } from 'react'
import { BubbleSettings } from '../../../settings/BubbleSettings/BubbleSettings'
import {
  parseInlineScript,
  parseInitBubbleCode,
  probotImportCode,
  parseApiHostValue,
} from '../../../snippetParsers'

export const parseDefaultBubbleTheme = (probot?: Probot) => ({
  button: {
    backgroundColor: probot?.theme.chat.buttons.backgroundColor,
    iconColor: probot?.theme.chat.buttons.color,
  },
  previewMessage: {
    backgroundColor: probot?.theme.general.background.content ?? 'white',
    textColor: 'black',
  },
})

export const ScriptBubbleInstructions = () => {
  const { probot } = useProbot()
  const [theme, setTheme] = useState<BubbleProps['theme']>(
    parseDefaultBubbleTheme(probot)
  )
  const [previewMessage, setPreviewMessage] =
    useState<BubbleProps['previewMessage']>()

  const scriptSnippet = parseInlineScript(
    `${probotImportCode}

${parseInitBubbleCode({
  probot: probot?.publicId ?? '',
  apiHost: parseApiHostValue(probot?.customDomain),
  theme,
  previewMessage,
})}`
  )

  return (
    <Stack spacing={4}>
      <BubbleSettings
        theme={theme}
        previewMessage={previewMessage}
        defaultPreviewMessageAvatar={probot?.theme.chat.hostAvatar?.url ?? ''}
        onThemeChange={setTheme}
        onPreviewMessageChange={setPreviewMessage}
      />
      <Text>Run this script to initialize the probot:</Text>
      <CodeEditor isReadOnly value={scriptSnippet} lang="javascript" />
    </Stack>
  )
}
