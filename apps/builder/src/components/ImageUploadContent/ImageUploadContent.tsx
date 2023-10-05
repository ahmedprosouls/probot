import { useState } from 'react'
import { Button, Flex, HStack, Stack } from '@chakra-ui/react'
import { UploadButton } from './UploadButton'
import { GiphyPicker } from './GiphyPicker'
import { TextInput } from '../inputs/TextInput'
import { EmojiSearchableList } from './emoji/EmojiSearchableList'
import { UnsplashPicker } from './UnsplashPicker'
import { IconPicker } from './IconPicker'
import { FilePathUploadProps } from '@/features/upload/api/generateUploadUrl'

type Tabs = 'link' | 'upload' | 'giphy' | 'emoji' | 'unsplash' | 'icon'

type Props = {
  uploadFileProps: FilePathUploadProps | undefined
  defaultUrl?: string
  imageSize?: 'small' | 'regular' | 'thumb'
  initialTab?: Tabs
  onSubmit: (url: string) => void
  onClose?: () => void
} & (
  | {
      includedTabs?: Tabs[]
    }
  | {
      excludedTabs?: Tabs[]
    }
)

const defaultDisplayedTabs: Tabs[] = [
  'link',
  'upload',
  'giphy',
  'emoji',
  'unsplash',
  'icon',
]

export const ImageUploadContent = ({
  uploadFileProps,
  defaultUrl,
  onSubmit,
  imageSize = 'regular',
  onClose,
  initialTab,
  ...props
}: Props) => {
  const includedTabs =
    'includedTabs' in props
      ? props.includedTabs ?? defaultDisplayedTabs
      : defaultDisplayedTabs
  const excludedTabs = 'excludedTabs' in props ? props.excludedTabs ?? [] : []
  const displayedTabs = defaultDisplayedTabs.filter(
    (tab) => !excludedTabs.includes(tab) && includedTabs.includes(tab)
  )

  const [currentTab, setCurrentTab] = useState<Tabs>(
    initialTab ?? displayedTabs[0]
  )

  const handleSubmit = (url: string) => {
    onSubmit(url)
    onClose && onClose()
  }

  return (
    <Stack>
      <HStack>
        {displayedTabs.includes('link') && (
          <Button
            variant={currentTab === 'link' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('link')}
            size="sm"
          >
            Link
          </Button>
        )}
        {displayedTabs.includes('upload') && (
          <Button
            variant={currentTab === 'upload' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('upload')}
            size="sm"
          >
            Upload
          </Button>
        )}
        {displayedTabs.includes('emoji') && (
          <Button
            variant={currentTab === 'emoji' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('emoji')}
            size="sm"
          >
            Emoji
          </Button>
        )}
        {displayedTabs.includes('giphy') && (
          <Button
            variant={currentTab === 'giphy' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('giphy')}
            size="sm"
          >
            Giphy
          </Button>
        )}
        {displayedTabs.includes('unsplash') && (
          <Button
            variant={currentTab === 'unsplash' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('unsplash')}
            size="sm"
          >
            Unsplash
          </Button>
        )}
        {displayedTabs.includes('icon') && (
          <Button
            variant={currentTab === 'icon' ? 'solid' : 'ghost'}
            onClick={() => setCurrentTab('icon')}
            size="sm"
          >
            Icon
          </Button>
        )}
      </HStack>

      <BodyContent
        uploadFileProps={uploadFileProps}
        tab={currentTab}
        imageSize={imageSize}
        onSubmit={handleSubmit}
        defaultUrl={defaultUrl}
      />
    </Stack>
  )
}

const BodyContent = ({
  uploadFileProps,
  tab,
  defaultUrl,
  imageSize,
  onSubmit,
}: {
  uploadFileProps?: FilePathUploadProps
  tab: Tabs
  defaultUrl?: string
  imageSize: 'small' | 'regular' | 'thumb'
  onSubmit: (url: string) => void
}) => {
  switch (tab) {
    case 'upload': {
      if (!uploadFileProps) return null
      return (
        <UploadFileContent
          uploadFileProps={uploadFileProps}
          onNewUrl={onSubmit}
        />
      )
    }
    case 'link':
      return <EmbedLinkContent defaultUrl={defaultUrl} onNewUrl={onSubmit} />
    case 'giphy':
      return <GiphyContent onNewUrl={onSubmit} />
    case 'emoji':
      return <EmojiSearchableList onEmojiSelected={onSubmit} />
    case 'unsplash':
      return <UnsplashPicker imageSize={imageSize} onImageSelect={onSubmit} />
    case 'icon':
      return <IconPicker onIconSelected={onSubmit} />
  }
}

type ContentProps = { onNewUrl: (url: string) => void }

const UploadFileContent = ({
  uploadFileProps,
  onNewUrl,
}: ContentProps & { uploadFileProps: FilePathUploadProps }) => (
  <Flex justify="center" py="2">
    <UploadButton
      fileType="image"
      filePathProps={uploadFileProps}
      onFileUploaded={onNewUrl}
      colorScheme="blue"
    >
      Choose an image
    </UploadButton>
  </Flex>
)

const EmbedLinkContent = ({
  defaultUrl,
  onNewUrl,
}: ContentProps & { defaultUrl?: string }) => (
  <Stack py="2">
    <TextInput
      placeholder={'Paste the image link...'}
      onChange={onNewUrl}
      defaultValue={defaultUrl ?? ''}
    />
  </Stack>
)

const GiphyContent = ({ onNewUrl }: ContentProps) => (
  <GiphyPicker onSubmit={onNewUrl} />
)
