import { DefaultBotNotificationEmail, render } from '@typebot.io/emails'
import {
  AnswerInSessionState,
  ReplyLog,
  SendEmailBlock,
  SendEmailOptions,
  SessionState,
  SmtpCredentials,
  ProbotInSession,
  Variable,
} from '@typebot.io/schemas'
import { createTransport } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { byId, isDefined, isEmpty, isNotDefined, omit } from '@typebot.io/lib'
import { getDefinedVariables, parseAnswers } from '@typebot.io/lib/results'
import { decrypt } from '@typebot.io/lib/api'
import { defaultFrom, defaultTransportOptions } from './constants'
import { findUniqueVariableValue } from '../../../variables/findUniqueVariableValue'
import { env } from '@typebot.io/env'
import { ExecuteIntegrationResponse } from '../../../types'
import prisma from '@typebot.io/lib/prisma'
import { parseVariables } from '../../../variables/parseVariables'

export const executeSendEmailBlock = async (
  state: SessionState,
  block: SendEmailBlock
): Promise<ExecuteIntegrationResponse> => {
  const logs: ReplyLog[] = []
  const { options } = block
  const { probot, resultId, answers } = state.probotsQueue[0]
  const isPreview = !resultId
  if (isPreview)
    return {
      outgoingEdgeId: block.outgoingEdgeId,
      logs: [
        {
          status: 'info',
          description: 'Emails are not sent in preview mode',
        },
      ],
    }

  const bodyUniqueVariable = findUniqueVariableValue(probot.variables)(
    options.body
  )
  const body = bodyUniqueVariable
    ? stringifyUniqueVariableValueAsHtml(bodyUniqueVariable)
    : parseVariables(probot.variables, { isInsideHtml: true })(
        options.body ?? ''
      )

  try {
    const sendEmailLogs = await sendEmail({
      probot,
      answers,
      credentialsId: options.credentialsId,
      recipients: options.recipients.map(parseVariables(probot.variables)),
      subject: parseVariables(probot.variables)(options.subject ?? ''),
      body,
      cc: (options.cc ?? []).map(parseVariables(probot.variables)),
      bcc: (options.bcc ?? []).map(parseVariables(probot.variables)),
      replyTo: options.replyTo
        ? parseVariables(probot.variables)(options.replyTo)
        : undefined,
      fileUrls: getFileUrls(probot.variables)(options.attachmentsVariableId),
      isCustomBody: options.isCustomBody,
      isBodyCode: options.isBodyCode,
    })
    if (sendEmailLogs) logs.push(...sendEmailLogs)
  } catch (err) {
    logs.push({
      status: 'error',
      details: err,
      description: `Email not sent`,
    })
  }

  return { outgoingEdgeId: block.outgoingEdgeId, logs }
}

const sendEmail = async ({
  probot,
  answers,
  credentialsId,
  recipients,
  body,
  subject,
  cc,
  bcc,
  replyTo,
  isBodyCode,
  isCustomBody,
  fileUrls,
}: SendEmailOptions & {
  probot: ProbotInSession
  answers: AnswerInSessionState[]
  fileUrls?: string | string[]
}): Promise<ReplyLog[] | undefined> => {
  const logs: ReplyLog[] = []
  const { name: replyToName } = parseEmailRecipient(replyTo)

  const { host, port, isTlsEnabled, username, password, from } =
    (await getEmailInfo(credentialsId)) ?? {}
  if (!from) return

  const transportConfig = {
    host,
    port,
    secure: isTlsEnabled ?? undefined,
    auth: {
      user: username,
      pass: password,
    },
  }

  const emailBody = await getEmailBody({
    body,
    isCustomBody,
    isBodyCode,
    probot,
    answersInSession: answers,
  })

  if (!emailBody) {
    logs.push({
      status: 'error',
      description: 'Email not sent',
      details: {
        error: 'No email body found',
        transportConfig,
        recipients,
        subject,
        cc,
        bcc,
        replyTo,
        emailBody,
      },
    })
    return logs
  }
  const transporter = createTransport(transportConfig)
  const fromName = isEmpty(replyToName) ? from.name : replyToName
  const email: Mail.Options = {
    from: fromName ? `"${fromName}" <${from.email}>` : from.email,
    cc,
    bcc,
    to: recipients,
    replyTo,
    subject,
    attachments: fileUrls
      ? (typeof fileUrls === 'string' ? fileUrls.split(', ') : fileUrls).map(
          (url) => ({ path: url })
        )
      : undefined,
    ...emailBody,
  }
  try {
    await transporter.sendMail(email)
    logs.push({
      status: 'success',
      description: 'Email successfully sent',
      details: {
        transportConfig: {
          ...transportConfig,
          auth: { user: transportConfig.auth.user, pass: '******' },
        },
        email,
      },
    })
  } catch (err) {
    logs.push({
      status: 'error',
      description: 'Email not sent',
      details: {
        error: err instanceof Error ? err.toString() : err,
        transportConfig: {
          ...transportConfig,
          auth: { user: transportConfig.auth.user, pass: '******' },
        },
        email,
      },
    })
  }

  return logs
}

const getEmailInfo = async (
  credentialsId: string
): Promise<SmtpCredentials['data'] | undefined> => {
  if (credentialsId === 'default')
    return {
      host: defaultTransportOptions.host,
      port: defaultTransportOptions.port,
      username: defaultTransportOptions.auth.user,
      password: defaultTransportOptions.auth.pass,
      isTlsEnabled: undefined,
      from: defaultFrom,
    }
  const credentials = await prisma.credentials.findUnique({
    where: { id: credentialsId },
  })
  if (!credentials) return
  return (await decrypt(
    credentials.data,
    credentials.iv
  )) as SmtpCredentials['data']
}

const getEmailBody = async ({
  body,
  isCustomBody,
  isBodyCode,
  probot,
  answersInSession,
}: {
  probot: ProbotInSession
  answersInSession: AnswerInSessionState[]
} & Pick<SendEmailOptions, 'isCustomBody' | 'isBodyCode' | 'body'>): Promise<
  { html?: string; text?: string } | undefined
> => {
  if (isCustomBody || (isNotDefined(isCustomBody) && !isEmpty(body)))
    return {
      html: isBodyCode ? body : undefined,
      text: !isBodyCode ? body : undefined,
    }
  const answers = parseAnswers({
    variables: getDefinedVariables(probot.variables),
    answers: answersInSession,
  })
  return {
    html: render(
      <DefaultBotNotificationEmail
        resultsUrl={`${env.NEXTAUTH_URL}/probots/${probot.id}/results`}
        answers={omit(answers, 'submittedAt')}
      />
    ).html,
  }
}

const parseEmailRecipient = (
  recipient?: string
): { email?: string; name?: string } => {
  if (!recipient) return {}
  if (recipient.includes('<')) {
    const [name, email] = recipient.split('<')
    return {
      name: name.replace(/>/g, '').trim().replace(/"/g, ''),
      email: email.replace('>', '').trim(),
    }
  }
  return {
    email: recipient,
  }
}

const getFileUrls =
  (variables: Variable[]) =>
  (variableId: string | undefined): string | string[] | undefined => {
    const fileUrls = variables.find(byId(variableId))?.value
    if (!fileUrls) return
    if (typeof fileUrls === 'string') return fileUrls
    return fileUrls.filter(isDefined)
  }

const stringifyUniqueVariableValueAsHtml = (
  value: Variable['value']
): string => {
  if (!value) return ''
  if (typeof value === 'string') return value.replace(/\n/g, '<br />')
  return value.map(stringifyUniqueVariableValueAsHtml).join('<br />')
}
