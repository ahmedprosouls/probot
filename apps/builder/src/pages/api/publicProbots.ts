import prisma from '@typebot.io/lib/prisma'
import { InputBlockType, PublicProbot } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { canPublishFileInput } from '@/helpers/databaseRules'
import {
  badRequest,
  methodNotAllowed,
  notAuthenticated,
} from '@typebot.io/lib/api'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import { sendTelemetryEvents } from '@typebot.io/lib/telemetry/sendTelemetryEvent'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  try {
    if (req.method === 'POST') {
      const workspaceId = req.query.workspaceId as string | undefined
      if (!workspaceId) return badRequest(res, 'workspaceId is required')
      const data = (
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      ) as Omit<PublicProbot, 'id'>
      const probotContainsFileInput = data.groups
        .flatMap((g) => g.blocks)
        .some((b) => b.type === InputBlockType.FILE)
      if (
        probotContainsFileInput &&
        !(await canPublishFileInput({ userId: user.id, workspaceId, res }))
      )
        return
      const publicProbot = await prisma.publicProbot.create({
        data: { ...data },
        include: {
          probot: { select: { name: true } },
        },
      })
      await sendTelemetryEvents([
        {
          name: 'Probot published',
          userId: user.id,
          workspaceId,
          probotId: publicProbot.probotId,
          data: {
            isFirstPublish: true,
            name: publicProbot.probot.name,
          },
        },
      ])
      return res.send(publicProbot)
    }
    return methodNotAllowed(res)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(500).send({ title: err.name, message: err.message })
    }
    return res.status(500).send({ message: 'An error occured', error: err })
  }
}

export default handler
