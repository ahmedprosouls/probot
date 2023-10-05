import { WebhookIcon } from '@/components/icons'
import { useEditor } from '@/features/editor/providers/EditorProvider'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useGraph } from '@/features/graph/providers/GraphProvider'
import { useToast } from '@/hooks/useToast'
import { Standard } from '@typebot.io/nextjs'
import { ChatReply } from '@typebot.io/schemas'

export const WebPreview = () => {
  const { probot } = useProbot()
  const { startPreviewAtGroup } = useEditor()
  const { setPreviewingBlock } = useGraph()

  const { showToast } = useToast()

  const handleNewLogs = (logs: ChatReply['logs']) => {
    logs?.forEach((log) => {
      showToast({
        icon: <WebhookIcon />,
        status: log.status as 'success' | 'error' | 'info',
        title: log.status === 'error' ? 'An error occured' : undefined,
        description: log.description,
        details: log.details
          ? {
              lang: 'json',
              content:
                typeof log.details === 'string'
                  ? log.details
                  : JSON.stringify(log.details, null, 2),
            }
          : undefined,
      })
      if (log.status === 'error') console.error(log)
    })
  }

  if (!probot) return null

  return (
    <Standard
      key={`web-preview${startPreviewAtGroup ?? ''}`}
      probot={probot}
      startGroupId={startPreviewAtGroup}
      onNewInputBlock={setPreviewingBlock}
      onNewLogs={handleNewLogs}
      style={{
        borderWidth: '1px',
        borderRadius: '0.25rem',
      }}
    />
  )
}
