import { Seo } from '@/components/Seo'
import { Flex, Spinner, useColorModeValue } from '@chakra-ui/react'
import {
  EditorProvider,
  useEditor,
  RightPanel as RightPanelEnum,
} from '../providers/EditorProvider'
import { useProbot } from '../providers/ProbotProvider'
import { BlocksSideBar } from './BlocksSideBar'
import { BoardMenuButton } from './BoardMenuButton'
import { GettingStartedModal } from './GettingStartedModal'
import { PreviewDrawer } from '@/features/preview/components/PreviewDrawer'
import { ProbotHeader } from './ProbotHeader'
import { Graph } from '@/features/graph/components/Graph'
import { GraphDndProvider } from '@/features/graph/providers/GraphDndProvider'
import { GraphProvider } from '@/features/graph/providers/GraphProvider'
import { GroupsCoordinatesProvider } from '@/features/graph/providers/GroupsCoordinateProvider'

export const EditorPage = () => {
  const { probot, isReadOnly } = useProbot()

  return (
    <EditorProvider>
      <Seo title={probot?.name ? `${probot.name} | Editor` : 'Editor'} />
      <Flex overflow="clip" h="100vh" flexDir="column" id="editor-container">
        <GettingStartedModal />
        <ProbotHeader />
        <Flex
          flex="1"
          pos="relative"
          h="full"
          bgColor={useColorModeValue('#f4f5f8', 'gray.850')}
          backgroundImage={useColorModeValue(
            'radial-gradient(#c6d0e1 1px, transparent 0)',
            'radial-gradient(#2f2f39 1px, transparent 0)'
          )}
          backgroundSize="40px 40px"
          backgroundPosition="-19px -19px"
        >
          {probot ? (
            <GraphDndProvider>
              {!isReadOnly && <BlocksSideBar />}
              <GraphProvider isReadOnly={isReadOnly}>
                <GroupsCoordinatesProvider groups={probot.groups}>
                  <Graph flex="1" probot={probot} key={probot.id} />
                  <BoardMenuButton pos="absolute" right="40px" top="20px" />
                  <RightPanel />
                </GroupsCoordinatesProvider>
              </GraphProvider>
            </GraphDndProvider>
          ) : (
            <Flex justify="center" align="center" boxSize="full">
              <Spinner color="gray" />
            </Flex>
          )}
        </Flex>
      </Flex>
    </EditorProvider>
  )
}

const RightPanel = () => {
  const { rightPanel } = useEditor()
  return rightPanel === RightPanelEnum.PREVIEW ? <PreviewDrawer /> : <></>
}
