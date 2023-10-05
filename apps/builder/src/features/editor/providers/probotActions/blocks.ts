import {
  Block,
  Probot,
  DraggableBlock,
  DraggableBlockType,
  BlockIndices,
  Webhook,
} from '@typebot.io/schemas'
import { SetProbot } from '../ProbotProvider'
import { produce, Draft } from 'immer'
import { cleanUpEdgeDraft, deleteEdgeDraft } from './edges'
import { createId } from '@paralleldrive/cuid2'
import { byId, isWebhookBlock, blockHasItems } from '@typebot.io/lib'
import { duplicateItemDraft } from './items'
import { parseNewBlock } from '@/features/probot/helpers/parseNewBlock'

export type BlocksActions = {
  createBlock: (
    groupId: string,
    block: DraggableBlock | DraggableBlockType,
    indices: BlockIndices
  ) => void
  updateBlock: (
    indices: BlockIndices,
    updates: Partial<Omit<Block, 'id' | 'type'>>
  ) => void
  duplicateBlock: (indices: BlockIndices) => void
  detachBlockFromGroup: (indices: BlockIndices) => void
  deleteBlock: (indices: BlockIndices) => void
}

export type WebhookCallBacks = {
  onWebhookBlockCreated: (data: Partial<Webhook>) => void
  onWebhookBlockDuplicated: (
    existingWebhookId: string,
    newWebhookId: string
  ) => void
}

export const blocksAction = (setProbot: SetProbot): BlocksActions => ({
  createBlock: (
    groupId: string,
    block: DraggableBlock | DraggableBlockType,
    indices: BlockIndices
  ) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        createBlockDraft(probot, block, groupId, indices)
      })
    ),
  updateBlock: (
    { groupIndex, blockIndex }: BlockIndices,
    updates: Partial<Omit<Block, 'id' | 'type'>>
  ) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const block = probot.groups[groupIndex].blocks[blockIndex]
        probot.groups[groupIndex].blocks[blockIndex] = { ...block, ...updates }
      })
    ),
  duplicateBlock: ({ groupIndex, blockIndex }: BlockIndices) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const block = { ...probot.groups[groupIndex].blocks[blockIndex] }
        const blocks = probot.groups[groupIndex].blocks
        if (blockIndex === blocks.length - 1 && block.outgoingEdgeId)
          deleteEdgeDraft(probot, block.outgoingEdgeId as string)
        const newBlock = duplicateBlockDraft(block.groupId)(block)
        probot.groups[groupIndex].blocks.splice(blockIndex + 1, 0, newBlock)
      })
    ),
  detachBlockFromGroup: (indices: BlockIndices) =>
    setProbot((probot) => produce(probot, removeBlockFromGroup(indices))),
  deleteBlock: ({ groupIndex, blockIndex }: BlockIndices) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const removingBlock = probot.groups[groupIndex].blocks[blockIndex]
        removeBlockFromGroup({ groupIndex, blockIndex })(probot)
        cleanUpEdgeDraft(probot, removingBlock.id)
        removeEmptyGroups(probot)
      })
    ),
})

const removeBlockFromGroup =
  ({ groupIndex, blockIndex }: BlockIndices) =>
  (probot: Draft<Probot>) => {
    if (probot.groups[groupIndex].blocks[blockIndex].type === 'start') return
    probot.groups[groupIndex].blocks.splice(blockIndex, 1)
  }

export const createBlockDraft = (
  probot: Draft<Probot>,
  block: DraggableBlock | DraggableBlockType,
  groupId: string,
  { groupIndex, blockIndex }: BlockIndices
) => {
  const blocks = probot.groups[groupIndex].blocks
  if (
    blockIndex === blocks.length &&
    blockIndex > 0 &&
    blocks[blockIndex - 1].outgoingEdgeId
  )
    deleteEdgeDraft(probot, blocks[blockIndex - 1].outgoingEdgeId as string)
  typeof block === 'string'
    ? createNewBlock(probot, block, groupId, { groupIndex, blockIndex })
    : moveBlockToGroup(probot, block, groupId, { groupIndex, blockIndex })
  removeEmptyGroups(probot)
}

const createNewBlock = async (
  probot: Draft<Probot>,
  type: DraggableBlockType,
  groupId: string,
  { groupIndex, blockIndex }: BlockIndices,
  onWebhookBlockCreated?: (data: Partial<Webhook>) => void
) => {
  const newBlock = parseNewBlock(type, groupId)
  probot.groups[groupIndex].blocks.splice(blockIndex ?? 0, 0, newBlock)
  if (onWebhookBlockCreated && 'webhookId' in newBlock && newBlock.webhookId)
    onWebhookBlockCreated({ id: newBlock.webhookId })
}

const moveBlockToGroup = (
  probot: Draft<Probot>,
  block: DraggableBlock,
  groupId: string,
  { groupIndex, blockIndex }: BlockIndices
) => {
  const newBlock = { ...block, groupId }
  const items = blockHasItems(block) ? block.items : []
  items.forEach((item) => {
    const edgeIndex = probot.edges.findIndex(byId(item.outgoingEdgeId))
    if (edgeIndex === -1) return
    probot.edges[edgeIndex].from.groupId = groupId
  })
  if (block.outgoingEdgeId) {
    if (probot.groups[groupIndex].blocks.length > blockIndex ?? 0) {
      deleteEdgeDraft(probot, block.outgoingEdgeId)
      newBlock.outgoingEdgeId = undefined
    } else {
      const edgeIndex = probot.edges.findIndex(byId(block.outgoingEdgeId))
      edgeIndex !== -1
        ? (probot.edges[edgeIndex].from.groupId = groupId)
        : (newBlock.outgoingEdgeId = undefined)
    }
  }
  probot.edges.forEach((edge) => {
    if (edge.to.blockId === block.id) {
      edge.to.groupId = groupId
    }
  })
  probot.groups[groupIndex].blocks.splice(blockIndex ?? 0, 0, newBlock)
}

export const duplicateBlockDraft =
  (groupId: string) =>
  (block: Block): Block => {
    const blockId = createId()
    if (blockHasItems(block))
      return {
        ...block,
        groupId,
        id: blockId,
        items: block.items.map(duplicateItemDraft(blockId)),
        outgoingEdgeId: undefined,
      } as Block
    if (isWebhookBlock(block)) {
      const newWebhookId = createId()
      return {
        ...block,
        groupId,
        id: blockId,
        webhookId: newWebhookId,
        outgoingEdgeId: undefined,
      }
    }
    return {
      ...block,
      groupId,
      id: blockId,
      outgoingEdgeId: undefined,
    }
  }

export const deleteGroupDraft =
  (probot: Draft<Probot>) => (groupIndex: number) => {
    if (probot.groups[groupIndex].blocks.at(0)?.type === 'start') return
    cleanUpEdgeDraft(probot, probot.groups[groupIndex].id)
    probot.groups.splice(groupIndex, 1)
  }

export const removeEmptyGroups = (probot: Draft<Probot>) => {
  const emptyGroupsIndices = probot.groups.reduce<number[]>(
    (arr, group, idx) => {
      group.blocks.length === 0 && arr.push(idx)
      return arr
    },
    []
  )
  emptyGroupsIndices.forEach(deleteGroupDraft(probot))
}
