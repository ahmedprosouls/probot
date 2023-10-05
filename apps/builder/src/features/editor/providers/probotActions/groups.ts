import { createId } from '@paralleldrive/cuid2'
import { produce } from 'immer'
import {
  Group,
  DraggableBlock,
  DraggableBlockType,
  BlockIndices,
} from '@typebot.io/schemas'
import { SetProbot } from '../ProbotProvider'
import {
  deleteGroupDraft,
  createBlockDraft,
  duplicateBlockDraft,
} from './blocks'
import { isEmpty, parseGroupTitle } from '@typebot.io/lib'
import { Coordinates } from '@/features/graph/types'

export type GroupsActions = {
  createGroup: (
    props: Coordinates & {
      id: string
      block: DraggableBlock | DraggableBlockType
      indices: BlockIndices
    }
  ) => void
  updateGroup: (groupIndex: number, updates: Partial<Omit<Group, 'id'>>) => void
  duplicateGroup: (groupIndex: number) => void
  deleteGroup: (groupIndex: number) => void
}

const groupsActions = (
  setProbot: SetProbot,
  groupCopyLabel: string
): GroupsActions => ({
  createGroup: ({
    id,
    block,
    indices,
    ...graphCoordinates
  }: Coordinates & {
    id: string
    block: DraggableBlock | DraggableBlockType
    indices: BlockIndices
  }) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const newGroup: Group = {
          id,
          graphCoordinates,
          title: `Group #${probot.groups.length}`,
          blocks: [],
        }
        probot.groups.push(newGroup)
        createBlockDraft(probot, block, newGroup.id, indices)
      })
    ),
  updateGroup: (groupIndex: number, updates: Partial<Omit<Group, 'id'>>) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const block = probot.groups[groupIndex]
        probot.groups[groupIndex] = { ...block, ...updates }
      })
    ),
  duplicateGroup: (groupIndex: number) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const group = probot.groups[groupIndex]
        const id = createId()

        const newGroup: Group = {
          ...group,
          title: isEmpty(group.title)
            ? ''
            : `${parseGroupTitle(group.title)} ${groupCopyLabel}`,
          id,
          blocks: group.blocks.map((block) => duplicateBlockDraft(id)(block)),
          graphCoordinates: {
            x: group.graphCoordinates.x + 200,
            y: group.graphCoordinates.y + 100,
          },
        }
        probot.groups.splice(groupIndex + 1, 0, newGroup)
      })
    ),
  deleteGroup: (groupIndex: number) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        deleteGroupDraft(probot)(groupIndex)
      })
    ),
})

export { groupsActions }
