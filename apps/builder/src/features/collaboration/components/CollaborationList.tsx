import {
  Stack,
  HStack,
  Input,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonCircle,
  Text,
  Tag,
  Flex,
  Skeleton,
} from '@chakra-ui/react'
import { ChevronLeftIcon } from '@/components/icons'
import { useToast } from '@/hooks/useToast'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { CollaborationType, WorkspaceRole } from '@typebot.io/prisma'
import React, { FormEvent, useState } from 'react'
import { CollaboratorItem } from './CollaboratorButton'
import { EmojiOrImageIcon } from '@/components/EmojiOrImageIcon'
import { useCollaborators } from '../hooks/useCollaborators'
import { useInvitations } from '../hooks/useInvitations'
import { updateInvitationQuery } from '../queries/updateInvitationQuery'
import { deleteInvitationQuery } from '../queries/deleteInvitationQuery'
import { updateCollaboratorQuery } from '../queries/updateCollaboratorQuery'
import { deleteCollaboratorQuery } from '../queries/deleteCollaboratorQuery'
import { sendInvitationQuery } from '../queries/sendInvitationQuery'

export const CollaborationList = () => {
  const { currentRole, workspace } = useWorkspace()
  const { probot } = useProbot()
  const [invitationType, setInvitationType] = useState<CollaborationType>(
    CollaborationType.READ
  )
  const [invitationEmail, setInvitationEmail] = useState('')
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)

  const hasFullAccess =
    (currentRole && currentRole !== WorkspaceRole.GUEST) || false

  const { showToast } = useToast()
  const {
    collaborators,
    isLoading: isCollaboratorsLoading,
    mutate: mutateCollaborators,
  } = useCollaborators({
    probotId: probot?.id,
    onError: (e) =>
      showToast({
        title: "Couldn't fetch collaborators",
        description: e.message,
      }),
  })
  const {
    invitations,
    isLoading: isInvitationsLoading,
    mutate: mutateInvitations,
  } = useInvitations({
    probotId: probot?.id,
    onError: (e) =>
      showToast({
        title: "Couldn't fetch invitations",
        description: e.message,
      }),
  })

  const handleChangeInvitationCollabType =
    (email: string) => async (type: CollaborationType) => {
      if (!probot || !hasFullAccess) return
      const { error } = await updateInvitationQuery(probot?.id, email, {
        email,
        probotId: probot.id,
        type,
      })
      if (error)
        return showToast({ title: error.name, description: error.message })
      mutateInvitations({
        invitations: (invitations ?? []).map((i) =>
          i.email === email ? { ...i, type } : i
        ),
      })
    }
  const handleDeleteInvitation = (email: string) => async () => {
    if (!probot || !hasFullAccess) return
    const { error } = await deleteInvitationQuery(probot?.id, email)
    if (error)
      return showToast({ title: error.name, description: error.message })
    mutateInvitations({
      invitations: (invitations ?? []).filter((i) => i.email !== email),
    })
  }

  const handleChangeCollaborationType =
    (userId: string) => async (type: CollaborationType) => {
      if (!probot || !hasFullAccess) return
      const { error } = await updateCollaboratorQuery(probot?.id, userId, {
        userId,
        type,
        probotId: probot.id,
      })
      if (error)
        return showToast({ title: error.name, description: error.message })
      mutateCollaborators({
        collaborators: (collaborators ?? []).map((c) =>
          c.userId === userId ? { ...c, type } : c
        ),
      })
    }
  const handleDeleteCollaboration = (userId: string) => async () => {
    if (!probot || !hasFullAccess) return
    const { error } = await deleteCollaboratorQuery(probot?.id, userId)
    if (error)
      return showToast({ title: error.name, description: error.message })
    mutateCollaborators({
      collaborators: (collaborators ?? []).filter((c) => c.userId !== userId),
    })
  }

  const handleInvitationSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!probot || !hasFullAccess) return
    setIsSendingInvitation(true)
    const { error } = await sendInvitationQuery(probot.id, {
      email: invitationEmail,
      type: invitationType,
    })
    setIsSendingInvitation(false)
    mutateInvitations({ invitations: invitations ?? [] })
    mutateCollaborators({ collaborators: collaborators ?? [] })
    if (error)
      return showToast({ title: error.name, description: error.message })
    showToast({ status: 'success', title: 'Invitation sent! 📧' })
    setInvitationEmail('')
  }

  return (
    <Stack spacing={1} pt="4" pb="2">
      <HStack as="form" onSubmit={handleInvitationSubmit} px="4" pb="2">
        <Input
          size="sm"
          placeholder="colleague@company.com"
          name="inviteEmail"
          value={invitationEmail}
          onChange={(e) => setInvitationEmail(e.target.value)}
          rounded="md"
          isDisabled={!hasFullAccess}
        />

        {hasFullAccess && (
          <CollaborationTypeMenuButton
            type={invitationType}
            onChange={setInvitationType}
          />
        )}
        <Button
          size="sm"
          colorScheme="blue"
          isLoading={isSendingInvitation}
          flexShrink={0}
          type="submit"
          isDisabled={!hasFullAccess}
        >
          Invite
        </Button>
      </HStack>
      {workspace && (
        <Flex py="2" px="4" justifyContent="space-between" alignItems="center">
          <HStack minW={0} spacing={3}>
            <EmojiOrImageIcon icon={workspace.icon} boxSize="32px" />
            <Text fontSize="15px" noOfLines={1}>
              Everyone at {workspace.name}
            </Text>
          </HStack>
          <Tag flexShrink={0}>
            {convertCollaborationTypeEnumToReadable(
              CollaborationType.FULL_ACCESS
            )}
          </Tag>
        </Flex>
      )}
      {invitations?.map(({ email, type }) => (
        <CollaboratorItem
          key={email}
          email={email}
          type={type}
          isOwner={hasFullAccess}
          onDeleteClick={handleDeleteInvitation(email)}
          onChangeCollaborationType={handleChangeInvitationCollabType(email)}
          isGuest
        />
      ))}
      {collaborators?.map(({ user, type, userId }) => (
        <CollaboratorItem
          key={userId}
          email={user.email ?? ''}
          image={user.image ?? undefined}
          name={user.name ?? undefined}
          type={type}
          isOwner={hasFullAccess}
          onDeleteClick={handleDeleteCollaboration(userId ?? '')}
          onChangeCollaborationType={handleChangeCollaborationType(userId)}
        />
      ))}
      {(isCollaboratorsLoading || isInvitationsLoading) && (
        <HStack p="4" justifyContent="space-between">
          <HStack>
            <SkeletonCircle boxSize="32px" />
            <Stack>
              <Skeleton width="130px" h="6px" />
              <Skeleton width="200px" h="6px" />
            </Stack>
          </HStack>
          <Skeleton width="80px" h="10px" />
        </HStack>
      )}
    </Stack>
  )
}

