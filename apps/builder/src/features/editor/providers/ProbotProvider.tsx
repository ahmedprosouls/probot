import { PublicProbot, Probot } from '@typebot.io/schemas'
import { Router, useRouter } from 'next/router'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { isDefined, omit } from '@typebot.io/lib'
import { edgesAction, EdgesActions } from './probotActions/edges'
import { itemsAction, ItemsActions } from './probotActions/items'
import { GroupsActions, groupsActions } from './probotActions/groups'
import { blocksAction, BlocksActions } from './probotActions/blocks'
import { variablesAction, VariablesActions } from './probotActions/variables'
import { dequal } from 'dequal'
import { useToast } from '@/hooks/useToast'
import { useUndo } from '../hooks/useUndo'
import { useAutoSave } from '@/hooks/useAutoSave'
import { preventUserFromRefreshing } from '@/helpers/preventUserFromRefreshing'
import { areProbotsEqual } from '@/features/publish/helpers/areProbotsEqual'
import { isPublished as isPublishedHelper } from '@/features/publish/helpers/isPublished'
import { convertPublicProbotToProbot } from '@/features/publish/helpers/convertPublicProbotToProbot'
import { trpc } from '@/lib/trpc'
import { useScopedI18n } from '@/locales'

const autoSaveTimeout = 10000

type UpdateProbotPayload = Partial<
  Pick<
    Probot,
    | 'theme'
    | 'selectedThemeTemplateId'
    | 'settings'
    | 'publicId'
    | 'name'
    | 'icon'
    | 'customDomain'
    | 'resultsTablePreferences'
    | 'isClosed'
    | 'whatsAppCredentialsId'
  >
>

export type SetProbot = (
  newPresent: Probot | ((current: Probot) => Probot)
) => void

const probotContext = createContext<
  {
    probot?: Probot
    publishedProbot?: PublicProbot
    isReadOnly?: boolean
    isPublished: boolean
    isSavingLoading: boolean
    save: () => Promise<Probot | undefined>
    undo: () => void
    redo: () => void
    canRedo: boolean
    canUndo: boolean
    updateProbot: (props: {
      updates: UpdateProbotPayload
      save?: boolean
    }) => Promise<Probot | undefined>
    restorePublishedProbot: () => void
  } & GroupsActions &
    BlocksActions &
    ItemsActions &
    VariablesActions &
    EdgesActions
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
>({})

