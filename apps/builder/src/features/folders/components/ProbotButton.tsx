import React from 'react'
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  IconButton,
  MenuItem,
  Stack,
  Tag,
  Text,
  useDisclosure,
  VStack,
  WrapItem,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ConfirmModal } from '@/components/ConfirmModal'
import { GripIcon } from '@/components/icons'
import { useProbotDnd } from '../ProbotDndProvider'
import { useDebounce } from 'use-debounce'
import { useToast } from '@/hooks/useToast'
import { MoreButton } from './MoreButton'
import { EmojiOrImageIcon } from '@/components/EmojiOrImageIcon'
import { useScopedI18n } from '@/locales'
import { ProbotInDashboard } from '@/features/dashboard/types'
import { isMobile } from '@/helpers/isMobile'
import { trpc, trpcVanilla } from '@/lib/trpc'
import { duplicateName } from '@/features/probot/helpers/duplicateName'

type Props = {
  probot: ProbotInDashboard
  isReadOnly?: boolean
  onProbotUpdated: () => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const ProbotButton = ({
  probot,
  isReadOnly = false,
  onProbotUpdated,
  onMouseDown,
}: Props) => {
  const scopedT = useScopedI18n('folders.probotButton')
  const router = useRouter()
  const { draggedProbot } = useProbotDnd()
  const [draggedProbotDebounced] = useDebounce(draggedProbot, 200)
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure()

  const { showToast } = useToast()

  const { mutate: createProbot } = trpc.probot.createProbot.useMutation({
    onError: (error) => {
      showToast({ description: error.message })
    },
    onSuccess: ({ probot }) => {
      router.push(`/probots/${probot.id}/edit`)
    },
  })

  const { mutate: deleteProbot } = trpc.probot.deleteProbot.useMutation({
    onError: (error) => {
      showToast({ description: error.message })
    },
    onSuccess: () => {
      onProbotUpdated()
    },
  })

  const { mutate: unpublishProbot } =
    trpc.probot.unpublishProbot.useMutation({
      onError: (error) => {
        showToast({ description: error.message })
      },
      onSuccess: () => {
        onProbotUpdated()
      },
    })

  const handleProbotClick = () => {
    if (draggedProbotDebounced) return
    router.push(
      isMobile
        ? `/probots/${probot.id}/results`
        : `/probots/${probot.id}/edit`
    )
  }

  const handleDeleteProbotClick = async () => {
    if (isReadOnly) return
    deleteProbot({
      probotId: probot.id,
    })
  }

  const handleDuplicateClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { probot: probotToDuplicate } =
      await trpcVanilla.probot.getProbot.query({
        probotId: probot.id,
      })
    if (!probotToDuplicate) return
    createProbot({
      workspaceId: probotToDuplicate.workspaceId,
      probot: {
        ...probotToDuplicate,
        customDomain: undefined,
        publicId: undefined,
        name: duplicateName(probotToDuplicate.name),
      },
    })
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteOpen()
  }

  const handleUnpublishClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!probot.publishedProbotId) return
    unpublishProbot({ probotId: probot.id })
  }

  return (
    <Button
      as={WrapItem}
      onClick={handleProbotClick}
      display="flex"
      flexDir="column"
      variant="outline"
      w="225px"
      h="270px"
      rounded="lg"
      whiteSpace="normal"
      opacity={draggedProbot?.id === probot.id ? 0.2 : 1}
      onMouseDown={onMouseDown}
      cursor="pointer"
    >
      {probot.publishedProbotId && (
        <Tag
          colorScheme="blue"
          variant="solid"
          rounded="full"
          pos="absolute"
          top="27px"
          size="sm"
        >
          {scopedT('live')}
        </Tag>
      )}
      {!isReadOnly && (
        <>
          <IconButton
            icon={<GripIcon />}
            pos="absolute"
            top="20px"
            left="20px"
            aria-label="Drag"
            cursor="grab"
            variant="ghost"
            colorScheme="blue"
            size="sm"
          />
          <MoreButton
            pos="absolute"
            top="20px"
            right="20px"
            aria-label={scopedT('showMoreOptions')}
          >
            {probot.publishedProbotId && (
              <MenuItem onClick={handleUnpublishClick}>
                {scopedT('unpublish')}
              </MenuItem>
            )}
            <MenuItem onClick={handleDuplicateClick}>
              {scopedT('duplicate')}
            </MenuItem>
            <MenuItem color="red.400" onClick={handleDeleteClick}>
              {scopedT('delete')}
            </MenuItem>
          </MoreButton>
        </>
      )}
      <VStack spacing="4">
        <Flex
          rounded="full"
          justifyContent="center"
          alignItems="center"
          fontSize={'4xl'}
        >
          {<EmojiOrImageIcon icon={probot.icon} boxSize={'35px'} />}
        </Flex>
        <Text textAlign="center" noOfLines={4} maxW="180px">
          {probot.name}
        </Text>
      </VStack>
      {!isReadOnly && (
        <ConfirmModal
          message={
            <Stack spacing="4">
              <Text>
                {scopedT('deleteConfirmationMessage', {
                  probotName: <strong>{probot.name}</strong>,
                })}
              </Text>
              <Alert status="warning">
                <AlertIcon />
                {scopedT('deleteConfirmationMessageWarning')}
              </Alert>
            </Stack>
          }
          confirmButtonLabel="Delete"
          onConfirm={handleDeleteProbotClick}
          isOpen={isDeleteOpen}
          onClose={onDeleteClose}
        />
      )}
    </Button>
  )
}
