import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Stack, Code, Text } from '@chakra-ui/react'
import { BubbleProps } from '@typebot.io/nextjs'
import { Probot } from '@typebot.io/schemas'
import { useState } from 'react'
import { BubbleSettings } from '../../../settings/BubbleSettings/BubbleSettings'
import { JavascriptBubbleSnippet } from '../JavascriptBubbleSnippet'

export const parseDefaultBubbleTheme = (probot?: Probot) => ({
  button: {
    backgroundColor: probot?.theme.chat.buttons.backgroundColor,
  },
})

export const JavascriptBubbleInstructions = () => {
  const { probot } = useProbot()
  const [theme, setTheme] = useState<BubbleProps['theme']>(
    parseDefaultBubbleTheme(probot)
  )
  const [previewMessage, setPreviewMessage] =
    useState<BubbleProps['previewMessage']>()

  return (
    <Stack spacing={4}>
      <BubbleSettings
        theme={theme}
        previewMessage={previewMessage}
        defaultPreviewMessageAvatar={probot?.theme.chat.hostAvatar?.url ?? ''}
        onThemeChange={setTheme}
        onPreviewMessageChange={setPreviewMessage}
      />
      <Text>
        Paste this anywhere in the <Code>{'<body>'}</Code>:
      </Text>
      <JavascriptBubbleSnippet theme={theme} previewMessage={previewMessage} />
    </Stack>
  )
}
