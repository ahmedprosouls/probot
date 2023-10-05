import {
  Button,
  HStack,
  IconButton,
  Stack,
  Tooltip,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  ButtonProps,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  ChevronLeftIcon,
  CloudOffIcon,
  LockedIcon,
  UnlockedIcon,
} from '@/components/icons'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { InputBlockType } from '@typebot.io/schemas'
import { useRouter } from 'next/router'
import { isNotDefined } from '@typebot.io/lib'
import { ChangePlanModal } from '@/features/billing/components/ChangePlanModal'
import { isFreePlan } from '@/features/billing/helpers/isFreePlan'
import { parseTimeSince } from '@/helpers/parseTimeSince'
import { useI18n } from '@/locales'
import { trpc } from '@/lib/trpc'
import { useToast } from '@/hooks/useToast'
import { parseDefaultPublicId } from '../helpers/parseDefaultPublicId'

type Props = ButtonProps & {
  isMoreMenuDisabled?: boolean
}
export const PublishButton = ({
  isMoreMenuDisabled = false,
  ...props
}: Props) => {
  const t = useI18n()
  const warningTextColor = useColorModeValue('red.300', 'red.600')
  const { workspace } = useWorkspace()
  const { push, query, pathname } = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isPublished,
    publishedProbot,
    restorePublishedProbot,
    probot,
    isSavingLoading,
    updateProbot,
    save,
  } = useProbot()
  const { showToast } = useToast()

  const {
    probot: {
      getPublishedProbot: { refetch: refetchPublishedProbot },
    },
  } = trpc.useContext()

  const { mutate: publishProbotMutate, isLoading: isPublishing } =
    trpc.probot.publishProbot.useMutation({
      onError: (error) =>
        showToast({
          title: 'Error while publishing probot',
          description: error.message,
        }),
      onSuccess: () => {
        refetchPublishedProbot({
          probotId: probot?.id as string,
        })
        if (!publishedProbot && !pathname.endsWith('share'))
          push(`/probots/${query.probotId}/share`)
      },
    })

  const { mutate: unpublishProbotMutate, isLoading: isUnpublishing } =
    trpc.probot.unpublishProbot.useMutation({
      onError: (error) =>
        showToast({
          title: 'Error while unpublishing probot',
          description: error.message,
        }),
      onSuccess: () => {
        refetchPublishedProbot()
      },
    })

  const hasInputFile = probot?.groups
    .flatMap((g) => g.blocks)
    .some((b) => b.type === InputBlockType.FILE)

  const handlePublishClick = async () => {
    if (!probot?.id) return
    if (isFreePlan(workspace) && hasInputFile) return onOpen()
    if (!probot.publicId) {
      await updateProbot({
        updates: {
          publicId: parseDefaultPublicId(probot.name, probot.id),
        },
        save: true,
      })
    } else await save()
    publishProbotMutate({
      probotId: probot.id,
    })
  }

  const unpublishProbot = async () => {
    if (!probot?.id) return
    if (probot.isClosed)
      await updateProbot({ updates: { isClosed: false }, save: true })
    unpublishProbotMutate({
      probotId: probot?.id,
    })
  }

  const closeProbot = async () => {
    await updateProbot({ updates: { isClosed: true }, save: true })
  }

  const openProbot = async () => {
    await updateProbot({ updates: { isClosed: false }, save: true })
  }

  return (
    <HStack spacing="1px">
      <ChangePlanModal
        isOpen={isOpen}
        onClose={onClose}
        type={t('billing.limitMessage.fileInput')}
      />
      <Tooltip
        placement="bottom-end"
        label={
          <Stack>
            {!publishedProbot?.version ? (
              <Text color={warningTextColor} fontWeight="semibold">
                This will deploy your bot with an updated engine. Make sure to
                test it properly in preview mode before publishing.
              </Text>
            ) : (
              <Text>There are non published changes.</Text>
            )}
            <Text fontStyle="italic">
              Published version from{' '}
              {publishedProbot &&
                parseTimeSince(publishedProbot.updatedAt.toString())}{' '}
              ago
            </Text>
          </Stack>
        }
        isDisabled={isNotDefined(publishedProbot) || isPublished}
      >
        <Button
          colorScheme="blue"
          isLoading={isPublishing || isUnpublishing}
          isDisabled={isPublished || isSavingLoading}
          onClick={handlePublishClick}
          borderRightRadius={
            publishedProbot && !isMoreMenuDisabled ? 0 : undefined
          }
          {...props}
        >
          {isPublished
            ? probot?.isClosed
              ? 'Closed'
              : 'Published'
            : 'Publish'}
        </Button>
      </Tooltip>

      {!isMoreMenuDisabled && publishedProbot && (
        <Menu>
          <MenuButton
            as={IconButton}
            colorScheme={'blue'}
            borderLeftRadius={0}
            icon={<ChevronLeftIcon transform="rotate(-90deg)" />}
            aria-label="Show published probot menu"
            size="sm"
            isDisabled={isPublishing || isSavingLoading}
          />
          <MenuList>
            {!isPublished && (
              <MenuItem onClick={restorePublishedProbot}>
                Restore published version
              </MenuItem>
            )}
            {!probot?.isClosed ? (
              <MenuItem onClick={closeProbot} icon={<LockedIcon />}>
                Close probot to new responses
              </MenuItem>
            ) : (
              <MenuItem onClick={openProbot} icon={<UnlockedIcon />}>
                Reopen probot to new responses
              </MenuItem>
            )}
            <MenuItem onClick={unpublishProbot} icon={<CloudOffIcon />}>
              Unpublish probot
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </HStack>
  )
}
