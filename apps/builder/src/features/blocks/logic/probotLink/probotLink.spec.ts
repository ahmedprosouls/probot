import test, { expect } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

test('should be configurable', async ({ page }) => {
  const probotId = createId()
  const linkedProbotId = createId()
  await importProbotInDatabase(
    getTestAsset('probots/logic/linkProbots/1.json'),
    { id: probotId, name: 'My link probot 1' }
  )
  await importProbotInDatabase(
    getTestAsset('probots/logic/linkProbots/2.json'),
    { id: linkedProbotId, name: 'My link probot 2' }
  )

  await page.goto(`/probots/${probotId}/edit`)
  await page.click('text=Configure...')
  await page.click('input[placeholder="Select a probot"]')
  await page.click('text=My link probot 2')
  await expect(page.locator('input[value="My link probot 2"]')).toBeVisible()
  await expect(page.getByText('Jump in My link probot 2')).toBeVisible()
  await page.click('[aria-label="Navigate to probot"]')
  await expect(page).toHaveURL(
    `/probots/${linkedProbotId}/edit?parentId=${probotId}`
  )
  await page.waitForTimeout(500)
  await page.click('[aria-label="Navigate back"]')
  await expect(page).toHaveURL(`/probots/${probotId}/edit`)
  await page.click('text=Jump in My link probot 2')
  await expect(page.getByTestId('selected-item-label').first()).toHaveText(
    'My link probot 2'
  )
  await page.click('input[placeholder="Select a block"]')
  await page.click('text=Group #2')

  await page.click('text=Preview')
  await expect(
    page.locator('probot-standard').locator('text=Second block')
  ).toBeVisible()

  await page.click('[aria-label="Close"]')
  await page.click('text=Jump to Group #2 in My link probot 2')
  await page.getByTestId('selected-item-label').nth(1).click({ force: true })
  await page.click('button >> text=Start')

  await page.click('text=Preview')
  await page.locator('probot-standard').locator('input').fill('Hello there!')
  await page.locator('probot-standard').locator('input').press('Enter')
  await expect(
    page.locator('probot-standard').locator('text=Hello there!')
  ).toBeVisible()

  await page.click('[aria-label="Close"]')
  await page.click('text=Jump to Start in My link probot 2')
  await page.waitForTimeout(1000)
  await page.getByTestId('selected-item-label').first().click({ force: true })
  await page.click('button >> text=Current probot')
  await page.getByRole('textbox').nth(1).click()
  await page.click('button >> text=Hello')

  await page.click('text=Preview')
  await expect(
    page.locator('probot-standard').locator('text=Hello world')
  ).toBeVisible()
})
