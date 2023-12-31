import { MenuList, MenuItem } from '@chakra-ui/react'
import { CopyIcon, TrashIcon } from '@/components/icons'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { BlockIndices } from '@typebot.io/schemas'

type Props = { indices: BlockIndices }
export const BlockNodeContextMenu = ({ indices }: Props) => {
  const { deleteBlock, duplicateBlock } = useProbot()

  const handleDuplicateClick = () => duplicateBlock(indices)

  const handleDeleteClick = () => deleteBlock(indices)

  return (
    <MenuList>
      <MenuItem icon={<CopyIcon />} onClick={handleDuplicateClick}>
        Duplicate
      </MenuItem>
      <MenuItem icon={<TrashIcon />} onClick={handleDeleteClick}>
        Delete
      </MenuItem>
    </MenuList>
  )
}
