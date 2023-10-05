import { Select } from '@/components/inputs/Select'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useToast } from '@/hooks/useToast'
import { trpc } from '@/lib/trpc'

type Props = {
  credentialsId: string
  blockId: string
  defaultValue: string
  onChange: (projectId: string | undefined) => void
}

export const ProjectsDropdown = ({
  defaultValue,
  onChange,
  credentialsId,
}: Props) => {
  const { probot } = useProbot()
  const { workspace } = useWorkspace()
  const { showToast } = useToast()

  const { data } = trpc.zemanticAi.listProjects.useQuery(
    {
      credentialsId,
      workspaceId: workspace?.id as string,
    },
    {
      enabled: !!probot && !!workspace,
      onError: (error) => {
        showToast({
          description: error.message,
          status: 'error',
        })
      },
    }
  )

  return (
    <Select
      items={data?.projects as { label: string; value: string }[]}
      selectedItem={defaultValue}
      onSelect={onChange}
      placeholder="Select a project"
    />
  )
}
