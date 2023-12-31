import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import {
  defaultEmailInputOptions,
  InputBlockType,
  invalidEmailDefaultRetryMessage,
} from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe('Email input block', () => {
  test('options should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.EMAIL,
          options: defaultEmailInputOptions,
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)

    await page.click('text=Preview')
    await expect(
      page.locator(
        `input[placeholder="${defaultEmailInputOptions.labels.placeholder}"]`
      )
    ).toHaveAttribute('type', 'email')
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled()

    await page.click(`text=${defaultEmailInputOptions.labels.placeholder}`)
    await page.fill(
      `input[value="${defaultEmailInputOptions.labels.placeholder}"]`,
      'Your email...'
    )
    await expect(page.locator('text=Your email...')).toBeVisible()
    await page.getByLabel('Button label:').fill('Go')
    await page.fill(
      `input[value="${invalidEmailDefaultRetryMessage}"]`,
      'Try again bro'
    )

    await page.click('text=Restart')
    await page.locator(`input[placeholder="Your email..."]`).fill('test@test')
    await page.getByRole('button', { name: 'Go' }).click()
    await expect(page.locator('text=Try again bro')).toBeVisible()
    await page
      .locator(`input[placeholder="Your email..."]`)
      .fill('test@test.com')
    await page.getByRole('button', { name: 'Go' }).click()
    await expect(page.locator('text=test@test.com')).toBeVisible()
  })
})
