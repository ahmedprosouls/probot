import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { ResultWithAnswers, resultWithAnswersSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '@/features/probot/helpers/isReadProbotForbidden'

export const getResult = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/results/{resultId}',
      protect: true,
      summary: 'Get result by id',
      tags: ['Results'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      resultId: z.string(),
    })
  )
  .output(
    z.object({
      result: resultWithAnswersSchema,
    })
  )
  .query(async ({ input, ctx: { user } }) => {
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
      where: {
        id: input.resultId,
        probotId: probot.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: { answers: true },
    })) as ResultWithAnswers[]

    if (results.length === 0)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Result not found' })

    return { result: results[0] }
  })
