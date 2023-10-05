import prisma from '@typebot.io/lib/prisma'
import { env } from '@typebot.io/env'
import { CollaboratorsOnProbots, User } from '@typebot.io/prisma'
import { Probot } from '@typebot.io/schemas'

export const isReadProbotForbidden = async (
  probot: Pick<Probot, 'workspaceId'> & {
    collaborators: Pick<CollaboratorsOnProbots, 'userId'>[]
  },
  user: Pick<User, 'email' | 'id'>
) => {
  if (
    env.ADMIN_EMAIL === user.email ||
    probot.collaborators.find(
      (collaborator) => collaborator.userId === user.id
    )
  )
    return false
  const memberInWorkspace = await prisma.memberInWorkspace.findFirst({
    where: {
      workspaceId: probot.workspaceId,
      userId: user.id,
    },
  })
  return memberInWorkspace === null
}
