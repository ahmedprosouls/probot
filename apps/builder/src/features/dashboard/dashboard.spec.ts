import { createFolders } from '@/test/utils/databaseActions'
import { deleteButtonInConfirmDialog } from '@/test/utils/selectorUtils'
import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'

test('folders navigation should work', async ({ page }) => {
  await page.goto('/probots')
  const createFolderButton = page.locator('button:has-text("Create a folder")')
  await expect(createFolderButton).not.toBeDisabled()
  await createFolderButton.click()
  await page.click('text="New folder"')
  await page.fill('input[value="New folder"]', 'My folder #1')
  await Promise.all([
    page.waitForResponse((resp) => resp.request().method() === 'PATCH'),
    page.press('input[value="My folder #1"]', 'Enter'),
  ])
  await page.click('li:has-text("My folder #1")')
  await expect(page.locator('h1:has-text("My folder #1")')).toBeVisible()
  await createFolderButton.click()
  await page.click('text="New folder"')
  await page.fill('input', 'My folder #2')
  await page.press('input', 'Enter')

  await page.click('li:has-text("My folder #2")')
  await expect(page.locator('h1 >> text="My folder #2"')).toBeVisible()

  await page.click('text="Back"')
  await expect(page.locator('span >> text="My folder #2"')).toBeVisible()

  await page.click('text="Back"')
  await expect(page.locator('span >> text=My folder #1')).toBeVisible()
})

test('folders and probots should be deletable', async ({ page }) => {
  await createFolders([{ name: 'Folder #1' }, { name: 'Folder #2' }])
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  await createProbots([
    { id: 'deletable-probot', name: 'Probot #1', createdAt: tomorrow },
  ])
  await page.goto('/probots')
  await page.click('button[aria-label="Show Folder #1 menu"]')
  await page.click('li:has-text("Folder #1") >> button:has-text("Delete")')
  await deleteButtonInConfirmDialog(page).click()
  await expect(page.locator('span >> text="Folder #1"')).not.toBeVisible()
  await page.click('button[aria-label="Show more options"]')
  await page.click('li:has-text("Probot #1") >> button:has-text("Delete")')
  await deleteButtonInConfirmDialog(page).click()
  await expect(page.locator('span >> text="Probot #1"')).not.toBeVisible()
})

test('folders and probots should be movable', async ({ page }) => {
  const droppableFolderId = createId()
  await createFolders([{ id: droppableFolderId, name: 'Droppable folder' }])
  await createProbots([{ name: 'Draggable probot' }])
  await page.goto('/probots')
  const probotButton = page.locator('li:has-text("Draggable probot")')
  const folderButton = page.locator('li:has-text("Droppable folder")')
  await page.dragAndDrop(
    'li:has-text("Draggable probot")',
    'li:has-text("Droppable folder")'
  )
  await expect(probotButton).toBeHidden()
  await folderButton.click()
  await expect(page).toHaveURL(new RegExp(`/folders/${droppableFolderId}`))
  await expect(probotButton).toBeVisible()
  await page.dragAndDrop(
    'li:has-text("Draggable probot")',
    'a:has-text("Back")'
  )
  await expect(probotButton).toBeHidden()
  await page.click('a:has-text("Back")')
  await expect(probotButton).toBeVisible()
})

test.describe('Free user', () => {
  test("create folder shouldn't be available", async ({ page }) => {
    await page.goto('/probots')
    await page.click('text="Pro workspace"')
    await page.click('text="Free workspace"')
    await expect(page.locator('[data-testid="starter-lock-tag"]')).toBeVisible()
    await page.click('text=Create a folder')
    await expect(
      page.locator(
        'text="You need to upgrade your plan in order to create folders"'
      )
    ).toBeVisible()
  })
})
