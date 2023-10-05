import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { BubbleProps } from '@typebot.io/nextjs'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { parseReactBubbleProps } from '../../snippetParsers'

export const ReactBubbleSnippet = ({
  theme,
  previewMessage,
}: Pick<BubbleProps, 'theme' | 'previewMessage'>) => {
  const { probot } = useProbot()

  const snippet = prettier.format(
    `import { Bubble } from "@typebot.io/react";

      const App = () => {
        return <Bubble ${parseReactBubbleProps({
          probot: probot?.publicId ?? '',
          theme,
          previewMessage,
        })}/>
      }`,
    {
      parser: 'babel',
      plugins: [parserBabel],
    }
  )

  return <CodeEditor value={snippet} lang="javascript" isReadOnly />
}
