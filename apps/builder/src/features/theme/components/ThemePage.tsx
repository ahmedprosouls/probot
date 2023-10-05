import { Seo } from '@/components/Seo'
import { ProbotHeader } from '@/features/editor/components/ProbotHeader'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { Flex } from '@chakra-ui/react'
import { Standard } from '@typebot.io/nextjs'
import { ThemeSideMenu } from './ThemeSideMenu'

export const ThemePage = () => {
  const { probot } = useProbot()

  return (
    <Flex overflow="hidden" h="100vh" flexDir="column">
      <Seo title={probot?.name ? `${probot.name} | Theme` : 'Theme'} />
      <ProbotHeader />
      <Flex h="full" w="full">
        <ThemeSideMenu />
        <Flex flex="1">
          {probot && (
            <Standard
              probot={probot}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
