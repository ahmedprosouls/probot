import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { byId, isNotDefined } from '@typebot.io/lib'
import { WorkspaceRole } from '@typebot.io/prisma'
import { useRouter } from 'next/router'
import { trpc } from '@/lib/trpc'
import { Workspace } from '@typebot.io/schemas'
import { useToast } from '@/hooks/useToast'
import { useUser } from '../account/hooks/useUser'
import { useProbot } from '../editor/providers/ProbotProvider'
import { setWorkspaceIdInLocalStorage } from './helpers/setWorkspaceIdInLocalStorage'
import { parseNewName } from './helpers/parseNewName'

const workspaceContext = createContext<{
  workspaces: Pick<Workspace, 'id' | 'name' | 'icon' | 'plan'>[]
  workspace?: Workspace
  currentRole?: WorkspaceRole
  switchWorkspace: (workspaceId: string) => void
  createWorkspace: (name?: string) => Promise<void>
  updateWorkspace: (updates: { icon?: string; name?: string }) => void
  deleteCurrentWorkspace: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
}>({})

type WorkspaceContextProps = {
  probotId?: string
  children: ReactNode
}

export const WorkspaceProvider = ({
  probotId,
  children,
}: WorkspaceContextProps) => {
  const { pathname, query, push, isReady: isRouterReady } = useRouter()
  const { user } = useUser()
  const userId = user?.id
  const [workspaceId, setWorkspaceId] = useState<string | undefined>()

  const { probot } = useProbot()

  const trpcContext = trpc.useContext()

  const { data: workspacesData } = trpc.workspace.listWorkspaces.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  )
  const workspaces = useMemo(
    () => workspacesData?.workspaces ?? [],
    [workspacesData?.workspaces]
  )

  const { data: workspaceData } = trpc.workspace.getWorkspace.useQuery(
    { workspaceId: workspaceId as string },
    { enabled: !!workspaceId }
  )

  const { data: membersData } = trpc.workspace.listMembersInWorkspace.useQuery(
    { workspaceId: workspaceId as string },
    { enabled: !!workspaceId }
  )

  const workspace = workspaceData?.workspace
  const members = membersData?.members

  const { showToast } = useToast()

  const createWorkspaceMutation = trpc.workspace.createWorkspace.useMutation({
    onError: (error) => showToast({ description: error.message }),
    onSuccess: async () => {
      trpcContext.workspace.listWorkspaces.invalidate()
    },
  })

  const updateWorkspaceMutation = trpc.workspace.updateWorkspace.useMutation({
    onError: (error) => showToast({ description: error.message }),
    onSuccess: async () => {
      trpcContext.workspace.getWorkspace.invalidate()
    },
  })

  const deleteWorkspaceMutation = trpc.workspace.deleteWorkspace.useMutation({
    onError: (error) => showToast({ description: error.message }),
    onSuccess: async () => {
      trpcContext.workspace.listWorkspaces.invalidate()
      setWorkspaceId(undefined)
    },
  })

  const currentRole = members?.find(
    (member) =>
      member.user.email === user?.email && member.workspaceId === workspaceId
  )?.role

  useEffect(() => {
    if (
      pathname === '/signin' ||
      !isRouterReady ||
      !workspaces ||
      workspaces.length === 0 ||
      workspaceId ||
      (probotId && !probot?.workspaceId)
    )
      return
    const lastWorspaceId =
      probot?.workspaceId ??
      query.workspaceId?.toString() ??
      localStorage.getItem('workspaceId')

    const defaultWorkspaceId = lastWorspaceId
      ? workspaces.find(byId(lastWorspaceId))?.id
      : members?.find((member) => member.role === WorkspaceRole.ADMIN)
          ?.workspaceId

    const newWorkspaceId = defaultWorkspaceId ?? workspaces[0].id
    setWorkspaceIdInLocalStorage(newWorkspaceId)
    setWorkspaceId(newWorkspaceId)
  }, [
    isRouterReady,
    members,
    pathname,
    query.workspaceId,
    probot?.workspaceId,
    probotId,
    userId,
    workspaceId,
    workspaces,
  ])

  useEffect(() => {
    if (isNotDefined(workspace?.isSuspended)) return
    if (workspace?.isSuspended && pathname !== '/suspended') push('/suspended')
  }, [pathname, push, workspace?.isSuspended])

  const switchWorkspace = (workspaceId: string) => {
    setWorkspaceIdInLocalStorage(workspaceId)
    if (pathname === '/suspended') {
      window.location.href = '/probots'
      return
    }
    setWorkspaceId(workspaceId)
  }

  const createWorkspace = async (userFullName?: string) => {
    if (!workspaces) return
    const name = parseNewName(userFullName, workspaces)
    const { workspace } = await createWorkspaceMutation.mutateAsync({ name })
    setWorkspaceId(workspace.id)
  }

  const updateWorkspace = (updates: { icon?: string; name?: string }) => {
    if (!workspaceId) return
    updateWorkspaceMutation.mutate({
      workspaceId,
      ...updates,
    })
  }

  const deleteCurrentWorkspace = async () => {
    if (!workspaceId || !workspaces || workspaces.length < 2) return
    await deleteWorkspaceMutation.mutateAsync({ workspaceId })
  }

  return (
    <workspaceContext.Provider
      value={{
        workspaces,
        workspace,
        currentRole,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteCurrentWorkspace,
      }}
    >
      {children}
    </workspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(workspaceContext)
