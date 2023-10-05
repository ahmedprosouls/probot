import prisma from '@typebot.io/lib/prisma'
import { canWriteProbots } from '@/helpers/databaseRules'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Probot, Webhook, WebhookBlock } from '@typebot.io/schemas'
import { byId, isWebhookBlock } from '@typebot.io/lib'
import { z } from 'zod'

export const unsubscribeWebhook = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/probots/{probotId}/webhookBlocks/{blockId}/unsubscribe',
      protect: true,
      summary: 'Unsubscribe from webhook block',
      tags: ['Webhook'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      blockId: z.string(),
    })
  )
  .output(
    z.object({
      id: z.string(),
      url: z.string().nullable(),
    })
  )
  .query(async ({ input: { probotId, blockId }, ctx: { user } }) => {
    const probot = (await prisma.probot.findFirst({
      where: canWriteProbots(probotId, user),
      select: {
        groups: true,
        webhooks: true,
      },
    })) as (Pick<Probot, 'groups'> & { webhooks: Webhook[] }) | null

    if (!probot)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    const webhookBlock = probot.groups
      .flatMap((g) => g.blocks)
      .find(byId(blockId)) as WebhookBlock | null

    if (!webhookBlock || !isWebhookBlock(webhookBlock))
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Webhook block not found',
      })

    if (webhookBlock.webhookId)
      await prisma.webhook.update({
        where: { id: webhookBlock.webhookId },
        data: { url: null },
      })
    else {
      if (!webhookBlock.options.webhook)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook block not found',
        })
      const updatedGroups = probot.groups.map((group) =>
        group.id !== webhookBlock.groupId
          ? group
          : {
              ...group,
              blocks: group.blocks.map((block) =>
                block.id !== webhookBlock.id
                  ? block
                  : {
                      ...block,
                      options: {
                        ...webhookBlock.options,
                        webhook: {
                          ...webhookBlock.options.webhook,
                          url: undefined,
                        },
                      },
                    }
              ),
            }
      )
      await prisma.probot.updateMany({
        where: { id: probotId },
        data: {
          groups: updatedGroups,
        },
      })
    }

    return {
      id: blockId,
      url: null,
    }
  })
