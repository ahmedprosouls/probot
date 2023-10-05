import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { IntegrationBlockType } from '@typebot.io/schemas'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { defaultBaseUrl } from '@typebot.io/schemas/features/blocks/integrations/openai'

const probotId = createId()

test('should be configurable', async ({ page }) => {
  await createProbots([
    {
      id: probotId,
      ...parseDefaultGroupWithBlock({
        type: IntegrationBlockType.OPEN_AI,
        options: {
          baseUrl: defaultBaseUrl,
        },
      }),
    },
  ])
  await page.goto(`/probots/${probotId}/edit`)
  await page.getByText('Configure...').click()
  await page.getByRole('button', { name: 'Add OpenAI account' }).click()
  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled()
  await page.getByPlaceholder('My account').fill('My account')
  await page.getByPlaceholder('sk-...').fill('sk-test')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('button', { name: 'Select task' }).click()
  await page.getByRole('menuitem', { name: 'Create chat completion' }).click()
  await page.getByRole('button', { name: 'Messages' }).click()
  await page.getByRole('button', { name: 'Select type' }).click()
  await page.getByRole('menuitem', { name: 'system' }).click()
  await page.getByPlaceholder('Content').first().fill('You are a helpful bot')
  await page.getByRole('button', { name: 'Add message' }).nth(1).click()
  await page.getByRole('button', { name: 'Select type' }).click()
  await page.getByRole('menuitem', { name: 'assistant' }).click()
  await page.getByPlaceholder('Content').nth(1).fill('Hi there!')
  await page.getByRole('button', { name: 'Save answer' }).click()
  await page.getByTestId('variables-input').click()
})
