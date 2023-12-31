import {
  VStack,
  Heading,
  Stack,
  Button,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react'
import { ToolIcon, TemplateIcon, DownloadIcon } from '@/components/icons'
import { Probot } from '@typebot.io/schemas'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { ImportProbotFromFileButton } from './ImportProbotFromFileButton'
import { TemplatesModal } from './TemplatesModal'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useUser } from '@/features/account/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import { trpc } from '@/lib/trpc'
import { useScopedI18n } from '@/locales'

export const CreateNewProbotButtons = () => {
  const scopedT = useScopedI18n('templates.buttons')
  const { workspace } = useWorkspace()
  const { user } = useUser()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [isLoading, setIsLoading] = useState(false)

  const { showToast } = useToast()

  const { mutate } = trpc.probot.createProbot.useMutation({
    onMutate: () => {
      setIsLoading(true)
    },
    onError: (error) => {
      showToast({ description: error.message })
    },
    onSuccess: (data) => {
      router.push({
        pathname: `/probots/${data.probot.id}/edit`,
        query:
          router.query.isFirstBot === 'true'
            ? {
                isFirstBot: 'true',
              }
            : {},
      })
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })

  const handleCreateSubmit = async (probot?: Probot) => {
    if (!user || !workspace) return
    const folderId = router.query.folderId?.toString() ?? null
    mutate({
      workspaceId: workspace.id,
      probot: {
        ...(probot
          ? {
              ...probot,
              publicId: undefined,
              customDomain: undefined,
            }
          : {}),
        folderId,
      },
    })
  }

  return (
    <VStack maxW="600px" w="full" flex="1" pt="20" spacing={10}>
      <Heading>{scopedT('heading')}</Heading>
      <Stack w="full" spacing={6}>
        <Button
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={
            <ToolIcon
              color={useColorModeValue('blue.500', 'blue.300')}
              boxSize="25px"
              mr="2"
            />
          }
          onClick={() => handleCreateSubmit()}
          isLoading={isLoading}
        >
          {scopedT('fromScratchButton.label')}
        </Button>
        <Button
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={
            <TemplateIcon
              color={useColorModeValue('orange.500', 'orange.300')}
              boxSize="25px"
              mr="2"
            />
          }
          onClick={onOpen}
          isLoading={isLoading}
        >
          {scopedT('fromTemplateButton.label')}
        </Button>
        <ImportProbotFromFileButton
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={
            <DownloadIcon
              color={useColorModeValue('purple.500', 'purple.300')}
              boxSize="25px"
              mr="2"
            />
          }
          isLoading={isLoading}
          onNewProbot={handleCreateSubmit}
        >
          {scopedT('importFileButton.label')}
        </ImportProbotFromFileButton>
      </Stack>
      <TemplatesModal
        isOpen={isOpen}
        onClose={onClose}
        onProbotChoose={handleCreateSubmit}
      />
    </VStack>
  )
}
