import { CollaboratorsOnProbots } from '@typebot.io/prisma'

export type Collaborator = CollaboratorsOnProbots & {
  user: {
    name: string | null
    image: string | null
    email: string | null
  }
}
