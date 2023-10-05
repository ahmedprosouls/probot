import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { ResultWithAnswers, resultWithAnswersSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '@/features/probot/helpers/isReadProbotForbidden'

const maxLimit = 200

export const getResults = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/results',
      protect: true,
      summary: 'List results ordered by descending creation date',
      tags: ['Results'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      limit: z.string().regex(/^[0-9]{1,3}$/),
      cursor: z.string().optional(),
    })
  )
  .output(
    z.object({
      results: z.array(resultWithAnswersSchema),
      nextCursor: z.string().nullish(),
    })
  )
  .query(async ({ input, ctx: { user } }) => {
    const limit = Number(input.limit)
    if (limit < 1 || limit > maxLimit)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'limit must be between 1 and 200',
      })
    const { cursor } = input
    const probot = await prisma.probot.findUnique({
      where: {
        id: input.probotId,
      },
      select: {
        id: true,
        workspaceId: true,
        groups: true,
        collaborators: {
          select: {
            userId: true,
            type: true,
          },
        },
      },
    })
    if (!probot || (await isReadProbotForbidden(probot, user)))
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })
    const results = (await prisma.result.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        probotId: probot.id,
        hasStarted: true,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: { answers: true },
    })) as ResultWithAnswers[]

    let nextCursor: typeof cursor | undefined
    if (results.length > limit) {
      const nextResult = results.pop()
      nextCursor = nextResult?.id
    }

    return { results, nextCursor }
  })
