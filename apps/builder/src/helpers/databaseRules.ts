import {
  CollaborationType,
  Plan,
  Prisma,
  User,
  WorkspaceRole,
} from '@typebot.io/prisma'
import prisma from '@typebot.io/lib/prisma'
import { NextApiResponse } from 'next'
import { forbidden } from '@typebot.io/lib/api'
import { env } from '@typebot.io/env'

export const canWriteProbots = (
  probotIds: string[] | string,
  user: Pick<User, 'email' | 'id'>
): Prisma.ProbotWhereInput =>
  env.NEXT_PUBLIC_E2E_TEST
    ? { id: typeof probotIds === 'string' ? probotIds : { in: probotIds } }
    : {
        id: typeof probotIds === 'string' ? probotIds : { in: probotIds },
        OR: [
          {
            workspace: {
              members: {
                some: { userId: user.id, role: { not: WorkspaceRole.GUEST } },
              },
            },
          },
          {
            collaborators: {
              some: { userId: user.id, type: { not: CollaborationType.READ } },
            },
          },
        ],
      }

export const canReadProbots = (
  probotIds: string | string[],
  user: Pick<User, 'email' | 'id'>
) => ({
  id: typeof probotIds === 'string' ? probotIds : { in: probotIds },
  workspace:
    user.email === env.ADMIN_EMAIL || env.NEXT_PUBLIC_E2E_TEST
      ? undefined
      : {
          members: {
            some: { userId: user.id },
          },
        },
})

export const canEditGuests = (user: User, probotId: string) => ({
  id: probotId,
  workspace: {
    members: {
      some: { userId: user.id, role: { not: WorkspaceRole.GUEST } },
    },
  },
})

export const canPublishFileInput = async ({
  userId,
  workspaceId,
  res,
}: {
  userId: string
  workspaceId: string
  res: NextApiResponse
}) => {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, members: { some: { userId } } },
    select: { plan: true },
  })
  if (!workspace) {
    forbidden(res, 'workspace not found')
    return false
  }
  if (workspace?.plan === Plan.FREE) {
    forbidden(res, 'You need to upgrade your plan to use file input blocks')
    return false
  }
  return true
}

export const isUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error &&
  'code' in error &&
  error.code === 'P2002'
