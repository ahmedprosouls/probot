import prisma from '@typebot.io/lib/prisma'
import { canReadProbots } from '@/helpers/databaseRules'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Group, IntegrationBlockType, Probot } from '@typebot.io/schemas'
import { byId, isWebhookBlock, parseGroupTitle } from '@typebot.io/lib'
import { z } from 'zod'
import { Webhook } from '@typebot.io/prisma'

export const listWebhookBlocks = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/webhookBlocks',
      protect: true,
      summary: 'List webhook blocks',
      description:
        'Returns a list of all the webhook blocks that you can subscribe to.',
      tags: ['Webhook'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
    })
  )
  .output(
    z.object({
      webhookBlocks: z.array(
        z.object({
          id: z.string(),
          type: z.enum([
            IntegrationBlockType.WEBHOOK,
            IntegrationBlockType.ZAPIER,
            IntegrationBlockType.MAKE_COM,
            IntegrationBlockType.PABBLY_CONNECT,
          ]),
          label: z.string(),
          url: z.string().optional(),
        })
      ),
    })
  )
  .query(async ({ input: { probotId }, ctx: { user } }) => {
    const probot = (await prisma.probot.findFirst({
      where: canReadProbots(probotId, user),
      select: {
        groups: true,
        webhooks: true,
      },
    })) as (Pick<Probot, 'groups'> & { webhooks: Webhook[] }) | null
    if (!probot)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    const webhookBlocks = (probot?.groups as Group[]).reduce<
      {
        id: string
        label: string
        url: string | undefined
        type:
          | IntegrationBlockType.WEBHOOK
          | IntegrationBlockType.ZAPIER
          | IntegrationBlockType.MAKE_COM
          | IntegrationBlockType.PABBLY_CONNECT
      }[]
    >((webhookBlocks, group) => {
      const blocks = group.blocks.filter(isWebhookBlock)
      return [
        ...webhookBlocks,
        ...blocks.map((block) => ({
          id: block.id,
          type: block.type,
          label: `${parseGroupTitle(group.title)} > ${block.id}`,
          url: block.options.webhook
            ? block.options.webhook.url
            : probot?.webhooks.find(byId(block.webhookId))?.url ?? undefined,
        })),
      ]
    }, [])

    return { webhookBlocks }
  })
