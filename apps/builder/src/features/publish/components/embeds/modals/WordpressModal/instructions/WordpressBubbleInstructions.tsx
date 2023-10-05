import { CodeEditor } from '@/components/inputs/CodeEditor'
import { ExternalLinkIcon } from '@/components/icons'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import {
  OrderedList,
  ListItem,
  useColorModeValue,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { BubbleProps } from '@typebot.io/nextjs'
import { useState } from 'react'
import { BubbleSettings } from '../../../settings/BubbleSettings/BubbleSettings'
import { parseApiHostValue, parseInitBubbleCode } from '../../../snippetParsers'
import { parseDefaultBubbleTheme } from '../../Javascript/instructions/JavascriptBubbleInstructions'

type Props = {
  publicId: string
}
export const WordpressBubbleInstructions = ({ publicId }: Props) => {
  const { probot } = useProbot()

  const [theme, setTheme] = useState<BubbleProps['theme']>(
    parseDefaultBubbleTheme(probot)
  )
  const [previewMessage, setPreviewMessage] =
    useState<BubbleProps['previewMessage']>()

  const initCode = parseInitBubbleCode({
    probot: publicId,
    apiHost: parseApiHostValue(probot?.customDomain),
    theme: {
      ...theme,
      chatWindow: {
        backgroundColor: probot?.theme.general.background.content ?? '#fff',
      },
    },
    previewMessage,
  })

  return (
    <OrderedList spacing={4} pl={5}>
      <ListItem>
        Install{' '}
        <Link
          href="https://wordpress.org/plugins/probot/"
          isExternal
          color={useColorModeValue('blue.500', 'blue.300')}
        >
          the official Probot WordPress plugin
          <ExternalLinkIcon mx="2px" />
        </Link>
      </ListItem>
      <ListItem>
        <Stack spacing={4}>
          <BubbleSettings
            previewMessage={previewMessage}
            defaultPreviewMessageAvatar={
              probot?.theme.chat.hostAvatar?.url ?? ''
            }
            theme={theme}
            onPreviewMessageChange={setPreviewMessage}
            onThemeChange={setTheme}
          />
          <Text>
            You can now place the following code snippet in the Probot panel in
            your WordPress admin:
          </Text>
          <CodeEditor value={initCode} lang="javascript" isReadOnly />
        </Stack>
      </ListItem>
    </OrderedList>
  )
}
