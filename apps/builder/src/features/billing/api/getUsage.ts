import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { isReadWorkspaceFobidden } from '@/features/workspace/helpers/isReadWorkspaceFobidden'

export const getUsage = authenticatedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/billing/usage',
      protect: true,
      summary: 'Get current plan usage',
      tags: ['Billing'],
    },
  })
  .input(
    z.object({
      workspaceId: z.string(),
    })
  )
  .output(z.object({ totalChatsUsed: z.number() }))
  .query(async ({ input: { workspaceId }, ctx: { user } }) => {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
      },
      select: {
        members: {
          select: {
            userId: true,
          },
        },
        probots: {
          select: { id: true },
        },
      },
    })
    if (!workspace || isReadWorkspaceFobidden(workspace, user))
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      })

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalChatsUsed = await prisma.result.count({
      where: {
        probotId: { in: workspace.probots.map((probot) => probot.id) },
        hasStarted: true,
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    })

    return {
      totalChatsUsed,
    }
  })