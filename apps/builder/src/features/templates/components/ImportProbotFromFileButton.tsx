import { useToast } from '@/hooks/useToast'
import { Button, ButtonProps, chakra } from '@chakra-ui/react'
import { Probot, probotCreateSchema } from '@typebot.io/schemas'
import { preprocessProbot } from '@typebot.io/schemas/features/probot/helpers/preprocessProbot'
import React, { ChangeEvent } from 'react'
import { z } from 'zod'
import { useScopedI18n } from '@/locales'

type Props = {
  onNewProbot: (probot: Probot) => void
} & ButtonProps

export const ImportProbotFromFileButton = ({
  onNewProbot,
  ...props
}: Props) => {
  const scopedT = useScopedI18n('templates.importFromFileButon')
  const { showToast } = useToast()

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target?.files) return
    const file = e.target.files[0]
    const fileContent = await readFile(file)
    try {
      const probot = z
        .preprocess(preprocessProbot, probotCreateSchema)
        .parse(JSON.parse(fileContent))
      onNewProbot(probot as Probot)
    } catch (err) {
      console.error(err)
      showToast({
        description: scopedT('toastError.description'),
        details: {
          content: JSON.stringify(err, null, 2),
          lang: 'json',
        },
      })
    }
  }

  return (
    <>
      <chakra.input
        type="file"
        id="file-input"
        display="none"
        onChange={handleInputChange}
        accept=".json"
      />
      <Button as="label" htmlFor="file-input" cursor="pointer" {...props}>
        {props.children}
      </Button>
    </>
  )
}

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      fr.result && resolve(fr.result.toString())
    }
    fr.onerror = reject
    fr.readAsText(file)
  })
}
