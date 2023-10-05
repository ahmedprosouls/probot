import { Standard } from '@typebot.io/nextjs'
import { useRouter } from 'next/router'
import { SEO } from './Seo'
import { probot } from '@typebot.io/schemas/features/probot/probot'
import { BackgroundType } from '@typebot.io/schemas/features/probot/theme/enums'

export type probotV3PageProps = {
  url: string
  name: string
  publicId: string | null
  isHideQueryParamsEnabled: boolean | null
  background: probot['theme']['general']['background']
  metadata: probot['settings']['metadata']
}

export const probotPageV3 = ({
  publicId,
  name,
  url,
  isHideQueryParamsEnabled,
  metadata,
  background,
}: probotV3PageProps) => {
  const { asPath, push } = useRouter()

  const clearQueryParamsIfNecessary = () => {
    const hasQueryParams = asPath.includes('?')
    if (!hasQueryParams || !(isHideQueryParamsEnabled ?? true)) return
    push(asPath.split('?')[0], undefined, { shallow: true })
  }

  return (
    <div
      style={{
        height: '100vh',
        // Set background color to avoid SSR flash
        backgroundColor:
          background?.type === BackgroundType.COLOR
            ? background?.content
            : background?.type === BackgroundType.NONE
            ? undefined
            : '#fff',
      }}
    >
      <SEO url={url} probotName={name} metadata={metadata} />
      <Standard probot={publicId} onInit={clearQueryParamsIfNecessary} />
    </div>
  )
}
