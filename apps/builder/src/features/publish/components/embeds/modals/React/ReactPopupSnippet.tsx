import { CodeEditor } from '@/components/inputs/CodeEditor'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { PopupProps } from '@typebot.io/nextjs'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { parseReactPopupProps } from '../../snippetParsers'

export const ReactPopupSnippet = ({
  autoShowDelay,
}: Pick<PopupProps, 'autoShowDelay'>) => {
  const { probot } = useProbot()

  const snippet = prettier.format(
    `import { Popup } from "@typebot.io/react";

      const App = () => {
        return <Popup ${parseReactPopupProps({
          probot: probot?.publicId ?? '',
          autoShowDelay,
        })}/>;
      }`,
    {
      parser: 'babel',
      plugins: [parserBabel],
    }
  )

  return <CodeEditor value={snippet} lang="javascript" isReadOnly />
}
