import prisma from '@typebot.io/lib/prisma'
import { canReadProbots } from '@/helpers/databaseRules'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Probot } from '@typebot.io/schemas'
import { z } from 'zod'
import { fetchLinkedProbots } from '@/features/blocks/logic/probotLink/helpers/fetchLinkedProbots'
import { parseResultExample } from '../helpers/parseResultExample'

export const getResultExample = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/webhookBlocks/{blockId}/getResultExample',
      protect: true,
      summary: 'Get result example',
      description:
        'Returns "fake" result for webhook block to help you anticipate how the webhook will behave.',
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
      resultExample: z
        .object({
          message: z.literal(
            'This is a sample result, it has been generated ⬇️'
          ),
          'Submitted at': z.string(),
        })
        .and(z.record(z.string().optional()))
        .describe('Can contain any fields.'),
    })
  )
  .query(async ({ input: { probotId, blockId }, ctx: { user } }) => {
    const probot = (await prisma.probot.findFirst({
      where: canReadProbots(probotId, user),
      select: {
        groups: true,
        edges: true,
        variables: true,
      },
    })) as Pick<Probot, 'groups' | 'edges' | 'variables'> | null

    if (!probot)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    const block = probot.groups
      .flatMap((group) => group.blocks)
      .find((block) => block.id === blockId)

    if (!block)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Block not found' })

    const linkedProbots = await fetchLinkedProbots(probot, user)

    return {
      resultExample: await parseResultExample({
        probot,
        linkedProbots,
        userEmail: user.email ?? 'test@email.com',
      })(block.groupId),
    }
  })
