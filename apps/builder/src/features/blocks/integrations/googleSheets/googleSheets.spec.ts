import test, { expect, Page } from '@playwright/test'
import { importProbotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { getTestAsset } from '@/test/utils/playwright'

test.describe.parallel('Google sheets integration', () => {
  test('Insert row should work', async ({ page }) => {
    const probotId = createId()
    await importProbotInDatabase(
      getTestAsset('probots/integrations/googleSheets.json'),
      {
        id: probotId,
      }
    )
    await page.goto(`/probots/${probotId}/edit`)
    await fillInSpreadsheetInfo(page)
    await page.click('text=Select an operation')
    await page.click('text=Insert a row')

    await page.click('text=Add a value')
    await page.click('text=Select a column')
    await page.click('button >> text="Email"')
    await page.click('[aria-label="Insert a variable"]')
    await page.click('button >> text="Email" >> nth=1')

    await page.click('text=Add a value')
    await page.click('text=Select a column')
    await page.click('text=First name')
    await page.fill(
      'input[placeholder="Type a value..."] >> nth = 1',
      'Georges'
    )

    await page.click('text=Preview')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .fill('georges@gmail.com')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .press('Enter')
    await expect(
      page.getByText('Succesfully inserted row in CRM > Sheet1').nth(0)
    ).toBeVisible()
  })

  test('Update row should work', async ({ page }) => {
    const probotId = createId()
    await importProbotInDatabase(
      getTestAsset('probots/integrations/googleSheets.json'),
      {
        id: probotId,
      }
    )
    await page.goto(`/probots/${probotId}/edit`)
    await fillInSpreadsheetInfo(page)
    await page.click('text=Select an operation')
    await page.click('text=Update a row')

    await page.getByRole('button', { name: 'Row(s) to update' }).click()
    await page.getByRole('button', { name: 'Add filter rule' }).click()
    await page.click('text=Select a column')
    await page.click('button >> text="Email"')
    await page.getByRole('button', { name: 'Select an operator' }).click()
    await page.getByRole('menuitem', { name: 'Equal to' }).click()
    await page.click('[aria-label="Insert a variable"]')
    await page.click('button >> text="Email" >> nth=1')

    await page.getByRole('button', { name: 'Cells to update' }).click()
    await page.click('text=Add a value')
    await page.click('text=Select a column')
    await page.click('text=Last name')
    await page.fill(
      'input[placeholder="Type a value..."] >> nth = 1',
      'Last name'
    )

    await page.click('text=Preview')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .fill('test@test.com')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .press('Enter')
    await expect(
      page.getByText('Succesfully updated matching rows').nth(0)
    ).toBeVisible()
  })

  test('Get row should work', async ({ page }) => {
    const probotId = createId()
    await importProbotInDatabase(
      getTestAsset('probots/integrations/googleSheetsGet.json'),
      {
        id: probotId,
      }
    )
    await page.goto(`/probots/${probotId}/edit`)
    await fillInSpreadsheetInfo(page)
    await page.click('text=Select an operation')
    await page.click('text=Get data from sheet')

    await page.getByRole('button', { name: 'Rows to filter' }).click()
    await page.getByRole('button', { name: 'Add filter rule' }).click()
    await page.click('text=Select a column')
    await page.click('button >> text="Email"')
    await page.getByRole('button', { name: 'Select an operator' }).click()
    await page.getByRole('menuitem', { name: 'Equal to' }).click()
    await page.click('[aria-label="Insert a variable"]')
    await page.click('button >> text="Email" >> nth=1')

    await page.getByRole('button', { name: 'Add filter rule' }).click()
    await page.getByRole('button', { name: 'AND', exact: true }).click()
    await page.getByRole('menuitem', { name: 'OR' }).click()

    await page.getByRole('button', { name: 'Columns to extract' }).click()
    await page.click('text=Select a column')
    await page.getByRole('menuitem', { name: 'Email' }).click()
    await page.getByRole('button', { name: 'Select an operator' }).click()
    await page.getByRole('menuitem', { name: 'Equal to' }).click()
    await page.getByPlaceholder('Type a value...').nth(-1).fill('test@test.com')

    await page.click('text=Select a column')
    await page.getByRole('menuitem', { name: 'First name' }).click()
    await createNewVar(page, 'First name')

    await page.click('text=Add a value')
    await page.click('text=Select a column')
    await page.getByRole('menuitem', { name: 'Last name' }).click()
    await createNewVar(page, 'Last name')

    await page.click('text=Preview')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .fill('test2@test.com')
    await page
      .locator('probot-standard')
      .locator('input[placeholder="Type your email..."]')
      .press('Enter')
    await expect(
      page.locator('probot-standard').locator('text=Your name is:')
    ).toHaveText(`Your name is: Georges2 Last name`)
  })
})

const fillInSpreadsheetInfo = async (page: Page) => {
  await page.click('text=Configure...')
  await page.click('text=Select Sheets account')
  await page.click('text=pro-user@email.com')

  await page.fill('input[placeholder="Search for spreadsheet"]', 'CR')
  await page.click('text=CRM')

  await page.fill('input[placeholder="Select the sheet"]', 'Sh')
  await page.click('text=Sheet1')
}

const createNewVar = async (page: Page, name: string) => {
  await page.fill('input[placeholder="Select a variable"] >> nth=-1', name)
  await page.getByRole('menuitem', { name: `Create ${name}` }).click()
}
