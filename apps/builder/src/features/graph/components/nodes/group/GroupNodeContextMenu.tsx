import { MenuList, MenuItem } from '@chakra-ui/react'
import { CopyIcon, TrashIcon } from '@/components/icons'
import { useProbot } from '@/features/editor/providers/ProbotProvider'

export const GroupNodeContextMenu = ({
  groupIndex,
}: {
  groupIndex: number
}) => {
  const { deleteGroup, duplicateGroup } = useProbot()

  const handleDeleteClick = () => deleteGroup(groupIndex)

  const handleDuplicateClick = () => duplicateGroup(groupIndex)

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
