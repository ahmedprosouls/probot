import { Variable, WebhookResponse } from '@typebot.io/schemas'
import { sendRequest } from '@typebot.io/lib'
import { getViewerUrl } from '@typebot.io/lib/getViewerUrl'

export const executeWebhook = (
  probotId: string,
  variables: Variable[],
  { blockId }: { blockId: string }
) =>
  sendRequest<WebhookResponse>({
    url: `${getViewerUrl()}/api/probots/${probotId}/blocks/${blockId}/executeWebhook`,
    method: 'POST',
    body: {
      variables,
    },
  })
