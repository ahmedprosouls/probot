import { sendRequest } from '@typebot.io/lib'

export const deleteInvitationQuery = (probotId: string, email: string) =>
  sendRequest({
    method: 'DELETE',
    url: `/api/probots/${probotId}/invitations/${email}`,
  })
