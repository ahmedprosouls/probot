import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { ProbotInDashboard } from '../dashboard/types'

const probotDndContext = createContext<{
  draggedProbot?: ProbotInDashboard
  setDraggedProbot: Dispatch<SetStateAction<ProbotInDashboard | undefined>>
  mouseOverFolderId?: string | null
  setMouseOverFolderId: Dispatch<SetStateAction<string | undefined | null>>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
}>({})

export const ProbotDndProvider = ({ children }: { children: ReactNode }) => {
  const [draggedProbot, setDraggedProbot] = useState<ProbotInDashboard>()
  const [mouseOverFolderId, setMouseOverFolderId] = useState<string | null>()

  useEffect(() => {
    draggedProbot
      ? document.body.classList.add('grabbing')
      : document.body.classList.remove('grabbing')
  }, [draggedProbot])

  return (
    <probotDndContext.Provider
      value={{
        draggedProbot,
        setDraggedProbot,
        mouseOverFolderId,
        setMouseOverFolderId,
      }}
    >
      {children}
    </probotDndContext.Provider>
  )
}

export const useProbotDnd = () => useContext(probotDndContext)
