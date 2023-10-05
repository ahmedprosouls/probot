import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Heading,
  HStack,
  Stack,
  Tag,
} from '@chakra-ui/react'
import { ChatIcon, CodeIcon, DropletIcon, TableIcon } from '@/components/icons'
import { ChatTheme, GeneralTheme, ThemeTemplate } from '@typebot.io/schemas'
import React from 'react'
import { CustomCssSettings } from './CustomCssSettings'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { headerHeight } from '@/features/editor/constants'
import { ChatThemeSettings } from './chat/ChatThemeSettings'
import { GeneralSettings } from './general/GeneralSettings'
import { ThemeTemplates } from './ThemeTemplates'

export const ThemeSideMenu = () => {
  const { probot, updateProbot } = useProbot()

  const updateChatTheme = (chat: ChatTheme) =>
    probot && updateProbot({ updates: { theme: { ...probot.theme, chat } } })

  const updateGeneralTheme = (general: GeneralTheme) =>
    probot &&
    updateProbot({ updates: { theme: { ...probot.theme, general } } })

  const updateCustomCss = (customCss: string) =>
    probot &&
    updateProbot({ updates: { theme: { ...probot.theme, customCss } } })

  const selectedTemplate = (
    selectedTemplate: Partial<Pick<ThemeTemplate, 'id' | 'theme'>>
  ) => {
    if (!probot) return
    const { theme, id } = selectedTemplate
    updateProbot({
      updates: {
        selectedThemeTemplateId: id,
        theme: theme ? { ...theme } : probot.theme,
      },
    })
  }

  const updateBranding = (isBrandingEnabled: boolean) =>
    probot &&
    updateProbot({
      updates: {
        settings: { ...probot.settings, general: { isBrandingEnabled } },
      },
    })

  return (
    <Stack
      flex="1"
      maxW="400px"
      height={`calc(100vh - ${headerHeight}px)`}
      borderRightWidth={1}
      pt={10}
      spacing={10}
      overflowY="scroll"
      pb="20"
      position="relative"
    >
      <Heading fontSize="xl" textAlign="center">
        Customize the theme
      </Heading>
      <Accordion allowMultiple>
        <AccordionItem>
          <AccordionButton py={6}>
            <HStack flex="1" pl={2}>
              <TableIcon />
              <Heading fontSize="lg">
                <HStack>
                  <span>Templates</span> <Tag colorScheme="orange">New!</Tag>
                </HStack>
              </Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={12}>
            {probot && (
              <ThemeTemplates
                selectedTemplateId={
                  probot.selectedThemeTemplateId ?? undefined
                }
                currentTheme={probot.theme}
                workspaceId={probot.workspaceId}
                onTemplateSelect={selectedTemplate}
              />
            )}
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton py={6}>
            <HStack flex="1" pl={2}>
              <DropletIcon />
              <Heading fontSize="lg">Global</Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {probot && (
              <GeneralSettings
                isBrandingEnabled={probot.settings.general.isBrandingEnabled}
                generalTheme={probot.theme.general}
                onGeneralThemeChange={updateGeneralTheme}
                onBrandingChange={updateBranding}
              />
            )}
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton py={6}>
            <HStack flex="1" pl={2}>
              <ChatIcon />
              <Heading fontSize="lg">Chat</Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {probot && (
              <ChatThemeSettings
                workspaceId={probot.workspaceId}
                probotId={probot.id}
                chatTheme={probot.theme.chat}
                onChatThemeChange={updateChatTheme}
              />
            )}
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton py={6}>
            <HStack flex="1" pl={2}>
              <CodeIcon />
              <Heading fontSize="lg">Custom CSS</Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {probot && (
              <CustomCssSettings
                customCss={probot.theme.customCss}
                onCustomCssChange={updateCustomCss}
              />
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  )
}
