import { Seo } from '@/components/Seo'
import { Flex } from '@chakra-ui/react'
import { Standard } from '@typebot.io/nextjs'
import { getViewerUrl } from '@typebot.io/lib/getViewerUrl'
import { SettingsSideMenu } from './SettingsSideMenu'
import { ProbotHeader } from '@/features/editor/components/ProbotHeader'
import { useProbot } from '@/features/editor/providers/ProbotProvider'

export const SettingsPage = () => {
  const { probot } = useProbot()

  return (
    <Flex overflow="hidden" h="100vh" flexDir="column">
      <Seo title={probot?.name ? `${probot.name} | Settings` : 'Settings'} />
      <ProbotHeader />
      <Flex h="full" w="full">
        <SettingsSideMenu />
        <Flex flex="1">
          {probot && <Standard apiHost={getViewerUrl()} probot={probot} />}
        </Flex>
      </Flex>
    </Flex>
  )
}
