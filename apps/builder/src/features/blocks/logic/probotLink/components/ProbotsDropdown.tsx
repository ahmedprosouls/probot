import { HStack, IconButton, Input } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@/components/icons'
import { useToast } from '@/hooks/useToast'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Select } from '@/components/inputs/Select'
import { EmojiOrImageIcon } from '@/components/EmojiOrImageIcon'
import { useProbots } from '@/features/dashboard/hooks/useProbots'

type Props = {
  idsToExclude: string[]
  probotId?: string | 'current'
  currentWorkspaceId: string
  onSelect: (probotId: string | 'current' | undefined) => void
}

export const ProbotsDropdown = ({
  idsToExclude,
  probotId,
  onSelect,
  currentWorkspaceId,
}: Props) => {
  const { query } = useRouter()
  const { showToast } = useToast()
  const { probots, isLoading } = useProbots({
    workspaceId: currentWorkspaceId,
    onError: (e) => showToast({ title: e.name, description: e.message }),
  })

  if (isLoading) return <Input value="Loading..." isDisabled />
  if (!probots || probots.length === 0)
    return <Input value="No probots found" isDisabled />
  return (
    <HStack>
      <Select
        selectedItem={probotId}
        items={[
          {
            label: 'Current probot',
            value: 'current',
          },
          ...(probots ?? [])
            .filter((probot) => !idsToExclude.includes(probot.id))
            .map((probot) => ({
              icon: (
                <EmojiOrImageIcon
                  icon={probot.icon}
                  boxSize="18px"
                  emojiFontSize="18px"
                />
              ),
              label: probot.name,
              value: probot.id,
            })),
        ]}
        onSelect={onSelect}
        placeholder={'Select a probot'}
      />
      {probotId && probotId !== 'current' && (
        <IconButton
          aria-label="Navigate to probot"
          icon={<ExternalLinkIcon />}
          as={Link}
          href={{
            pathname: '/probots/[probotId]/edit',
            query: {
              probotId,
              parentId: query.parentId
                ? Array.isArray(query.parentId)
                  ? query.parentId.concat(query.probotId?.toString() ?? '')
                  : [query.parentId, query.probotId?.toString() ?? '']
                : query.probotId ?? [],
            },
          }}
        />
      )}
    </HStack>
  )
}
