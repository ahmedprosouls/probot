import test, { expect } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

const probotId = createId()

test.describe('AB Test block', () => {
  test('its configuration should work', async ({ page }) => {
    await importProbotInDatabase(getTestAsset('probots/logic/abTest.json'), {
      id: probotId,
    })

    await page.goto(`/probots/${probotId}/edit`)
    await page.getByText('A 50%').click()
    await page.getByLabel('Percent of users to follow A:').fill('100')
    await expect(page.getByText('A 100%')).toBeVisible()
    await expect(page.getByText('B 0%')).toBeVisible()
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(
      page.locator('probot-standard').getByText('How are you?')
    ).toBeVisible()
  })
})
