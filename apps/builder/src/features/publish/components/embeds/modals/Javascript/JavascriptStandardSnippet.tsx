import parserHtml from 'prettier/parser-html'
import prettier from 'prettier/standalone'
import {
  parseApiHostValue,
  parseInitStandardCode,
  probotImportCode,
} from '../../snippetParsers'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { CodeEditor } from '@/components/inputs/CodeEditor'

type Props = {
  widthLabel?: string
  heightLabel?: string
}

export const JavascriptStandardSnippet = ({
  widthLabel,
  heightLabel,
}: Props) => {
  const { probot } = useProbot()

  const snippet = prettier.format(
    `${parseStandardHeadCode(probot?.publicId, probot?.customDomain)}
      ${parseStandardElementCode(widthLabel, heightLabel)}`,
    {
      parser: 'html',
      plugins: [parserHtml],
    }
  )

  return <CodeEditor value={snippet} lang="html" isReadOnly />
}

export const parseStandardHeadCode = (
  publicId?: string | null,
  customDomain?: string | null
) =>
  prettier.format(
    `<script type="module">${probotImportCode};

${parseInitStandardCode({
  probot: publicId ?? '',
  apiHost: parseApiHostValue(customDomain),
})}</script>`,
    { parser: 'html', plugins: [parserHtml] }
  )

export const parseStandardElementCode = (width?: string, height?: string) => {
  if (!width && !height) return '<probot-standard></probot-standard>'
  return prettier.format(
    `<probot-standard style="${width ? `width: ${width}; ` : ''}${
      height ? `height: ${height}; ` : ''
    }"></probot-standard>`,
    { parser: 'html', plugins: [parserHtml] }
  )
}
