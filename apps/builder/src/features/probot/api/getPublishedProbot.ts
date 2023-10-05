import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { publicProbotSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '../helpers/isReadProbotForbidden'

export const getPublishedProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/publishedProbot',
      protect: true,
      summary: 'Get published probot',
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
      publishedProbot: publicProbotSchema.nullable(),
    })
  )
  .query(async ({ input: { probotId }, ctx: { user } }) => {
    const existingProbot = await prisma.probot.findFirst({
      where: {
        id: probotId,
      },
      include: {
        collaborators: true,
        publishedProbot: true,
      },
    })
    if (
      !existingProbot?.id ||
      (await isReadProbotForbidden(existingProbot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    if (!existingProbot.publishedProbot)
      return {
        publishedProbot: null,
      }

    try {
      const parsedProbot = publicProbotSchema.parse(
        existingProbot.publishedProbot
      )

      return {
        publishedProbot: parsedProbot,
      }
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse published probot',
        cause: err,
      })
    }
  })
