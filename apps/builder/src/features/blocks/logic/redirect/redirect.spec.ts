import test, { expect } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

const probotId = createId()

test.describe('Redirect block', () => {
  test('its configuration should work', async ({ page, context }) => {
    await importProbotInDatabase(
      getTestAsset('probots/logic/redirect.json'),
      {
        id: probotId,
      }
    )

    await page.goto(`/probots/${probotId}/edit`)
    await page.click('text=Configure...')
    await page.fill('input[placeholder="Type a URL..."]', 'google.com')

    await page.click('text=Preview')
    await page.locator('probot-standard').locator('text=Go to URL').click()
    await expect(page).toHaveURL('https://www.google.com')
    await page.goBack()

    await page.click('text=Redirect to google.com')
    await page.click('text=Open in new tab')

    await page.click('text=Preview')
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('probot-standard').locator('text=Go to URL').click(),
    ])
    await newPage.waitForLoadState()
    await expect(newPage).toHaveURL('https://www.google.com')
  })
})
