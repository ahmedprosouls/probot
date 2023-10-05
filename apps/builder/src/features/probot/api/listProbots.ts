import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { WorkspaceRole } from '@typebot.io/prisma'
import { PublicProbot, Probot, probotSchema } from '@typebot.io/schemas'
import { omit } from '@typebot.io/lib'
import { z } from 'zod'
import { getUserRoleInWorkspace } from '@/features/workspace/helpers/getUserRoleInWorkspace'

export const listProbots = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots',
      protect: true,
      summary: 'List probots',
      tags: ['Probot'],
    },
  })
  .input(z.object({ workspaceId: z.string(), folderId: z.string().optional() }))
  .output(
    z.object({
      probots: z.array(
        probotSchema._def.schema
          .pick({
            name: true,
            icon: true,
            id: true,
          })
          .merge(z.object({ publishedProbotId: z.string().optional() }))
      ),
    })
  )
  .query(async ({ input: { workspaceId, folderId }, ctx: { user } }) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { members: true },
    })
    const userRole = getUserRoleInWorkspace(user.id, workspace?.members)
    if (userRole === undefined)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })
    const probots = (await prisma.probot.findMany({
      where: {
        isArchived: { not: true },
        folderId:
          userRole === WorkspaceRole.GUEST
            ? undefined
            : folderId === 'root'
            ? null
            : folderId,
        workspaceId,
        collaborators:
          userRole === WorkspaceRole.GUEST
            ? { some: { userId: user.id } }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        publishedProbot: { select: { id: true } },
        id: true,
        icon: true,
      },
    })) as (Pick<Probot, 'name' | 'id' | 'icon'> & {
      publishedProbot: Pick<PublicProbot, 'id'>
    })[]

    if (!probots)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No probots found' })

    return {
      probots: probots.map((probot) => ({
        publishedProbotId: probot.publishedProbot?.id,
        ...omit(probot, 'publishedProbot'),
      })),
    }
  })
