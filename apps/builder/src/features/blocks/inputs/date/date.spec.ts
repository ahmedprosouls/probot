import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { defaultDateInputOptions, InputBlockType } from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe('Date input block', () => {
  test('options should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.DATE,
          options: defaultDateInputOptions,
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)

    await page.click('text=Preview')
    await expect(page.locator('[data-testid="from-date"]')).toHaveAttribute(
      'type',
      'date'
    )
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled()
    await page.locator('[data-testid="from-date"]').fill('2021-01-01')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('text="01/01/2021"')).toBeVisible()

    await page.click(`text=Pick a date...`)
    await page.click('text=Is range?')
    await page.click('text=With time?')
    await page.getByLabel('From label:').fill('Previous:')
    await page.getByLabel('To label:').fill('After:')
    await page.getByLabel('Button label:').fill('Go')

    await page.click('text=Restart')
    await expect(page.locator(`[data-testid="from-date"]`)).toHaveAttribute(
      'type',
      'datetime-local'
    )
    await expect(page.locator(`[data-testid="to-date"]`)).toHaveAttribute(
      'type',
      'datetime-local'
    )
    await page.locator('[data-testid="from-date"]').fill('2021-01-01T11:00')
    await page.locator('[data-testid="to-date"]').fill('2022-01-01T09:00')
    await page.getByRole('button', { name: 'Go' }).click()
    await expect(
      page.locator('text="01/01/2021 11:00 to 01/01/2022 09:00"')
    ).toBeVisible()

    await page.click(`text=Pick a date...`)
    await page.getByPlaceholder('dd/MM/yyyy HH:mm').fill('dd.MM HH:mm')
    await page.click('text=Restart')
    await page.locator('[data-testid="from-date"]').fill('2023-01-01T11:00')
    await page.locator('[data-testid="to-date"]').fill('2023-02-01T09:00')
    await page.getByRole('button', { name: 'Go' }).click()
    await expect(
      page.locator('text="01.01 11:00 to 01.02 09:00"')
    ).toBeVisible()
  })
})
