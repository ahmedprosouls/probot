import { MenuList, MenuItem } from '@chakra-ui/react'
import { CopyIcon, TrashIcon } from '@/components/icons'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { ItemIndices } from '@typebot.io/schemas'

type Props = {
  indices: ItemIndices
}
export const ItemNodeContextMenu = ({ indices }: Props) => {
  const { deleteItem, duplicateItem } = useProbot()

  return (
    <MenuList>
      <MenuItem icon={<CopyIcon />} onClick={() => duplicateItem(indices)}>
        Duplicate
      </MenuItem>
      <MenuItem icon={<TrashIcon />} onClick={() => deleteItem(indices)}>
        Delete
      </MenuItem>
    </MenuList>
  )
}
