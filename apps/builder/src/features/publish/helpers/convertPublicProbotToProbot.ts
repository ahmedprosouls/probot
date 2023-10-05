import { PublicProbot, Probot } from '@typebot.io/schemas'

export const convertPublicProbotToProbot = (
  probot: PublicProbot,
  existingProbot: Probot
): Probot => ({
  id: probot.probotId,
  version: probot.version,
  groups: probot.groups,
  edges: probot.edges,
  name: existingProbot.name,
  publicId: existingProbot.publicId,
  settings: probot.settings,
  theme: probot.theme,
  variables: probot.variables,
  customDomain: existingProbot.customDomain,
  createdAt: existingProbot.createdAt,
  updatedAt: existingProbot.updatedAt,
  folderId: existingProbot.folderId,
  icon: existingProbot.icon,
  workspaceId: existingProbot.workspaceId,
  isArchived: existingProbot.isArchived,
  isClosed: existingProbot.isClosed,
  resultsTablePreferences: existingProbot.resultsTablePreferences,
  selectedThemeTemplateId: existingProbot.selectedThemeTemplateId,
  whatsAppCredentialsId: existingProbot.whatsAppCredentialsId,
})
