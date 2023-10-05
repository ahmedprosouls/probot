import { Invitation, PrismaClient, WorkspaceRole } from '@typebot.io/prisma'

export type InvitationWithWorkspaceId = Invitation & {
  probot: {
    workspaceId: string | null
  }
}

export const convertInvitationsToCollaborations = async (
  p: PrismaClient,
  { id, email }: { id: string; email: string },
  invitations: InvitationWithWorkspaceId[]
) => {
  await p.collaboratorsOnProbots.createMany({
    data: invitations.map((invitation) => ({
      probotId: invitation.probotId,
      type: invitation.type,
      userId: id,
    })),
  })
  const workspaceInvitations = invitations.reduce<InvitationWithWorkspaceId[]>(
    (acc, invitation) =>
      acc.some(
        (inv) => inv.probot.workspaceId === invitation.probot.workspaceId
      )
        ? acc
        : [...acc, invitation],
    []
  )
  for (const invitation of workspaceInvitations) {
    if (!invitation.probot.workspaceId) continue
    await p.memberInWorkspace.createMany({
      data: [
        {
          userId: id,
          workspaceId: invitation.probot.workspaceId,
          role: WorkspaceRole.GUEST,
        },
      ],
      skipDuplicates: true,
    })
  }
  return p.invitation.deleteMany({
    where: {
      email,
    },
  })
}
