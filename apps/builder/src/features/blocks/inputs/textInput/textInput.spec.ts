import test, { expect } from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { defaultTextInputOptions, InputBlockType } from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe.parallel('Text input block', () => {
  test('options should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.TEXT,
          options: defaultTextInputOptions,
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)

    await page.click('text=Preview')
    await expect(
      page.locator(
        `input[placeholder="${defaultTextInputOptions.labels.placeholder}"]`
      )
    ).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled()

    await page.click(`text=${defaultTextInputOptions.labels.placeholder}`)
    await page.getByLabel('Placeholder:').fill('Your name...')
    await page.getByLabel('Button label:').fill('Go')
    await page.click('text=Long text?')

    await page.click('text=Restart')
    await expect(
      page.locator(`textarea[placeholder="Your name..."]`)
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go' })).toBeVisible()
  })
})
