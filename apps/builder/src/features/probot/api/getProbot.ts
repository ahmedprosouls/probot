import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Probot, probotSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '../helpers/isReadProbotForbidden'
import { migrateProbotFromV3ToV4 } from '@typebot.io/lib/migrations/migrateProbotFromV3ToV4'

export const getProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}',
      protect: true,
      summary: 'Get a probot',
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
      probot: probotSchema,
      isReadOnly: z.boolean(),
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

    try {
      const parsedProbot = await migrateProbot(
        probotSchema.parse(existingProbot)
      )

      return {
        probot: parsedProbot,
        isReadOnly:
          existingProbot.collaborators.find(
            (collaborator) => collaborator.userId === user.id
          )?.type === 'READ' ?? false,
      }
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse probot',
        cause: err,
      })
    }
  })

const migrateProbot = async (probot: Probot): Promise<Probot> => {
  if (['4', '5'].includes(probot.version ?? '')) return probot
  return migrateProbotFromV3ToV4(prisma)(probot)
}
