import prisma from '@typebot.io/lib/prisma'
import {
  CollaborationType,
  CollaboratorsOnProbots,
  User,
} from '@typebot.io/prisma'
import { Probot } from '@typebot.io/schemas'
import { isNotDefined } from '@typebot.io/lib'

export const isWriteProbotForbidden = async (
  probot: Pick<Probot, 'workspaceId'> & {
    collaborators: Pick<CollaboratorsOnProbots, 'userId' | 'type'>[]
  },
  user: Pick<User, 'id'>
) => {
  if (
    probot.collaborators.find(
      (collaborator) => collaborator.userId === user.id
    )?.type === CollaborationType.WRITE
  )
    return false
  const memberInWorkspace = await prisma.memberInWorkspace.findFirst({
    where: {
      workspaceId: probot.workspaceId,
      userId: user.id,
    },
  })
  return isNotDefined(memberInWorkspace) || memberInWorkspace.role === 'GUEST'
}
