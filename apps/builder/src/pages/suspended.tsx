import { TextLink } from '@/components/TextLink'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { WorkspaceProvider } from '@/features/workspace/WorkspaceProvider'
import { Heading, Link, Text, VStack } from '@chakra-ui/react'

export default function Page() {
  return (
    <WorkspaceProvider>
      <DashboardHeader />
      <VStack w="full" h="calc(100vh - 64px)" justifyContent="center">
        <Heading>Your workspace has been suspended.</Heading>
        <Text>
          We detected that one of your probots does not comply with our{' '}
          <TextLink
            href="https://probot.io/terms-of-service#scam-probots"
            isExternal
          >
            terms of service
          </TextLink>
        </Text>
        <Text>
          If you think it&apos;s a mistake, feel free to{' '}
          <Link href="mailto:support@typebot.io" textDecor="underline">
            reach out
          </Link>
          .
        </Text>
      </VStack>
    </WorkspaceProvider>
  )
}
