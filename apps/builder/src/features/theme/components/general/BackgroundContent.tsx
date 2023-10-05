import { ImageUploadContent } from '@/components/ImageUploadContent'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import {
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  Image,
  Button,
  Portal,
} from '@chakra-ui/react'
import { isNotEmpty } from '@typebot.io/lib'
import { Background, BackgroundType } from '@typebot.io/schemas'
import React from 'react'
import { ColorPicker } from '../../../../components/ColorPicker'

type BackgroundContentProps = {
  background?: Background
  onBackgroundContentChange: (content: string) => void
}

const defaultBackgroundColor = '#ffffff'

export const BackgroundContent = ({
  background,
  onBackgroundContentChange,
}: BackgroundContentProps) => {
  const { probot } = useProbot()
  const handleContentChange = (content: string) =>
    onBackgroundContentChange(content)

  switch (background?.type) {
    case BackgroundType.COLOR:
      return (
        <Flex justify="space-between" align="center">
          <Text>Background color:</Text>
          <ColorPicker
            value={background.content ?? defaultBackgroundColor}
            onColorChange={handleContentChange}
          />
        </Flex>
      )
    case BackgroundType.IMAGE:
      if (!probot) return null
      return (
        <Popover isLazy placement="top">
          <PopoverTrigger>
            {isNotEmpty(background.content) ? (
              <Image
                src={background.content}
                alt="Background image"
                cursor="pointer"
                _hover={{ filter: 'brightness(.9)' }}
                transition="filter 200ms"
                rounded="md"
                maxH="200px"
                objectFit="cover"
              />
            ) : (
              <Button>Select an image</Button>
            )}
          </PopoverTrigger>
          <Portal>
            <PopoverContent p="4" w="500px">
              <ImageUploadContent
                uploadFileProps={{
                  workspaceId: probot.workspaceId,
                  probotId: probot.id,
                  fileName: 'background',
                }}
                defaultUrl={background.content}
                onSubmit={handleContentChange}
                excludedTabs={['giphy', 'icon']}
              />
            </PopoverContent>
          </Portal>
        </Popover>
      )
  }
}
