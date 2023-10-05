import prisma from '@typebot.io/lib/prisma'
import { Plan } from '@typebot.io/prisma'
import {
  Block,
  InputBlockType,
  IntegrationBlockType,
  Probot,
} from '@typebot.io/schemas'

export const sanitizeSettings = (
  settings: Probot['settings'],
  workspacePlan: Plan
): Probot['settings'] => ({
  ...settings,
  general: {
    ...settings.general,
    isBrandingEnabled:
      workspacePlan === Plan.FREE ? false : settings.general.isBrandingEnabled,
  },
})

export const sanitizeGroups =
  (workspaceId: string) =>
  async (groups: Probot['groups']): Promise<Probot['groups']> =>
    Promise.all(
      groups.map(async (group) => ({
        ...group,
        blocks: await Promise.all(group.blocks.map(sanitizeBlock(workspaceId))),
      }))
    )

const sanitizeBlock =
  (workspaceId: string) =>
  async (block: Block): Promise<Block> => {
    switch (block.type) {
      case InputBlockType.PAYMENT:
        return {
          ...block,
          options: {
            ...block.options,
            credentialsId: await sanitizeCredentialsId(workspaceId)(
              block.options.credentialsId
            ),
          },
        }
      case IntegrationBlockType.GOOGLE_SHEETS:
        return {
          ...block,
          options: {
            ...block.options,
            credentialsId: await sanitizeCredentialsId(workspaceId)(
              block.options.credentialsId
            ),
          },
        }
      case IntegrationBlockType.OPEN_AI:
        return {
          ...block,
          options: {
            ...block.options,
            credentialsId: await sanitizeCredentialsId(workspaceId)(
              block.options.credentialsId
            ),
          },
        }
      case IntegrationBlockType.EMAIL:
        return {
          ...block,
          options: {
            ...block.options,
            credentialsId:
              (await sanitizeCredentialsId(workspaceId)(
                block.options.credentialsId
              )) ?? 'default',
          },
        }
      default:
        return block
    }
  }

const sanitizeCredentialsId =
  (workspaceId: string) =>
  async (credentialsId?: string): Promise<string | undefined> => {
    if (!credentialsId) return
    const credentials = await prisma.credentials.findFirst({
      where: {
        id: credentialsId,
        workspaceId,
      },
      select: {
        id: true,
      },
    })
    return credentials?.id
  }

export const isPublicIdNotAvailable = async (publicId: string) => {
  const probotWithSameIdCount = await prisma.probot.count({
    where: {
      publicId,
    },
  })
  return probotWithSameIdCount > 0
}

export const isCustomDomainNotAvailable = async (customDomain: string) => {
  const probotWithSameDomainCount = await prisma.probot.count({
    where: {
      customDomain,
    },
  })

  return probotWithSameDomainCount > 0
}
