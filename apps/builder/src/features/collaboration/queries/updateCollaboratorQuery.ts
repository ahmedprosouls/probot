import { CollaboratorsOnProbots } from '@typebot.io/prisma'
import { sendRequest } from '@typebot.io/lib'

export const updateCollaboratorQuery = (
  probotId: string,
  userId: string,
  collaborator: Omit<CollaboratorsOnProbots, 'createdAt' | 'updatedAt'>
) =>
  sendRequest({
    method: 'PATCH',
    url: `/api/probots/${probotId}/collaborators/${userId}`,
    body: collaborator,
  })
