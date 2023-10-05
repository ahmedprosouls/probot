import { Button } from '@chakra-ui/react'
import { ChevronLeftIcon } from '@/components/icons'
import { useProbotDnd } from '../ProbotDndProvider'
import Link from 'next/link'
import React, { useMemo } from 'react'
import { useI18n } from '@/locales'

export const BackButton = ({ id }: { id: string | null }) => {
  const t = useI18n()
  const { draggedProbot, setMouseOverFolderId, mouseOverFolderId } =
    useProbotDnd()

  const isProbotOver = useMemo(
    () => draggedProbot && mouseOverFolderId === id,
    [draggedProbot, id, mouseOverFolderId]
  )

  const handleMouseEnter = () => setMouseOverFolderId(id)
  const handleMouseLeave = () => setMouseOverFolderId(undefined)
  return (
    <Button
      as={Link}
      href={id ? `/probots/folders/${id}` : '/probots'}
      leftIcon={<ChevronLeftIcon />}
      variant={'outline'}
      colorScheme={isProbotOver ? 'blue' : 'gray'}
      borderWidth={isProbotOver ? '3px' : '1px'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {t('back')}
    </Button>
  )
}
