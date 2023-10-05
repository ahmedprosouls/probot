import { CollaborationType } from '@typebot.io/prisma'
import { sendRequest } from '@typebot.io/lib'

export const sendInvitationQuery = (
  probotId: string,
  { email, type }: { email: string; type: CollaborationType }
) =>
  sendRequest({
    method: 'POST',
    url: `/api/probots/${probotId}/invitations`,
    body: { email, type },
  })
