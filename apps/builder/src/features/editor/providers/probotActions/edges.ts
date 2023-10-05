import {
  Probot,
  Edge,
  BlockWithItems,
  BlockIndices,
  ItemIndices,
  Block,
} from '@typebot.io/schemas'
import { SetProbot } from '../ProbotProvider'
import { Draft, produce } from 'immer'
import { byId, isDefined, blockHasItems } from '@typebot.io/lib'
import { createId } from '@paralleldrive/cuid2'

export type EdgesActions = {
  createEdge: (edge: Omit<Edge, 'id'>) => void
  updateEdge: (edgeIndex: number, updates: Partial<Omit<Edge, 'id'>>) => void
  deleteEdge: (edgeId: string) => void
}

export const edgesAction = (setProbot: SetProbot): EdgesActions => ({
  createEdge: (edge: Omit<Edge, 'id'>) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const newEdge = {
          ...edge,
          id: createId(),
        }
        removeExistingEdge(probot, edge)
        probot.edges.push(newEdge)
        const groupIndex = probot.groups.findIndex(byId(edge.from.groupId))
        const blockIndex = probot.groups[groupIndex].blocks.findIndex(
          byId(edge.from.blockId)
        )
        const itemIndex = edge.from.itemId
          ? (
              probot.groups[groupIndex].blocks[blockIndex] as
                | BlockWithItems
                | undefined
            )?.items.findIndex(byId(edge.from.itemId))
          : null

        isDefined(itemIndex) && itemIndex !== -1
          ? addEdgeIdToItem(probot, newEdge.id, {
              groupIndex,
              blockIndex,
              itemIndex,
            })
          : addEdgeIdToBlock(probot, newEdge.id, {
              groupIndex,
              blockIndex,
            })
      })
    ),
  updateEdge: (edgeIndex: number, updates: Partial<Omit<Edge, 'id'>>) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        const currentEdge = probot.edges[edgeIndex]
        probot.edges[edgeIndex] = {
          ...currentEdge,
          ...updates,
        }
      })
    ),
  deleteEdge: (edgeId: string) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        deleteEdgeDraft(probot, edgeId)
      })
    ),
})

const addEdgeIdToBlock = (
  probot: Draft<Probot>,
  edgeId: string,
  { groupIndex, blockIndex }: BlockIndices
) => {
  probot.groups[groupIndex].blocks[blockIndex].outgoingEdgeId = edgeId
}

const addEdgeIdToItem = (
  probot: Draft<Probot>,
  edgeId: string,
  { groupIndex, blockIndex, itemIndex }: ItemIndices
) =>
  ((probot.groups[groupIndex].blocks[blockIndex] as BlockWithItems).items[
    itemIndex
  ].outgoingEdgeId = edgeId)

export const deleteEdgeDraft = (probot: Draft<Probot>, edgeId: string) => {
  const edgeIndex = probot.edges.findIndex(byId(edgeId))
  if (edgeIndex === -1) return
  deleteOutgoingEdgeIdProps(probot, edgeId)
  probot.edges.splice(edgeIndex, 1)
}

const deleteOutgoingEdgeIdProps = (probot: Draft<Probot>, edgeId: string) => {
  const edge = probot.edges.find(byId(edgeId))
  if (!edge) return
  const fromGroupIndex = probot.groups.findIndex(byId(edge.from.groupId))
  const fromBlockIndex = probot.groups[fromGroupIndex].blocks.findIndex(
    byId(edge.from.blockId)
  )
  const block = probot.groups[fromGroupIndex].blocks[fromBlockIndex] as
    | Block
    | undefined
  if (!block) return
  const fromItemIndex =
    edge.from.itemId && blockHasItems(block)
      ? block.items.findIndex(byId(edge.from.itemId))
      : -1
  if (fromItemIndex !== -1) {
    ;(
      probot.groups[fromGroupIndex].blocks[fromBlockIndex] as BlockWithItems
    ).items[fromItemIndex].outgoingEdgeId = undefined
  } else if (fromBlockIndex !== -1)
    probot.groups[fromGroupIndex].blocks[fromBlockIndex].outgoingEdgeId =
      undefined
}

export const cleanUpEdgeDraft = (
  probot: Draft<Probot>,
  deletedNodeId: string
) => {
  const edgesToDelete = probot.edges.filter((edge) =>
    [
      edge.from.groupId,
      edge.from.blockId,
      edge.from.itemId,
      edge.to.groupId,
      edge.to.blockId,
    ].includes(deletedNodeId)
  )
  edgesToDelete.forEach((edge) => deleteEdgeDraft(probot, edge.id))
}

const removeExistingEdge = (
  probot: Draft<Probot>,
  edge: Omit<Edge, 'id'>
) => {
  probot.edges = probot.edges.filter((e) =>
    edge.from.itemId
      ? e.from.itemId !== edge.from.itemId
      : isDefined(e.from.itemId) || e.from.blockId !== edge.from.blockId
  )
}
