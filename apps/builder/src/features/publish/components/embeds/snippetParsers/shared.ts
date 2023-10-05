import { BotProps } from '@typebot.io/nextjs'
import parserBabel from 'prettier/parser-babel'
import prettier from 'prettier/standalone'
import { isDefined } from '@typebot.io/lib'
import { getViewerUrl } from '@typebot.io/lib/getViewerUrl'
import { Probot } from '@typebot.io/schemas'
import { isCloudProdInstance } from '@/helpers/isCloudProdInstance'
import packageJson from '../../../../../../../../packages/embeds/js/package.json'

export const parseStringParam = (
  fieldName: string,
  fieldValue?: string,
  defaultValue?: string
) => {
  if (!fieldValue) return ''
  if (isDefined(defaultValue) && fieldValue === defaultValue) return ''
  return `${fieldName}: "${fieldValue}",`
}

export const parseNumberOrBoolParam = (
  fieldName: string,
  fieldValue?: number | boolean
) => (isDefined(fieldValue) ? `${fieldName}: ${fieldValue},` : ``)

export const parseBotProps = ({ probot, apiHost }: BotProps) => {
  const probotLine = parseStringParam('probot', probot as string)
  const apiHostLine = parseStringParam('apiHost', apiHost)
  return `${probotLine}${apiHostLine}`
}

export const parseReactStringParam = (fieldName: string, fieldValue?: string) =>
  fieldValue ? `${fieldName}="${fieldValue}"` : ``

export const parseReactNumberOrBoolParam = (
  fieldName: string,
  fieldValue?: number | boolean
) => (isDefined(fieldValue) ? `${fieldName}={${fieldValue}}` : ``)

export const parseReactBotProps = ({ probot, apiHost }: BotProps) => {
  const probotLine = parseReactStringParam('probot', probot as string)
  const apiHostLine = parseReactStringParam('apiHost', apiHost)
  return `${probotLine} ${apiHostLine}`
}

export const probotImportCode = isCloudProdInstance()
  ? `import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'`
  : `import Probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@${packageJson.version}/dist/web.js'`

export const parseInlineScript = (script: string) =>
  prettier.format(
    `const probotInitScript = document.createElement("script");
  probotInitScript.type = "module";
  probotInitScript.innerHTML = \`${script}\`;
  document.body.append(probotInitScript);`,
    { parser: 'babel', plugins: [parserBabel] }
  )

export const parseApiHost = (
  customDomain: Probot['customDomain'] | undefined
) => {
  if (customDomain) return new URL(`https://${customDomain}`).origin
  return getViewerUrl()
}

export const parseApiHostValue = (
  customDomain: Probot['customDomain'] | undefined
) => {
  if (isCloudProdInstance()) return
  return parseApiHost(customDomain)
}
