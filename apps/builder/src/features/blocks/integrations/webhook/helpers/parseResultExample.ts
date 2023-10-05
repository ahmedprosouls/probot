import {
  InputBlock,
  InputBlockType,
  LogicBlockType,
  PublicProbot,
  ResultHeaderCell,
  Block,
  Probot,
  ProbotLinkBlock,
} from '@typebot.io/schemas'
import { isInputBlock, byId, isNotDefined } from '@typebot.io/lib'
import { parseResultHeader } from '@typebot.io/lib/results'

export const parseResultExample =
  ({
    probot,
    linkedProbots,
    userEmail,
  }: {
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
    linkedProbots: (Probot | PublicProbot)[]
    userEmail: string
  }) =>
  async (
    currentGroupId: string
  ): Promise<
    {
      message: 'This is a sample result, it has been generated ⬇️'
      'Submitted at': string
    } & { [k: string]: string | undefined }
  > => {
    const header = parseResultHeader(probot, linkedProbots)
    const linkedInputBlocks = await extractLinkedInputBlocks(
      probot,
      linkedProbots
    )(currentGroupId)

    return {
      message: 'This is a sample result, it has been generated ⬇️',
      'Submitted at': new Date().toISOString(),
      ...parseResultSample({
        inputBlocks: linkedInputBlocks,
        headerCells: header,
        userEmail,
      }),
    }
  }

const extractLinkedInputBlocks =
  (
    probot:
      | Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
      | undefined,
    linkedProbots: (Probot | PublicProbot)[]
  ) =>
  async (
    currentGroupId?: string,
    direction: 'backward' | 'forward' = 'backward'
  ): Promise<InputBlock[]> => {
    if (!probot) return []
    const previousLinkedProbotBlocks = walkEdgesAndExtract(
      'linkedBot',
      direction,
      probot
    )({
      groupId: currentGroupId,
    }) as ProbotLinkBlock[]

    const linkedBotInputs =
      previousLinkedProbotBlocks.length > 0
        ? await Promise.all(
            previousLinkedProbotBlocks.map((linkedBot) =>
              extractLinkedInputBlocks(
                linkedProbots.find((t) =>
                  'probotId' in t
                    ? t.probotId === linkedBot.options.probotId
                    : t.id === linkedBot.options.probotId
                ),
                linkedProbots
              )(linkedBot.options.groupId, 'forward')
            )
          )
        : []

    return (
      walkEdgesAndExtract(
        'input',
        direction,
        probot
      )({
        groupId: currentGroupId,
      }) as InputBlock[]
    ).concat(linkedBotInputs.flatMap((l) => l))
  }

const parseResultSample = ({
  inputBlocks,
  headerCells,
  userEmail,
}: {
  inputBlocks: InputBlock[]
  headerCells: ResultHeaderCell[]
  userEmail: string
}) =>
  headerCells.reduce<Record<string, string | undefined>>(
    (resultSample, cell) => {
      const inputBlock = inputBlocks.find((inputBlock) =>
        cell.blocks?.some((block) => block.id === inputBlock.id)
      )
      if (isNotDefined(inputBlock)) {
        if (cell.variableIds)
          return {
            ...resultSample,
            [cell.label]: 'content',
          }
        return resultSample
      }
      const value = getSampleValue({ block: inputBlock, userEmail })
      return {
        ...resultSample,
        [cell.label]: value,
      }
    },
    {}
  )

const getSampleValue = ({
  block,
  userEmail,
}: {
  block: InputBlock
  userEmail: string
}) => {
  switch (block.type) {
    case InputBlockType.CHOICE:
      return block.options.isMultipleChoice
        ? block.items.map((i) => i.content).join(', ')
        : block.items[0]?.content ?? 'Item'
    case InputBlockType.DATE:
      return new Date().toUTCString()
    case InputBlockType.EMAIL:
      return userEmail
    case InputBlockType.NUMBER:
      return '20'
    case InputBlockType.PHONE:
      return '+33665566773'
    case InputBlockType.TEXT:
      return 'answer value'
    case InputBlockType.URL:
      return 'https://test.com'
  }
}

const walkEdgesAndExtract =
  (
    type: 'input' | 'linkedBot',
    direction: 'backward' | 'forward',
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
  ) =>
  ({ groupId }: { groupId?: string }): Block[] => {
    const currentGroupId =
      groupId ??
      (probot.groups.find((b) => b.blocks[0].type === 'start')?.id as string)
    const blocksInGroup = extractBlocksInGroup(
      type,
      probot
    )({
      groupId: currentGroupId,
    })
    const otherGroupIds = getGroupIds(probot, direction)(currentGroupId)
    return [
      ...blocksInGroup,
      ...otherGroupIds.flatMap((groupId) =>
        extractBlocksInGroup(type, probot)({ groupId })
      ),
    ]
  }

const getGroupIds =
  (
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>,
    direction: 'backward' | 'forward',
    existingGroupIds?: string[]
  ) =>
  (groupId: string): string[] => {
    const groups = probot.edges.reduce<string[]>((groupIds, edge) => {
      if (direction === 'forward')
        return (!existingGroupIds ||
          !existingGroupIds?.includes(edge.to.groupId)) &&
          edge.from.groupId === groupId
          ? [...groupIds, edge.to.groupId]
          : groupIds
      return (!existingGroupIds ||
        !existingGroupIds.includes(edge.from.groupId)) &&
        edge.to.groupId === groupId
        ? [...groupIds, edge.from.groupId]
        : groupIds
    }, [])
    const newGroups = [...(existingGroupIds ?? []), ...groups]
    return groups.concat(
      groups.flatMap(getGroupIds(probot, direction, newGroups))
    )
  }

const extractBlocksInGroup =
  (
    type: 'input' | 'linkedBot',
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
  ) =>
  ({ groupId, blockId }: { groupId: string; blockId?: string }) => {
    const currentGroup = probot.groups.find(byId(groupId))
    if (!currentGroup) return []
    const blocks: Block[] = []
    for (const block of currentGroup.blocks) {
      if (block.id === blockId) break
      if (type === 'input' && isInputBlock(block)) blocks.push(block)
      if (type === 'linkedBot' && block.type === LogicBlockType.PROBOT_LINK)
        blocks.push(block)
    }
    return blocks
  }
