import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { PublicProbot } from '@typebot.io/schemas'
import { z } from 'zod'
import { canReadProbots } from '@/helpers/databaseRules'
import { totalAnswersInBlock } from '@typebot.io/schemas/features/analytics'

export const getTotalAnswersInBlocks = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/analytics/totalAnswersInBlocks',
      protect: true,
      summary: 'List total answers in blocks',
      tags: ['Analytics'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
    })
  )
  .output(z.object({ totalAnswersInBlocks: z.array(totalAnswersInBlock) }))
  .query(async ({ input: { probotId }, ctx: { user } }) => {
    const probot = await prisma.probot.findFirst({
      where: canReadProbots(probotId, user),
      select: { publishedProbot: true },
    })
    if (!probot?.publishedProbot)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Published probot not found',
      })

    const publishedProbot = probot.publishedProbot as PublicProbot

    const totalAnswersPerBlock = await prisma.answer.groupBy({
      by: ['itemId', 'blockId'],
      where: {
        result: {
          probotId: probot.publishedProbot.probotId,
        },
        blockId: {
          in: publishedProbot.groups.flatMap((group) =>
            group.blocks.map((block) => block.id)
          ),
        },
      },
      _count: { _all: true },
    })

    return {
      totalAnswersInBlocks: totalAnswersPerBlock.map((answer) => ({
        blockId: answer.blockId,
        itemId: answer.itemId ?? undefined,
        total: answer._count._all,
      })),
    }
  })
