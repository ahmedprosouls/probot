import { useProbot } from '@/features/editor/providers/ProbotProvider'
import parserHtml from 'prettier/parser-html'
import prettier from 'prettier/standalone'
import {
  parseApiHostValue,
  parseInitPopupCode,
  probotImportCode,
} from '../../snippetParsers'
import { CodeEditor } from '@/components/inputs/CodeEditor'
import { PopupProps } from '@typebot.io/nextjs'

type Props = Pick<PopupProps, 'autoShowDelay'>

export const JavascriptPopupSnippet = ({ autoShowDelay }: Props) => {
  const { probot } = useProbot()
  const snippet = prettier.format(
    createSnippet({
      probot: probot?.publicId ?? '',
      apiHost: parseApiHostValue(probot?.customDomain),
      autoShowDelay,
    }),
    {
      parser: 'html',
      plugins: [parserHtml],
    }
  )
  return <CodeEditor value={snippet} lang="html" isReadOnly />
}

const createSnippet = (params: PopupProps): string => {
  const jsCode = parseInitPopupCode(params)
  return `<script type="module">${probotImportCode}

${jsCode}</script>`
}
