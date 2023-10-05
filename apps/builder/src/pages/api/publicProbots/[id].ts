import prisma from '@typebot.io/lib/prisma'
import { InputBlockType, PublicProbot } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { canPublishFileInput, canWriteProbots } from '@/helpers/databaseRules'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import {
  badRequest,
  methodNotAllowed,
  notAuthenticated,
} from '@typebot.io/lib/api'
import { sendTelemetryEvents } from '@typebot.io/lib/telemetry/sendTelemetryEvent'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)

  const id = req.query.id as string
  const workspaceId = req.query.workspaceId as string | undefined

  if (req.method === 'PUT') {
    const data = (
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    ) as PublicProbot
    if (!workspaceId) return badRequest(res, 'workspaceId is required')
    const probotContainsFileInput = data.groups
      .flatMap((g) => g.blocks)
      .some((b) => b.type === InputBlockType.FILE)
    if (
      probotContainsFileInput &&
      !(await canPublishFileInput({ userId: user.id, workspaceId, res }))
    )
      return
    const publicProbot = await prisma.publicProbot.update({
      where: { id },
      data,
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
          name: publicProbot.probot.name,
        },
      },
    ])
    return res.send({ probot: publicProbot })
  }
  if (req.method === 'DELETE') {
    const publishedProbotId = req.query.id as string
    const probotId = req.query.probotId as string | undefined
    if (!probotId) return badRequest(res, 'probotId is required')
    await prisma.publicProbot.deleteMany({
      where: {
        id: publishedProbotId,
        probot: canWriteProbots(probotId, user),
      },
    })
    return res.send({ success: true })
  }
  return methodNotAllowed(res)
}

export default handler
