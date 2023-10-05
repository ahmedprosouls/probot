import test, { expect } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

const probotId = createId()

test.describe('Script block', () => {
  test('script should trigger', async ({ page }) => {
    await importProbotInDatabase(getTestAsset('probots/logic/script.json'), {
      id: probotId,
    })

    await page.goto(`/probots/${probotId}/edit`)
    await page.click('text=Configure...')
    await page.fill(
      'div[role="textbox"]',
      'window.location.href = "https://www.google.com"'
    )

    await page.click('text=Preview')
    await page.getByRole('button', { name: 'Trigger code' }).click()
    await expect(page).toHaveURL('https://www.google.com')
  })
})
