import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Group } from '@typebot.io/schemas'
import { z } from 'zod'
import { isWriteProbotForbidden } from '../helpers/isWriteProbotForbidden'
import { archiveResults } from '@typebot.io/lib/api/helpers/archiveResults'

export const deleteProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/probots/{probotId}',
      protect: true,
      summary: 'Delete a probot',
      tags: ['Probot'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
    })
  )
  .output(
    z.object({
      message: z.literal('success'),
    })
  )
  .mutation(async ({ input: { probotId }, ctx: { user } }) => {
    const existingProbot = await prisma.probot.findFirst({
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
    if (
      !existingProbot?.id ||
      (await isWriteProbotForbidden(existingProbot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    const { success } = await archiveResults(prisma)({
      probot: {
        groups: existingProbot.groups as Group[],
      },
      resultsFilter: { probotId },
    })
    if (!success)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to archive results',
      })
    await prisma.publicProbot.deleteMany({
      where: { probotId },
    })
    await prisma.probot.updateMany({
      where: { id: probotId },
      data: { isArchived: true, publicId: null, customDomain: null },
    })
    return {
      message: 'success',
    }
  })
