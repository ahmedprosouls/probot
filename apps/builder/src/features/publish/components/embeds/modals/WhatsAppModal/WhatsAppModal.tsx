import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  Text,
  OrderedList,
  ListItem,
  HStack,
  useDisclosure,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
} from '@chakra-ui/react'
import { useWorkspace } from '@/features/workspace/WorkspaceProvider'
import { CredentialsDropdown } from '@/features/credentials/components/CredentialsDropdown'
import { ModalProps } from '../../EmbedButton'
import { useProbot } from '@/features/editor/providers/ProbotProvider'
import { WhatsAppCredentialsModal } from './WhatsAppCredentialsModal'
import { TextLink } from '@/components/TextLink'
import { PublishButton } from '../../../PublishButton'
import { useParentModal } from '@/features/graph/providers/ParentModalProvider'
import { trpc } from '@/lib/trpc'
import { SwitchWithLabel } from '@/components/inputs/SwitchWithLabel'
import { TableList } from '@/components/TableList'
import { Comparison, LogicalOperator } from '@typebot.io/schemas'
import { DropdownList } from '@/components/DropdownList'
import { WhatsAppComparisonItem } from './WhatsAppComparisonItem'
import { AlertInfo } from '@/components/AlertInfo'
import { NumberInput } from '@/components/inputs'
import { defaultSessionExpiryTimeout } from '@typebot.io/schemas/features/whatsapp'
import { SwitchWithRelatedSettings } from '@/components/SwitchWithRelatedSettings'
import { isDefined } from '@typebot.io/lib/utils'
import { hasProPerks } from '@/features/billing/helpers/hasProPerks'
import { UnlockPlanAlertInfo } from '@/components/UnlockPlanAlertInfo'
import { PlanTag } from '@/features/billing/components/PlanTag'

