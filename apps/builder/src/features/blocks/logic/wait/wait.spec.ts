import test, { expect } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

const probotId = createId()

test.describe('Wait block', () => {
  test('wait should trigger', async ({ page }) => {
    await importProbotInDatabase(getTestAsset('probots/logic/wait.json'), {
      id: probotId,
    })

    await page.goto(`/probots/${probotId}/edit`)
    await page.click('text=Configure...')
    await page.getByRole('textbox', { name: 'Seconds to wait for:' }).fill('3')

    await page.click('text=Preview')
    await page.getByRole('button', { name: 'Wait now' }).click()
    await page.waitForTimeout(1000)
    await expect(
      page.locator('probot-standard').locator('text="Hi there!"')
    ).toBeHidden()
    await page.waitForTimeout(3000)
    await expect(
      page.locator('probot-standard').locator('text="Hi there!"')
    ).toBeVisible()
  })
})
