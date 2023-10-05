import { BotProps } from '@typebot.io/nextjs'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { parseBotProps } from './shared'

export const parseInitStandardCode = ({
  probot,
  apiHost,
}: Pick<BotProps, 'probot' | 'apiHost'>) => {
  const botProps = parseBotProps({ probot, apiHost })

  return prettier.format(`Probot.initStandard({${botProps}});`, {
    parser: 'babel',
    plugins: [parserBabel],
  })
}
