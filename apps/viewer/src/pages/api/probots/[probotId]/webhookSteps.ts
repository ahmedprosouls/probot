import { authenticateUser } from '@/helpers/authenticateUser'
import prisma from '@typebot.io/lib/prisma'
import { Group, WebhookBlock } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  byId,
  isNotDefined,
  isWebhookBlock,
  parseGroupTitle,
} from '@typebot.io/lib'
import { methodNotAllowed } from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const user = await authenticateUser(req)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    const probotId = req.query.probotId as string
    const probot = await prisma.probot.findFirst({
      where: {
        id: probotId,
        workspace: { members: { some: { userId: user.id } } },
      },
      select: { groups: true, webhooks: true },
    })
    const emptyWebhookBlocks = (probot?.groups as Group[]).reduce<
      { groupId: string; id: string; name: string }[]
    >((emptyWebhookBlocks, group) => {
      const blocks = group.blocks.filter(
        (block) =>
          isWebhookBlock(block) &&
          isNotDefined(
            probot?.webhooks.find(byId((block as WebhookBlock).webhookId))?.url
          )
      )
      return [
        ...emptyWebhookBlocks,
        ...blocks.map((s) => ({
          id: s.id,
          groupId: s.groupId,
          name: `${parseGroupTitle(group.title)} > ${s.id}`,
        })),
      ]
    }, [])
    return res.send({ steps: emptyWebhookBlocks })
  }
  return methodNotAllowed(res)
}

export default handler
