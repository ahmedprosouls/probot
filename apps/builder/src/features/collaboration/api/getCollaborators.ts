import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { collaboratorSchema } from '@typebot.io/schemas/features/collaborators'
import { isReadProbotForbidden } from '@/features/probot/helpers/isReadProbotForbidden'

export const getCollaborators = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/collaborators',
      protect: true,
      summary: 'Get collaborators',
      tags: ['Collaborators'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
    })
  )
  .output(
    z.object({
      collaborators: z.array(collaboratorSchema),
    })
  )
  .query(async ({ input: { probotId }, ctx: { user } }) => {
    const existingProbot = await prisma.probot.findFirst({
      where: {
        id: probotId,
      },
      include: {
        collaborators: true,
      },
    })
    if (
      !existingProbot?.id ||
      (await isReadProbotForbidden(existingProbot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    return {
      collaborators: existingProbot.collaborators,
    }
  })
