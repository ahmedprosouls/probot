import { billingRouter } from '@/features/billing/api/router'
import { webhookRouter } from '@/features/blocks/integrations/webhook/api/router'
import { getLinkedProbots } from '@/features/blocks/logic/probotLink/api/getLinkedProbots'
import { credentialsRouter } from '@/features/credentials/api/router'
import { getAppVersionProcedure } from '@/features/dashboard/api/getAppVersionProcedure'
import { resultsRouter } from '@/features/results/api/router'
import { processTelemetryEvent } from '@/features/telemetry/api/processTelemetryEvent'
import { themeRouter } from '@/features/theme/api/router'
import { probotRouter } from '@/features/probot/api/router'
import { workspaceRouter } from '@/features/workspace/api/router'
import { router } from '../../trpc'
import { analyticsRouter } from '@/features/analytics/api/router'
import { collaboratorsRouter } from '@/features/collaboration/api/router'
import { customDomainsRouter } from '@/features/customDomains/api/router'
import { whatsAppRouter } from '@/features/whatsapp/router'
import { openAIRouter } from '@/features/blocks/integrations/openai/api/router'
import { generateUploadUrl } from '@/features/upload/api/generateUploadUrl'
import { zemanticAiRouter } from '@/features/blocks/integrations/zemanticAi/api/router'

export const trpcRouter = router({
  getAppVersionProcedure,
  processTelemetryEvent,
  getLinkedProbots,
  analytics: analyticsRouter,
  workspace: workspaceRouter,
  probot: probotRouter,
  webhook: webhookRouter,
  results: resultsRouter,
  billing: billingRouter,
  credentials: credentialsRouter,
  theme: themeRouter,
  collaborators: collaboratorsRouter,
  customDomains: customDomainsRouter,
  whatsApp: whatsAppRouter,
  openAI: openAIRouter,
  generateUploadUrl,
  zemanticAi: zemanticAiRouter,
})

export type AppRouter = typeof trpcRouter
