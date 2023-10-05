import { AlertInfo } from '@/components/AlertInfo'
import { DownloadIcon } from '@/components/icons'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { useToast } from '@/hooks/useToast'
import { trpc } from '@/lib/trpc'
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'
import { TRPCError } from '@trpc/server'
import { unparse } from 'papaparse'
import { useState } from 'react'
import { parseResultHeader } from '@typebot.io/lib/results'
import { useResults } from '../../ResultsProvider'
import { parseColumnOrder } from '../../helpers/parseColumnsOrder'
import { convertResultsToTableData } from '../../helpers/convertResultsToTableData'
import { byId, isDefined } from '@typebot.io/lib'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ExportAllResultsModal = ({ isOpen, onClose }: Props) => {
  const { probot, publishedProbot } = useProbot()
  const workspaceId = probot?.workspaceId
  const probotId = probot?.id
  const { showToast } = useToast()
  const { resultHeader: existingResultHeader } = useResults()
  const trpcContext = trpc.useContext()
  const [isExportLoading, setIsExportLoading] = useState(false)

  const [areDeletedBlocksIncluded, setAreDeletedBlocksIncluded] =
    useState(false)

  const { data: linkedProbotsData } = trpc.getLinkedProbots.useQuery(
    {
      probotId: probotId as string,
    },
    {
      enabled: isDefined(probotId),
    }
  )

  const getAllResults = async () => {
    if (!workspaceId || !probotId) return []
    const allResults = []
    let cursor: string | undefined
    do {
      try {
        const { results, nextCursor } =
          await trpcContext.results.getResults.fetch({
            probotId,
            limit: '200',
            cursor,
          })
        allResults.push(...results)
        cursor = nextCursor ?? undefined
      } catch (error) {
        showToast({ description: (error as TRPCError).message })
      }
    } while (cursor)

    return allResults
  }

  const exportAllResultsToCSV = async () => {
    if (!publishedProbot) return

    setIsExportLoading(true)

    const results = await getAllResults()

    const resultHeader = areDeletedBlocksIncluded
      ? parseResultHeader(
          publishedProbot,
          linkedProbotsData?.probots,
          results
        )
      : existingResultHeader

    const dataToUnparse = convertResultsToTableData(results, resultHeader)

    const headerIds = parseColumnOrder(
      probot?.resultsTablePreferences?.columnsOrder,
      resultHeader
    ).reduce<string[]>((currentHeaderIds, columnId) => {
      if (
        probot?.resultsTablePreferences?.columnsVisibility[columnId] === false
      )
        return currentHeaderIds
      const columnLabel = resultHeader.find(
        (headerCell) => headerCell.id === columnId
      )?.id
      if (!columnLabel) return currentHeaderIds
      return [...currentHeaderIds, columnLabel]
    }, [])

    const data = dataToUnparse.map<{ [key: string]: string }>((data) => {
      const newObject: { [key: string]: string } = {}
      headerIds?.forEach((headerId) => {
        const headerLabel = resultHeader.find(byId(headerId))?.label
        if (!headerLabel) return
        const newKey = parseUniqueKey(headerLabel, Object.keys(newObject))
        newObject[newKey] = data[headerId]?.plainText
      })
      return newObject
    })

    const csvData = new Blob([unparse(data)], {
      type: 'text/csv;charset=utf-8;',
    })
    const fileName = `probot-export_${new Date()
      .toLocaleDateString()
      .replaceAll('/', '-')}`
    const tempLink = document.createElement('a')
    tempLink.href = window.URL.createObjectURL(csvData)
    tempLink.setAttribute('download', `${fileName}.csv`)
    tempLink.click()
    setIsExportLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader />
        <ModalBody as={Stack} spacing="4">
          <SwitchWithLabel
            label="Include deleted blocks"
            moreInfoContent="Blocks from previous bot version that have been deleted"
            initialValue={false}
            onCheckChange={setAreDeletedBlocksIncluded}
          />
          <AlertInfo>The export may take up to 1 minute.</AlertInfo>
        </ModalBody>
        <ModalFooter as={HStack}>
          <Button onClick={onClose} variant="ghost" size="sm">
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={exportAllResultsToCSV}
            leftIcon={<DownloadIcon />}
            size="sm"
            isLoading={isExportLoading}
          >
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export const parseUniqueKey = (
  key: string,
  existingKeys: string[],
  count = 0
): string => {
  if (!existingKeys.includes(key)) return key
  return parseUniqueKey(`${key} (${count + 1})`, existingKeys, count + 1)
}
