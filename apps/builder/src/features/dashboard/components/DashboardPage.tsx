import { Seo } from '@/components/Seo'
import { useUser } from '@/features/account/hooks/useUser'
import {
  PreCheckoutModal,
  PreCheckoutModalProps,
} from '@/features/billing/components/PreCheckoutModal'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { useScopedI18n } from '@/locales'
import { Stack, VStack, Spinner, Text } from '@chakra-ui/react'
import { Plan } from '@typebot.io/prisma'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { guessIfUserIsEuropean } from '@typebot.io/lib/pricing'
import { DashboardHeader } from './DashboardHeader'
import { FolderContent } from '@/features/folders/components/FolderContent'
import { ProbotDndProvider } from '@/features/folders/ProbotDndProvider'
import { ParentModalProvider } from '@/features/graph/providers/ParentModalProvider'
import { trpc } from '@/lib/trpc'

export const DashboardPage = () => {
  const scopedT = useScopedI18n('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const { workspace } = useWorkspace()
  const [preCheckoutPlan, setPreCheckoutPlan] =
    useState<PreCheckoutModalProps['selectedSubscription']>()
  const { mutate: createCustomCheckoutSession } =
    trpc.billing.createCustomCheckoutSession.useMutation({
      onSuccess: (data) => {
        router.push(data.checkoutUrl)
      },
    })

  useEffect(() => {
    const { subscribePlan, chats, isYearly, claimCustomPlan } =
      router.query as {
        subscribePlan: Plan | undefined
        chats: string | undefined
        isYearly: string | undefined
        claimCustomPlan: string | undefined
      }
    if (claimCustomPlan && user?.email && workspace) {
      setIsLoading(true)
      createCustomCheckoutSession({
        email: user.email,
        workspaceId: workspace.id,
        returnUrl: `${window.location.origin}/probots`,
      })
    }
    if (workspace && subscribePlan && user && workspace.plan === 'FREE') {
      setIsLoading(true)
      setPreCheckoutPlan({
        plan: subscribePlan as 'PRO' | 'STARTER',
        workspaceId: workspace.id,
        additionalChats: chats ? parseInt(chats) : 0,
        currency: guessIfUserIsEuropean() ? 'eur' : 'usd',
        isYearly: isYearly === 'false' ? false : true,
      })
    }
  }, [createCustomCheckoutSession, router.query, user, workspace])

  return (
    <Stack minH="100vh">
      <Seo title={workspace?.name ?? scopedT('title')} />
      <DashboardHeader />
      {!workspace?.stripeId && (
        <ParentModalProvider>
          <PreCheckoutModal
            selectedSubscription={preCheckoutPlan}
            existingEmail={user?.email ?? undefined}
            existingCompany={workspace?.name ?? undefined}
            onClose={() => setPreCheckoutPlan(undefined)}
          />
        </ParentModalProvider>
      )}
      <ProbotDndProvider>
        {isLoading ? (
          <VStack w="full" justifyContent="center" pt="10" spacing={6}>
            <Text>{scopedT('redirectionMessage')}</Text>
            <Spinner />
          </VStack>
        ) : (
          <FolderContent folder={null} />
        )}
      </ProbotDndProvider>
    </Stack>
  )
}