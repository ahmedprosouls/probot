import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import {
  decrypt,
  methodNotAllowed,
  notAuthenticated,
  notFound,
} from '@typebot.io/lib/api'
import { isReadWorkspaceFobidden } from '@/features/workspace/helpers/isReadWorkspaceFobidden'
import { WhatsAppCredentials } from '@typebot.io/schemas/features/whatsapp'
import got from 'got'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const user = await getAuthenticatedUser(req, res)
    if (!user) return notAuthenticated(res)

    const probotId = req.query.probotId as string

    const probot = await prisma.probot.findFirst({
      where: {
        id: probotId,
      },
      select: {
        whatsAppCredentialsId: true,
        workspace: {
          select: {
            credentials: {
              where: {
                type: 'whatsApp',
              },
            },
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!probot?.workspace || isReadWorkspaceFobidden(probot.workspace, user))
      return notFound(res, 'Workspace not found')

    if (!probot) return notFound(res, 'Probot not found')

    const mediaId = req.query.mediaId as string
    const credentialsId = probot.whatsAppCredentialsId

    const credentials = probot.workspace.credentials.find(
      (credential) => credential.id === credentialsId
    )

    if (!credentials) return notFound(res, 'Credentials not found')

    const credentialsData = (await decrypt(
      credentials.data,
      credentials.iv
    )) as WhatsAppCredentials['data']

    const { body } = await got.get({
      url: `https://graph.facebook.com/v17.0/${mediaId}`,
      headers: {
        Authorization: `Bearer ${credentialsData.systemUserAccessToken}`,
      },
    })

    const parsedBody = JSON.parse(body) as { url: string; mime_type: string }

    const buffer = await got(parsedBody.url, {
      headers: {
        Authorization: `Bearer ${credentialsData.systemUserAccessToken}`,
      },
    }).buffer()

    res.setHeader('Content-Type', parsedBody.mime_type)
    res.setHeader('Cache-Control', 'public, max-age=86400')

    return res.send(buffer)
  }
  return methodNotAllowed(res)
}

export default handler