export const ProbotProvider = ({
  children,
  probotId,
}: {
  children: ReactNode
  probotId?: string
}) => {
  const scopedT = useScopedI18n('editor.provider')
  const { push } = useRouter()
  const { showToast } = useToast()

  const {
    data: probotData,
    isLoading: isFetchingProbot,
    refetch: refetchProbot,
  } = trpc.probot.getProbot.useQuery(
    { probotId: probotId as string },
    {
      enabled: isDefined(probotId),
      onError: (error) => {
        if (error.data?.httpStatus === 404) {
          showToast({
            status: 'info',
            description: scopedT('messages.getProbotError.description'),
          })
          push('/probots')
          return
        }
        showToast({
          title: scopedT('messages.getProbotError.title'),
          description: error.message,
        })
      },
    }
  )

  const { data: publishedProbotData } =
    trpc.probot.getPublishedProbot.useQuery(
      { probotId: probotId as string },
      {
        enabled: isDefined(probotId),
        onError: (error) => {
          if (error.data?.httpStatus === 404) return
          showToast({
            title: scopedT('messages.publishedProbotError.title'),
            description: error.message,
          })
        },
      }
    )

  const { mutateAsync: updateProbot, isLoading: isSaving } =
    trpc.probot.updateProbot.useMutation({
      onError: (error) =>
        showToast({
          title: scopedT('messages.updateProbotError.title'),
          description: error.message,
        }),
      onSuccess: () => {
        if (!probotId) return
        refetchProbot()
      },
    })

  const probot = probotData?.probot
  const publishedProbot = publishedProbotData?.publishedProbot ?? undefined

  const [
    localProbot,
    { redo, undo, flush, canRedo, canUndo, set: setLocalProbot },
  ] = useUndo<Probot>(undefined)

  useEffect(() => {
    if (!probot && isDefined(localProbot)) setLocalProbot(undefined)
    if (isFetchingProbot || !probot) return
    if (
      probot.id !== localProbot?.id ||
      new Date(probot.updatedAt).getTime() >
        new Date(localProbot.updatedAt).getTime()
    ) {
      setLocalProbot({ ...probot })
      flush()
    }
  }, [
    flush,
    isFetchingProbot,
    localProbot,
    push,
    setLocalProbot,
    showToast,
    probot,
  ])

  const saveProbot = useCallback(
    async (updates?: Partial<Probot>) => {
      if (!localProbot || !probot || probotData?.isReadOnly) return
      const probotToSave = { ...localProbot, ...updates }
      if (dequal(omit(probot, 'updatedAt'), omit(probotToSave, 'updatedAt')))
        return
      setLocalProbot({ ...probotToSave })
      const { probot: newProbot } = await updateProbot({
        probotId: probotToSave.id,
        probot: probotToSave,
      })
      setLocalProbot({ ...newProbot })
      return newProbot
    },
    [
      localProbot,
      setLocalProbot,
      probot,
      probotData?.isReadOnly,
      updateProbot,
    ]
  )

  useAutoSave(
    {
      handler: saveProbot,
      item: localProbot,
      debounceTimeout: autoSaveTimeout,
    },
    [saveProbot, localProbot]
  )

  useEffect(() => {
    const handleSaveProbot = () => {
      saveProbot()
    }
    Router.events.on('routeChangeStart', handleSaveProbot)
    return () => {
      Router.events.off('routeChangeStart', handleSaveProbot)
    }
  }, [saveProbot])

  const isPublished = useMemo(
    () =>
      isDefined(localProbot) &&
      isDefined(localProbot.publicId) &&
      isDefined(publishedProbot) &&
      isPublishedHelper(localProbot, publishedProbot),
    [localProbot, publishedProbot]
  )

  useEffect(() => {
    if (!localProbot || !probot || probotData?.isReadOnly) return
    if (!areProbotsEqual(localProbot, probot)) {
      window.addEventListener('beforeunload', preventUserFromRefreshing)
    }

    return () => {
      window.removeEventListener('beforeunload', preventUserFromRefreshing)
    }
  }, [localProbot, probot, probotData?.isReadOnly])

  const updateLocalProbot = async ({
    updates,
    save,
  }: {
    updates: UpdateProbotPayload
    save?: boolean
  }) => {
    if (!localProbot) return
    const newProbot = { ...localProbot, ...updates }
    setLocalProbot(newProbot)
    if (save) await saveProbot(newProbot)
    return newProbot
  }

  const restorePublishedProbot = () => {
    if (!publishedProbot || !localProbot) return
    setLocalProbot(
      convertPublicProbotToProbot(publishedProbot, localProbot)
    )
  }

  return (
    <probotContext.Provider
      value={{
        probot: localProbot,
        publishedProbot,
        isReadOnly: probotData?.isReadOnly,
        isSavingLoading: isSaving,
        save: saveProbot,
        undo,
        redo,
        canUndo,
        canRedo,
        isPublished,
        updateProbot: updateLocalProbot,
        restorePublishedProbot,
        ...groupsActions(
          setLocalProbot as SetProbot,
          scopedT('groups.copy.title')
        ),
        ...blocksAction(setLocalProbot as SetProbot),
        ...variablesAction(setLocalProbot as SetProbot),
        ...edgesAction(setLocalProbot as SetProbot),
        ...itemsAction(setLocalProbot as SetProbot),
      }}
    >
      {children}
    </probotContext.Provider>
  )
}

export const useProbot = () => useContext(probotContext)
