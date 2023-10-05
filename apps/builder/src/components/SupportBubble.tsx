import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useUser } from '@/features/account/hooks/useUser'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import React, { useEffect, useState } from 'react'
import { Bubble, BubbleProps } from '@typebot.io/nextjs'
import { planToReadable } from '@/features/billing/helpers/planToReadable'

export const SupportBubble = (props: Omit<BubbleProps, 'probot'>) => {
  const { probot } = useProbot()
  const { user } = useUser()
  const { workspace } = useWorkspace()

  const [lastViewedProbotId, setLastViewedProbotId] = useState(probot?.id)

  useEffect(() => {
    if (!probot?.id) return
    if (lastViewedProbotId === probot?.id) return
    setLastViewedProbotId(probot?.id)
  }, [lastViewedProbotId, probot?.id])

  return (
    <Bubble
      apiHost="https://viewer.probot.io"
      probot="probot-support"
      prefilledVariables={{
        'User ID': user?.id,
        'First name': user?.name?.split(' ')[0] ?? undefined,
        Email: user?.email ?? undefined,
        'Probot ID': lastViewedProbotId,
        'Avatar URL': user?.image ?? undefined,
        Plan: planToReadable(workspace?.plan),
      }}
      theme={{
        chatWindow: {
          backgroundColor: '#fff',
        },
      }}
      {...props}
    />
  )
}