export const WhatsAppModal = ({ isOpen, onClose }: ModalProps): JSX.Element => {
  const { probot, updateProbot, isPublished } = useProbot()
  const { ref } = useParentModal()
  const { workspace } = useWorkspace()
  const {
    isOpen: isCredentialsModalOpen,
    onOpen,
    onClose: onCredentialsModalClose,
  } = useDisclosure()

  const whatsAppSettings = probot?.settings.whatsApp

  const { data: phoneNumberData } = trpc.whatsApp.getPhoneNumber.useQuery(
    {
      credentialsId: probot?.whatsAppCredentialsId as string,
    },
    {
      enabled: !!probot?.whatsAppCredentialsId,
    }
  )

  const toggleEnableWhatsApp = (isChecked: boolean) => {
    if (!phoneNumberData?.id || !probot) return
    updateProbot({
      updates: {
        settings: {
          ...probot.settings,
          whatsApp: {
            ...probot.settings.whatsApp,
            isEnabled: isChecked,
          },
        },
      },
    })
  }

  const updateCredentialsId = (credentialsId: string | undefined) => {
    if (!probot) return
    updateProbot({
      updates: {
        whatsAppCredentialsId: credentialsId,
      },
    })
  }

  const updateStartConditionComparisons = (comparisons: Comparison[]) => {
    if (!probot) return
    updateProbot({
      updates: {
        settings: {
          ...probot.settings,
          whatsApp: {
            ...probot.settings.whatsApp,
            startCondition: {
              logicalOperator:
                probot.settings.whatsApp?.startCondition?.logicalOperator ??
                LogicalOperator.AND,
              comparisons,
            },
          },
        },
      },
    })
  }

  const updateStartConditionLogicalOperator = (
    logicalOperator: LogicalOperator
  ) => {
    if (!probot) return
    updateProbot({
      updates: {
        settings: {
          ...probot.settings,
          whatsApp: {
            ...probot.settings.whatsApp,
            startCondition: {
              comparisons:
                probot.settings.whatsApp?.startCondition?.comparisons ?? [],
              logicalOperator,
            },
          },
        },
      },
    })
  }

  const updateIsStartConditionEnabled = (isEnabled: boolean) => {
    if (!probot) return
    updateProbot({
      updates: {
        settings: {
          ...probot.settings,
          whatsApp: {
            ...probot.settings.whatsApp,
            startCondition: !isEnabled
              ? undefined
              : {
                  comparisons: [],
                  logicalOperator: LogicalOperator.AND,
                },
          },
        },
      },
    })
  }

  const updateSessionExpiryTimeout = (sessionExpiryTimeout?: number) => {
    if (
      !probot ||
      (sessionExpiryTimeout &&
        (sessionExpiryTimeout <= 0 || sessionExpiryTimeout > 48))
    )
      return
    updateProbot({
      updates: {
        settings: {
          ...probot.settings,
          whatsApp: {
            ...probot.settings.whatsApp,
            sessionExpiryTimeout,
          },
        },
      },
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent ref={ref}>
        <ModalHeader>
          <Heading size="md">WhatsApp</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody as={Stack} spacing="6">
          {!hasProPerks(workspace) && (
            <UnlockPlanAlertInfo excludedPlans={['STARTER']}>
              Upgrade your workspace to <PlanTag plan="PRO" /> to be able to
              enable WhatsApp integration.
            </UnlockPlanAlertInfo>
          )}
          {!isPublished && phoneNumberData?.id && (
            <AlertInfo>You have modifications that can be published.</AlertInfo>
          )}
          <OrderedList spacing={4} pl="4">
            <ListItem>
              <HStack>
                <Text>Select a phone number:</Text>
                {workspace && (
                  <>
                    <WhatsAppCredentialsModal
                      isOpen={isCredentialsModalOpen}
                      onClose={onCredentialsModalClose}
                      onNewCredentials={updateCredentialsId}
                    />
                    <CredentialsDropdown
                      type="whatsApp"
                      workspaceId={workspace.id}
                      currentCredentialsId={
                        probot?.whatsAppCredentialsId ?? undefined
                      }
                      onCredentialsSelect={updateCredentialsId}
                      onCreateNewClick={onOpen}
                      credentialsName="WA phone number"
                      size="sm"
                    />
                  </>
                )}
              </HStack>
            </ListItem>
            {probot?.whatsAppCredentialsId && (
              <>
                <ListItem>
                  <Accordion allowToggle>
                    <AccordionItem>
                      <AccordionButton justifyContent="space-between">
                        Configure integration
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel as={Stack} spacing="4" pt="4">
                        <HStack>
                          <NumberInput
                            max={48}
                            min={0}
                            width="100px"
                            label="Session expire timeout:"
                            defaultValue={
                              whatsAppSettings?.sessionExpiryTimeout
                            }
                            placeholder={defaultSessionExpiryTimeout.toString()}
                            moreInfoTooltip="A number between 0 and 48 that represents the time in hours after which the session will expire if the user does not interact with the bot. The conversation restarts if the user sends a message after that expiration time."
                            onValueChange={updateSessionExpiryTimeout}
                            withVariableButton={false}
                            suffix="hours"
                          />
                        </HStack>
                        <SwitchWithRelatedSettings
                          label={'Start bot condition'}
                          initialValue={isDefined(
                            whatsAppSettings?.startCondition
                          )}
                          onCheckChange={updateIsStartConditionEnabled}
                        >
                          <TableList<Comparison>
                            initialItems={
                              whatsAppSettings?.startCondition?.comparisons ??
                              []
                            }
                            onItemsChange={updateStartConditionComparisons}
                            Item={WhatsAppComparisonItem}
                            ComponentBetweenItems={() => (
                              <Flex justify="center">
                                <DropdownList
                                  currentItem={
                                    whatsAppSettings?.startCondition
                                      ?.logicalOperator
                                  }
                                  onItemSelect={
                                    updateStartConditionLogicalOperator
                                  }
                                  items={Object.values(LogicalOperator)}
                                  size="sm"
                                />
                              </Flex>
                            )}
                            addLabel="Add a comparison"
                          />
                        </SwitchWithRelatedSettings>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </ListItem>

                <ListItem>
                  <SwitchWithLabel
                    isDisabled={!hasProPerks(workspace)}
                    label="Enable WhatsApp integration"
                    initialValue={
                      probot?.settings.whatsApp?.isEnabled ?? false
                    }
                    onCheckChange={toggleEnableWhatsApp}
                    justifyContent="flex-start"
                  />
                </ListItem>
                <ListItem>
                  <HStack>
                    <Text>Publish your bot:</Text>
                    <PublishButton size="sm" isMoreMenuDisabled />
                  </HStack>
                </ListItem>
                {phoneNumberData?.id && (
                  <ListItem>
                    <TextLink
                      href={`https://wa.me/${phoneNumberData.name}?text=Start`}
                      isExternal
                    >
                      Try it out
                    </TextLink>
                  </ListItem>
                )}
              </>
            )}
          </OrderedList>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  )
}
