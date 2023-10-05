import { Invitation } from '@typebot.io/prisma'
import { sendRequest } from '@typebot.io/lib'

export const updateInvitationQuery = (
  probotId: string,
  email: string,
  invitation: Omit<Invitation, 'createdAt' | 'id' | 'updatedAt'>
) =>
  sendRequest({
    method: 'PATCH',
    url: `/api/probots/${probotId}/invitations/${email}`,
    body: invitation,
  })
