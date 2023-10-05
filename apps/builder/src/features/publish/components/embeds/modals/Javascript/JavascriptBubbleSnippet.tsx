import prettier from 'prettier/standalone'
import parserHtml from 'prettier/parser-html'
import {
  parseApiHostValue,
  parseInitBubbleCode,
  probotImportCode,
} from '../../snippetParsers'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { CodeEditor } from '@/components/inputs/CodeEditor'
import { BubbleProps } from '@typebot.io/nextjs'

type Props = Pick<BubbleProps, 'theme' | 'previewMessage'>

export const JavascriptBubbleSnippet = ({ theme, previewMessage }: Props) => {
  const { probot } = useProbot()

  const snippet = prettier.format(
    `<script type="module">${probotImportCode}
    
${parseInitBubbleCode({
  probot: probot?.publicId ?? '',
  apiHost: parseApiHostValue(probot?.customDomain),
  theme: {
    ...theme,
    chatWindow: {
      backgroundColor: probot?.theme.general.background.content ?? '#fff',
    },
  },
  previewMessage,
})}</script>`,
    {
      parser: 'html',
      plugins: [parserHtml],
    }
  )

  return <CodeEditor value={snippet} lang="html" isReadOnly />
}
