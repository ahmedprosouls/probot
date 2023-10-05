import { sendMessage } from '@/features/chat/api/sendMessage'
import { whatsAppRouter } from '@/features/whatsapp/api/router'
import { router } from '../../trpc'
import { updateprobotInSession } from '@/features/chat/api/updateprobotInSession'
import { getUploadUrl } from '@/features/fileUpload/api/deprecated/getUploadUrl'
import { generateUploadUrl } from '@/features/fileUpload/api/generateUploadUrl'

export const appRouter = router({
  sendMessage,
  getUploadUrl,
  generateUploadUrl,
  updateprobotInSession,
  whatsAppRouter,
})

export type AppRouter = typeof appRouter
