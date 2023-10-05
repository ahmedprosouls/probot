import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import { defaultTextInputOptions, InputBlockType } from '@typebot.io/schemas'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'

test('should not be able to submit taken url ID', async ({ page }) => {
  const takenProbotId = createId()
  const probotId = createId()
  await createProbots([
    {
      id: takenProbotId,
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
        options: defaultTextInputOptions,
      }),
      publicId: 'taken-url-id',
    },
  ])
  await createProbots([
    {
      id: probotId,
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
        options: defaultTextInputOptions,
      }),
      publicId: probotId + '-public',
    },
  ])
  await page.goto(`/probots/${probotId}/share`)
  await page.getByText(`${probotId}-public`).click()
  await page.getByRole('textbox').fill('id with spaces')
  await page.getByRole('textbox').press('Enter')
  await expect(
    page
      .getByText('Can only contain lowercase letters, numbers and dashes.')
      .nth(0)
  ).toBeVisible()
  await page.getByText(`${probotId}-public`).click()
  await page.getByRole('textbox').fill('taken-url-id')
  await page.getByRole('textbox').press('Enter')
  await expect(page.getByText('ID is already taken').nth(0)).toBeVisible()
  await page.getByText(`${probotId}-public`).click()
  await page.getByRole('textbox').fill('new-valid-id')
  await page.getByRole('textbox').press('Enter')
  await expect(page.getByText('new-valid-id')).toBeVisible()
  await expect(page.getByText(`${probotId}-public`)).toBeHidden()
})
