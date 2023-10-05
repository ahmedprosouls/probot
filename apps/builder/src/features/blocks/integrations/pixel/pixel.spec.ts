import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { IntegrationBlockType } from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe('Pixel block', () => {
  test('its configuration should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: IntegrationBlockType.PIXEL,
          options: {},
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)
    await page.click('text=Configure...')
    await page.getByPlaceholder('Pixel ID (e.g. "123456789")').fill('pixelid')
    await expect(page.getByText('Init Pixel')).toBeVisible()
    await page.getByText('Track event').click()
    await page.getByPlaceholder('Select event type').click()
    await page.getByRole('menuitem', { name: 'Lead' }).click()
    await expect(page.getByText('Track "Lead"')).toBeVisible()
    await page.getByRole('button', { name: 'Add parameter' }).click()
    await page.getByRole('button', { name: 'Select key' }).click()
    await page.getByRole('menuitem', { name: 'currency' }).click()
    await page.getByPlaceholder('Value').fill('USD')
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(
      page.getByText('Pixel is not enabled in Preview mode').nth(1)
    ).toBeVisible()
  })
})
