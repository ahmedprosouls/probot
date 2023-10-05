import { router } from '@/helpers/server/trpc'
import { listProbots } from './listProbots'
import { createProbot } from './createProbot'
import { updateProbot } from './updateProbot'
import { getProbot } from './getProbot'
import { getPublishedProbot } from './getPublishedProbot'
import { publishProbot } from './publishProbot'
import { unpublishProbot } from './unpublishProbot'
import { deleteProbot } from './deleteProbot'

export const probotRouter = router({
  createProbot,
  updateProbot,
  getProbot,
  getPublishedProbot,
  publishProbot,
  unpublishProbot,
  listProbots,
  deleteProbot,
})
