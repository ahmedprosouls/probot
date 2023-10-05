import { Stack } from '@chakra-ui/react'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { ProbotLinkOptions } from '@typebot.io/schemas'
import { GroupsDropdown } from './GroupsDropdown'
import { ProbotsDropdown } from './ProbotsDropdown'
import { trpc } from '@/lib/trpc'
import { isNotEmpty } from '@typebot.io/lib'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'

type Props = {
  options: ProbotLinkOptions
  onOptionsChange: (options: ProbotLinkOptions) => void
}

export const ProbotLinkForm = ({ options, onOptionsChange }: Props) => {
  const { probot } = useProbot()

  const handleProbotIdChange = async (
    probotId: string | 'current' | undefined
  ) => onOptionsChange({ ...options, probotId, groupId: undefined })

  const { data: linkedProbotData } = trpc.probot.getProbot.useQuery(
    {
      probotId: options.probotId as string,
    },
    {
      enabled: isNotEmpty(options.probotId) && options.probotId !== 'current',
    }
  )

  const handleGroupIdChange = (groupId: string | undefined) =>
    onOptionsChange({ ...options, groupId })

  const updateMergeResults = (mergeResults: boolean) =>
    onOptionsChange({ ...options, mergeResults })

  const isCurrentProbotSelected =
    (probot && options.probotId === probot.id) ||
    options.probotId === 'current'

  return (
    <Stack>
      {probot && (
        <ProbotsDropdown
          idsToExclude={[probot.id]}
          probotId={options.probotId}
          onSelect={handleProbotIdChange}
          currentWorkspaceId={probot.workspaceId as string}
        />
      )}
      {options.probotId && (
        <GroupsDropdown
          key={options.probotId}
          groups={
            probot && isCurrentProbotSelected
              ? probot.groups
              : linkedProbotData?.probot?.groups ?? []
          }
          groupId={options.groupId}
          onGroupIdSelected={handleGroupIdChange}
          isLoading={
            linkedProbotData?.probot === undefined &&
            options.probotId !== 'current' &&
            probot &&
            probot.id !== options.probotId
          }
        />
      )}
      {!isCurrentProbotSelected && (
        <SwitchWithLabel
          label="Merge answers"
          moreInfoContent="If enabled, the answers collected in the linked probot will be merged with the results of the current probot."
          initialValue={options.mergeResults ?? true}
          onCheckChange={updateMergeResults}
        />
      )}
    </Stack>
  )
}
