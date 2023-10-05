import { FlexProps } from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { getViewerUrl } from '@typebot.io/lib/getViewerUrl'
import { CodeEditor } from '@/components/inputs/CodeEditor'
import prettier from 'prettier/standalone'
import parserHtml from 'prettier/parser-html'

type Props = {
  widthLabel: string
  heightLabel: string
  onCopied?: () => void
} & FlexProps

export const IframeSnippet = ({ widthLabel, heightLabel }: Props) => {
  const { probot } = useProbot()
  const src = `${getViewerUrl()}/${probot?.publicId}`
  const code = prettier.format(
    `<iframe src="${src}" style="border: none; width=${widthLabel}; height=${heightLabel}"></iframe>`,
    { parser: 'html', plugins: [parserHtml] }
  )

  return <CodeEditor value={code} lang="html" isReadOnly />
}
