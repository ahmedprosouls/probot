import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { parseReactBotProps } from '../../snippetParsers'

type ReactStandardSnippetProps = { widthLabel?: string; heightLabel: string }

export const ReactStandardSnippet = ({
  widthLabel,
  heightLabel,
}: ReactStandardSnippetProps) => {
  const { probot } = useProbot()
  const snippet = prettier.format(
    `import { Standard } from "@typebot.io/react";

      const App = () => {
        return <Standard ${parseReactBotProps({
          probot: probot?.publicId ?? '',
        })} style={{width: "${widthLabel}", height: "${heightLabel}"}} />
      }`,
    {
      parser: 'babel',
      plugins: [parserBabel],
    }
  )
  return <CodeEditor value={snippet} lang="javascript" isReadOnly />
}
