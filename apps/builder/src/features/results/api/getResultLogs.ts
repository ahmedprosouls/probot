import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { logSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '@/features/probot/helpers/isReadProbotForbidden'

export const getResultLogs = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/results/{resultId}/logs',
      protect: true,
      summary: 'List result logs',
      tags: ['Results'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      resultId: z.string(),
    })
  )
  .output(z.object({ logs: z.array(logSchema) }))
  .query(async ({ input: { probotId, resultId }, ctx: { user } }) => {
    const probot = await prisma.probot.findUnique({
      where: {
        id: probotId,
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
      throw new Error('Probot not found')
    const logs = await prisma.log.findMany({
      where: {
        resultId,
      },
    })

    return { logs }
  })
