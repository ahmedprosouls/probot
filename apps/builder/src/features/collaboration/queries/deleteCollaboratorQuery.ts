import { sendRequest } from '@typebot.io/lib'

export const deleteCollaboratorQuery = (probotId: string, userId: string) =>
  sendRequest({
    method: 'DELETE',
    url: `/api/probots/${probotId}/collaborators/${userId}`,
  })
