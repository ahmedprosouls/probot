import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { defaultUrlInputOptions, InputBlockType } from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe('Url input block', () => {
  test('options should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.URL,
          options: defaultUrlInputOptions,
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)

    await page.click('text=Preview')
    await expect(
      page.locator(
        `input[placeholder="${defaultUrlInputOptions.labels.placeholder}"]`
      )
    ).toHaveAttribute('type', 'url')
    await expect(
      page.locator('probot-standard').locator(`button`)
    ).toBeDisabled()

    await page.click(`text=${defaultUrlInputOptions.labels.placeholder}`)
    await page.getByLabel('Placeholder:').fill('Your URL...')
    await expect(page.locator('text=Your URL...')).toBeVisible()
    await page.getByLabel('Button label:').fill('Go')
    await page.fill(
      `input[value="${defaultUrlInputOptions.retryMessageContent}"]`,
      'Try again bro'
    )

    await page.click('text=Restart')
    await page
      .locator(`input[placeholder="Your URL..."]`)
      .fill('https://https://test')
    await page.locator('button >> text="Go"').click()
    await expect(page.locator('text=Try again bro')).toBeVisible()
    await page
      .locator(`input[placeholder="Your URL..."]`)
      .fill('https://website.com')
    await page.locator('button >> text="Go"').click()
    await expect(page.locator('text=https://website.com')).toBeVisible()
  })
})
