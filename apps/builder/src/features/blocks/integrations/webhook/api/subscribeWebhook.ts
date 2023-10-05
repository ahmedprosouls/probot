import prisma from '@typebot.io/lib/prisma'
import { canWriteProbots } from '@/helpers/databaseRules'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Probot, WebhookBlock } from '@typebot.io/schemas'
import { byId, isWebhookBlock } from '@typebot.io/lib'
import { z } from 'zod'
import { HttpMethod } from '@typebot.io/schemas/features/blocks/integrations/webhook/enums'

export const subscribeWebhook = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/probots/{probotId}/webhookBlocks/{blockId}/subscribe',
      protect: true,
      summary: 'Subscribe to webhook block',
      tags: ['Webhook'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      blockId: z.string(),
      url: z.string(),
    })
  )
  .output(
    z.object({
      id: z.string(),
      url: z.string().nullable(),
    })
  )
  .query(async ({ input: { probotId, blockId, url }, ctx: { user } }) => {
    const probot = (await prisma.probot.findFirst({
      where: canWriteProbots(probotId, user),
      select: {
        groups: true,
      },
    })) as Pick<Probot, 'groups'> | null

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

    const newWebhook = {
      id: webhookBlock.webhookId ?? webhookBlock.id,
      url,
      body: '{{state}}',
      method: HttpMethod.POST,
      headers: [],
      queryParams: [],
    }

    if (webhookBlock.webhookId)
      await prisma.webhook.upsert({
        where: { id: webhookBlock.webhookId },
        update: { url, body: newWebhook.body, method: newWebhook.method },
        create: {
          probotId,
          ...newWebhook,
        },
      })
    else {
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
                        webhook: newWebhook,
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
      url,
    }
  })
