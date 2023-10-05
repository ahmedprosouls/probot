import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Group } from '@typebot.io/schemas'
import { z } from 'zod'
import { archiveResults } from '@typebot.io/lib/api/helpers/archiveResults'
import prisma from '@typebot.io/lib/prisma'
import { isWriteProbotForbidden } from '@/features/probot/helpers/isWriteProbotForbidden'

export const deleteResults = authenticatedProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/probots/{probotId}/results',
      protect: true,
      summary: 'Delete results',
      tags: ['Results'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      resultIds: z
        .string()
        .describe(
          'Comma separated list of ids. If not provided, all results will be deleted. ⚠️'
        )
        .optional(),
    })
  )
  .output(z.void())
  .mutation(async ({ input, ctx: { user } }) => {
    const idsArray = input.resultIds?.split(',')
    const { probotId } = input
    const probot = await prisma.probot.findUnique({
      where: {
        id: probotId,
      },
      select: {
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
    if (!probot || (await isWriteProbotForbidden(probot, user)))
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })
    const { success } = await archiveResults(prisma)({
      probot: {
        groups: probot.groups as Group[],
      },
      resultsFilter: {
        id: (idsArray?.length ?? 0) > 0 ? { in: idsArray } : undefined,
        probotId,
      },
    })

    if (!success)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Probot not found',
      })
  })
