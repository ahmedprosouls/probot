import prisma from '@typebot.io/lib/prisma'
import { canReadProbots } from '@/helpers/databaseRules'
import { User } from '@typebot.io/prisma'
import { LogicBlockType, PublicProbot, Probot } from '@typebot.io/schemas'

export const fetchLinkedProbots = async (
  probot: Pick<PublicProbot, 'groups'>,
  user?: User
): Promise<(Probot | PublicProbot)[]> => {
  const linkedProbotIds = probot.groups
    .flatMap((group) => group.blocks)
    .reduce<string[]>((probotIds, block) => {
      if (block.type !== LogicBlockType.PROBOT_LINK) return probotIds
      const probotId = block.options.probotId
      if (!probotId) return probotIds
      return probotIds.includes(probotId)
        ? probotIds
        : [...probotIds, probotId]
    }, [])
  if (linkedProbotIds.length === 0) return []
  const probots = (await ('probotId' in probot
    ? prisma.publicProbot.findMany({
        where: { id: { in: linkedProbotIds } },
      })
    : prisma.probot.findMany({
        where: user
          ? {
              AND: [
                { id: { in: linkedProbotIds } },
                canReadProbots(linkedProbotIds, user as User),
              ],
            }
          : { id: { in: linkedProbotIds } },
      }))) as (Probot | PublicProbot)[]
  return probots
}
