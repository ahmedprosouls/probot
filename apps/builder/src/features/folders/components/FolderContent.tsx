import { DashboardFolder, WorkspaceRole } from '@typebot.io/prisma'
import {
  Flex,
  Heading,
  HStack,
  Portal,
  Skeleton,
  Stack,
  useEventListener,
  Wrap,
} from '@chakra-ui/react'
import { useProbotDnd } from '../ProbotDndProvider'
import React, { useState } from 'react'
import { BackButton } from './BackButton'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useToast } from '@/hooks/useToast'
import { useFolders } from '../hooks/useFolders'
import { createFolderQuery } from '../queries/createFolderQuery'
import { CreateBotButton } from './CreateBotButton'
import { CreateFolderButton } from './CreateFolderButton'
import { ButtonSkeleton, FolderButton } from './FolderButton'
import { ProbotButton } from './ProbotButton'
import { ProbotCardOverlay } from './ProbotButtonOverlay'
import { useI18n } from '@/locales'
import { useProbots } from '@/features/dashboard/hooks/useProbots'
import { ProbotInDashboard } from '@/features/dashboard/types'
import { trpc } from '@/lib/trpc'

type Props = { folder: DashboardFolder | null }

const dragDistanceTolerance = 20

export const FolderContent = ({ folder }: Props) => {
  const t = useI18n()
  const { workspace, currentRole } = useWorkspace()
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const {
    setDraggedProbot,
    draggedProbot,
    mouseOverFolderId,
    setMouseOverFolderId,
  } = useProbotDnd()
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 })
  const [draggablePosition, setDraggablePosition] = useState({ x: 0, y: 0 })
  const [relativeDraggablePosition, setRelativeDraggablePosition] = useState({
    x: 0,
    y: 0,
  })
  const [probotDragCandidate, setProbotDragCandidate] =
    useState<ProbotInDashboard>()

  const { showToast } = useToast()

  const {
    folders,
    isLoading: isFolderLoading,
    mutate: mutateFolders,
  } = useFolders({
    workspaceId: workspace?.id,
    parentId: folder?.id,
    onError: (error) => {
      showToast({
        description: error.message,
      })
    },
  })

  const { mutate: updateProbot } = trpc.probot.updateProbot.useMutation({
    onError: (error) => {
      showToast({ description: error.message })
    },
    onSuccess: () => {
      refetchProbots()
    },
  })

  const {
    probots,
    isLoading: isProbotLoading,
    refetch: refetchProbots,
  } = useProbots({
    workspaceId: workspace?.id,
    folderId: folder === null ? 'root' : folder.id,
    onError: (error) => {
      showToast({
        description: error.message,
      })
    },
  })

  const moveProbotToFolder = async (probotId: string, folderId: string) => {
    if (!probots) return
    updateProbot({
      probotId,
      probot: {
        folderId: folderId === 'root' ? null : folderId,
      },
    })
  }

  const handleCreateFolder = async () => {
    if (!folders || !workspace) return
    setIsCreatingFolder(true)
    const { error, data: newFolder } = await createFolderQuery(workspace.id, {
      parentFolderId: folder?.id ?? null,
    })
    setIsCreatingFolder(false)
    if (error)
      return showToast({
        title: t('errorMessage'),
        description: error.message,
      })
    if (newFolder) mutateFolders({ folders: [...folders, newFolder] })
  }

  const handleProbotUpdated = () => {
    if (!probots) return
    refetchProbots()
  }

  const handleFolderDeleted = (deletedId: string) => {
    if (!folders) return
    mutateFolders({ folders: folders.filter((f) => f.id !== deletedId) })
  }

  const handleFolderRenamed = (folderId: string, name: string) => {
    if (!folders) return
    mutateFolders({
      folders: folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
    })
  }

  const handleMouseUp = async () => {
    if (mouseOverFolderId !== undefined && draggedProbot)
      await moveProbotToFolder(draggedProbot.id, mouseOverFolderId ?? 'root')
    setProbotDragCandidate(undefined)
    setMouseOverFolderId(undefined)
    setDraggedProbot(undefined)
  }
  useEventListener('mouseup', handleMouseUp)

  const handleMouseDown =
    (probot: ProbotInDashboard) => (e: React.MouseEvent) => {
      const element = e.currentTarget as HTMLDivElement
      const rect = element.getBoundingClientRect()
      setDraggablePosition({ x: rect.left, y: rect.top })
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setRelativeDraggablePosition({ x, y })
      setMouseDownPosition({ x: e.screenX, y: e.screenY })
      setProbotDragCandidate(probot)
    }

  const handleMouseMove = (e: MouseEvent) => {
    if (!probotDragCandidate) return
    const { clientX, clientY, screenX, screenY } = e
    if (
      Math.abs(mouseDownPosition.x - screenX) > dragDistanceTolerance ||
      Math.abs(mouseDownPosition.y - screenY) > dragDistanceTolerance
    )
      setDraggedProbot(probotDragCandidate)
    setDraggablePosition({
      ...draggablePosition,
      x: clientX - relativeDraggablePosition.x,
      y: clientY - relativeDraggablePosition.y,
    })
  }
  useEventListener('mousemove', handleMouseMove)

  return (
    <Flex w="full" flex="1" justify="center">
      <Stack w="1000px" spacing={6}>
        <Skeleton isLoaded={folder?.name !== undefined}>
          <Heading as="h1">{folder?.name}</Heading>
        </Skeleton>
        <Stack>
          <HStack>
            {folder && <BackButton id={folder.parentFolderId} />}
            {currentRole !== WorkspaceRole.GUEST && (
              <CreateFolderButton
                onClick={handleCreateFolder}
                isLoading={isCreatingFolder || isFolderLoading}
              />
            )}
          </HStack>
          <Wrap spacing={4}>
            {currentRole !== WorkspaceRole.GUEST && (
              <CreateBotButton
                folderId={folder?.id}
                isLoading={isProbotLoading}
                isFirstBot={probots?.length === 0 && folder === null}
              />
            )}
            {isFolderLoading && <ButtonSkeleton />}
            {folders &&
              folders.map((folder) => (
                <FolderButton
                  key={folder.id.toString()}
                  folder={folder}
                  onFolderDeleted={() => handleFolderDeleted(folder.id)}
                  onFolderRenamed={(newName: string) =>
                    handleFolderRenamed(folder.id, newName)
                  }
                />
              ))}
            {isProbotLoading && <ButtonSkeleton />}
            {probots &&
              probots.map((probot) => (
                <ProbotButton
                  key={probot.id.toString()}
                  probot={probot}
                  onProbotUpdated={handleProbotUpdated}
                  onMouseDown={handleMouseDown(probot)}
                />
              ))}
          </Wrap>
        </Stack>
      </Stack>
      {draggedProbot && (
        <Portal>
          <ProbotCardOverlay
            probot={draggedProbot}
            onMouseUp={handleMouseUp}
            pos="fixed"
            top="0"
            left="0"
            style={{
              transform: `translate(${draggablePosition.x}px, ${draggablePosition.y}px) rotate(-2deg)`,
            }}
          />
        </Portal>
      )}
    </Flex>
  )
}