const CollaborationTypeMenuButton = ({
  type,
  onChange,
}: {
  type: CollaborationType
  onChange: (type: CollaborationType) => void
}) => {
  return (
    <Menu placement="bottom-end">
      <MenuButton
        flexShrink={0}
        size="sm"
        as={Button}
        rightIcon={<ChevronLeftIcon transform={'rotate(-90deg)'} />}
      >
        {convertCollaborationTypeEnumToReadable(type)}
      </MenuButton>
      <MenuList minW={0}>
        <Stack maxH={'35vh'} overflowY="scroll" spacing="0">
          <MenuItem onClick={() => onChange(CollaborationType.READ)}>
            {convertCollaborationTypeEnumToReadable(CollaborationType.READ)}
          </MenuItem>
          <MenuItem onClick={() => onChange(CollaborationType.WRITE)}>
            {convertCollaborationTypeEnumToReadable(CollaborationType.WRITE)}
          </MenuItem>
        </Stack>
      </MenuList>
    </Menu>
  )
}

export const convertCollaborationTypeEnumToReadable = (
  type: CollaborationType
) => {
  switch (type) {
    case CollaborationType.READ:
      return 'Can view'
    case CollaborationType.WRITE:
      return 'Can edit'
    case CollaborationType.FULL_ACCESS:
      return 'Full access'
  }
}
