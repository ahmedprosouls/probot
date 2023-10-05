import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { isWriteProbotForbidden } from '../helpers/isWriteProbotForbidden'

export const unpublishProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/probots/{probotId}/unpublish',
      protect: true,
      summary: 'Unpublish a probot',
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
      include: {
        collaborators: true,
        publishedProbot: true,
      },
    })
    if (!existingProbot?.publishedProbot)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Published probot not found',
      })

    if (
      !existingProbot.id ||
      (await isWriteProbotForbidden(existingProbot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    await prisma.publicProbot.deleteMany({
      where: {
        id: existingProbot.publishedProbot.id,
      },
    })

    return { message: 'success' }
  })
