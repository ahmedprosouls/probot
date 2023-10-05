import { CollaborationType, WorkspaceRole } from '@typebot.io/prisma'
import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  canReadProbots,
  canWriteProbots,
  isUniqueConstraintError,
} from '@/helpers/databaseRules'
import {
  badRequest,
  forbidden,
  methodNotAllowed,
  notAuthenticated,
} from '@typebot.io/lib/api'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import { sendGuestInvitationEmail } from '@typebot.io/emails'
import { env } from '@typebot.io/env'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  const probotId = req.query.probotId as string | undefined
  if (!probotId) return badRequest(res)
  if (req.method === 'GET') {
    const invitations = await prisma.invitation.findMany({
      where: { probotId, probot: canReadProbots(probotId, user) },
    })
    return res.send({
      invitations,
    })
  }
  if (req.method === 'POST') {
    const probot = await prisma.probot.findFirst({
      where: canWriteProbots(probotId, user),
      include: { workspace: { select: { name: true } } },
    })
    if (!probot || !probot.workspaceId) return forbidden(res)
    const { email, type } =
      (req.body as
        | { email: string | undefined; type: CollaborationType | undefined }
        | undefined) ?? {}
    if (!email || !type) return badRequest(res)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (existingUser) {
      try {
        await prisma.collaboratorsOnProbots.create({
          data: {
            type,
            probotId,
            userId: existingUser.id,
          },
        })
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return res.status(400).send({
            message: 'User already has access to this probot.',
          })
        }
        throw error
      }

      await prisma.memberInWorkspace.upsert({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId: probot.workspaceId,
          },
        },
        create: {
          role: WorkspaceRole.GUEST,
          userId: existingUser.id,
          workspaceId: probot.workspaceId,
        },
        update: {},
      })
    } else
      await prisma.invitation.create({
        data: { email: email.toLowerCase().trim(), type, probotId },
      })
    if (!env.NEXT_PUBLIC_E2E_TEST)
      await sendGuestInvitationEmail({
        to: email,
        hostEmail: user.email ?? '',
        url: `${env.NEXTAUTH_URL}/probots?workspaceId=${probot.workspaceId}`,
        guestEmail: email.toLowerCase(),
        probotName: probot.name,
        workspaceName: probot.workspace?.name ?? '',
      })
    return res.send({
      message: 'success',
    })
  }
  methodNotAllowed(res)
}

export default handler
