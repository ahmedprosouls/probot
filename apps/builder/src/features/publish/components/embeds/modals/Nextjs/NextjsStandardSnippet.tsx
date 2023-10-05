import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { parseReactBotProps } from '../../snippetParsers'

type Props = { widthLabel?: string; heightLabel: string }

export const NextjsStandardSnippet = ({
  widthLabel,
  heightLabel,
}: Props) => {
  const { probot } = useProbot()
  const snippet = prettier.format(
    `import { Standard } from "@typebot.io/nextjs";

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
