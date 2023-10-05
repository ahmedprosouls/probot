import { Seo } from '@/components/Seo'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { VStack } from '@chakra-ui/react'
import { CreateNewProbotButtons } from './CreateNewProbotButtons'

export const TemplatesPage = () => (
  <VStack h="100vh">
    <Seo title="Templates" />
    <DashboardHeader />
    <CreateNewProbotButtons />
  </VStack>
)
