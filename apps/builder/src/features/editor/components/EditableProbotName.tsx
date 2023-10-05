import {
  Editable,
  EditablePreview,
  EditableInput,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useScopedI18n } from '@/locales'

type EditableProps = {
  defaultName: string
  onNewName: (newName: string) => void
}
export const EditableProbotName = ({
  defaultName,
  onNewName,
}: EditableProps) => {
  const scopedT = useScopedI18n('editor.editableProbotName')
  const emptyNameBg = useColorModeValue('gray.100', 'gray.700')
  const [currentName, setCurrentName] = useState(defaultName)

  const submitNewName = (newName: string) => {
    if (newName === '') return setCurrentName(defaultName)
    if (newName === defaultName) return
    onNewName(newName)
  }

  return (
    <Tooltip label={scopedT('tooltip.rename.label')}>
      <Editable
        value={currentName}
        onChange={setCurrentName}
        onSubmit={submitNewName}
      >
        <EditablePreview
          noOfLines={2}
          cursor="pointer"
          maxW="150px"
          overflow="hidden"
          fontSize="14px"
          minW="30px"
          minH="20px"
          bgColor={currentName === '' ? emptyNameBg : 'inherit'}
        />
        <EditableInput fontSize="14px" />
      </Editable>
    </Tooltip>
  )
}
