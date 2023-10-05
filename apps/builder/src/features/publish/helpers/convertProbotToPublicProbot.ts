import { createId } from '@paralleldrive/cuid2'
import { PublicProbot, Probot } from '@typebot.io/schemas'

export const convertProbotToPublicProbot = (
  probot: Probot
): PublicProbot => ({
  id: createId(),
  version: probot.version,
  probotId: probot.id,
  groups: probot.groups,
  edges: probot.edges,
  settings: probot.settings,
  theme: probot.theme,
  variables: probot.variables,
  createdAt: new Date(),
  updatedAt: new Date(),
})
