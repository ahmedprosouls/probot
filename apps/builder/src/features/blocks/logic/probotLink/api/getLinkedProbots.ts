import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { LogicBlockType, probotSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isReadProbotForbidden } from '@/features/probot/helpers/isReadProbotForbidden'
import { isDefined } from '@typebot.io/lib'

export const getLinkedProbots = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/linkedProbots',
      protect: true,
      summary: 'Get linked probots',
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
      probots: z.array(
        probotSchema._def.schema.pick({
          id: true,
          groups: true,
          variables: true,
          name: true,
        })
      ),
    })
  )
  .query(async ({ input: { probotId }, ctx: { user } }) => {
    const probot = await prisma.probot.findFirst({
      where: {
        id: probotId,
      },
      select: {
        id: true,
        groups: true,
        variables: true,
        name: true,
        createdAt: true,
        workspaceId: true,
        collaborators: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    })

    if (!probot || (await isReadProbotForbidden(probot, user)))
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No probot found' })

    const linkedProbotIds =
      probotSchema._def.schema.shape.groups
        .parse(probot.groups)
        .flatMap((group) => group.blocks)
        .reduce<string[]>(
          (probotIds, block) =>
            block.type === LogicBlockType.PROBOT_LINK &&
            isDefined(block.options.probotId) &&
            !probotIds.includes(block.options.probotId) &&
            block.options.mergeResults !== false
              ? [...probotIds, block.options.probotId]
              : probotIds,
          []
        ) ?? []

    if (!linkedProbotIds.length) return { probots: [] }

    const probots = (
      await prisma.probot.findMany({
        where: {
          isArchived: { not: true },
          id: { in: linkedProbotIds },
        },
        select: {
          id: true,
          groups: true,
          variables: true,
          name: true,
          createdAt: true,
          workspaceId: true,
          collaborators: {
            select: {
              type: true,
              userId: true,
            },
          },
        },
      })
    )
      .filter(async (probot) => !(await isReadProbotForbidden(probot, user)))
      // To avoid the out of sort memory error, we sort the probots manually
      .sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      .map((probot) => ({
        ...probot,
        groups: probotSchema._def.schema.shape.groups.parse(probot.groups),
        variables: probotSchema._def.schema.shape.variables.parse(
          probot.variables
        ),
      }))

    return {
      probots,
    }
  })
