import test, { expect } from '@playwright/test'
import { defaultTextInputOptions, InputBlockType } from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'
import {
  createProbots,
  importProbotInDatabase,
} from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import { getTestAsset } from '@/test/utils/playwright'

test.describe.configure({ mode: 'parallel' })

test('Edges connection should work', async ({ page }) => {
  const probotId = createId()
  await createProbots([
    {
      id: probotId,
    },
  ])
  await page.goto(`/probots/${probotId}/edit`)
  await expect(page.locator("text='Start'")).toBeVisible()
  await page.dragAndDrop('text=Button', '#editor-container', {
    targetPosition: { x: 1000, y: 400 },
  })
  await page.dragAndDrop(
    'text=Text >> nth=0',
    '[data-testid="group"] >> nth=1',
    {
      targetPosition: { x: 100, y: 50 },
    }
  )
  await page.dragAndDrop(
    '[data-testid="endpoint"]',
    '[data-testid="group"] >> nth=1',
    { targetPosition: { x: 100, y: 10 } }
  )
  await expect(page.locator('[data-testid="edge"]')).toBeVisible()
  await page.dragAndDrop(
    '[data-testid="endpoint"]',
    '[data-testid="group"] >> nth=1'
  )
  await expect(page.locator('[data-testid="edge"]')).toBeVisible()
  await page.dragAndDrop('text=Date', '#editor-container', {
    targetPosition: { x: 1000, y: 800 },
  })
  await page.dragAndDrop(
    '[data-testid="endpoint"] >> nth=2',
    '[data-testid="group"] >> nth=2',
    {
      targetPosition: { x: 100, y: 10 },
    }
  )
  await expect(page.locator('[data-testid="edge"] >> nth=0')).toBeVisible()
  await expect(page.locator('[data-testid="edge"] >> nth=1')).toBeVisible()

  await page.click('[data-testid="clickable-edge"] >> nth=0', {
    force: true,
    button: 'right',
  })
  await page.click('text=Delete')
  const total = await page.locator('[data-testid="edge"]').count()
  expect(total).toBe(1)
})
test('Drag and drop blocks and items should work', async ({ page }) => {
  const probotId = createId()
  await importProbotInDatabase(
    getTestAsset('probots/editor/buttonsDnd.json'),
    {
      id: probotId,
    }
  )

  // Blocks dnd
  await page.goto(`/probots/${probotId}/edit`)
  await expect(page.locator('[data-testid="block"] >> nth=1')).toHaveText(
    'Hello!'
  )
  await page.dragAndDrop('text=Hello', '[data-testid="block"] >> nth=3', {
    targetPosition: { x: 100, y: 0 },
  })
  await expect(page.locator('[data-testid="block"] >> nth=2')).toHaveText(
    'Hello!'
  )
  await page.dragAndDrop('text=Hello', 'text=Group #2')
  await expect(page.locator('[data-testid="block"] >> nth=3')).toHaveText(
    'Hello!'
  )

  // Items dnd
  await expect(page.locator('[data-testid="item"] >> nth=0')).toHaveText(
    'Item 1'
  )
  await page.dragAndDrop('text=Item 1', 'text=Item 3')
  await expect(page.locator('[data-testid="item"] >> nth=2')).toHaveText(
    'Item 1'
  )
  await expect(page.locator('[data-testid="item"] >> nth=1')).toHaveText(
    'Item 3'
  )
  await page.dragAndDrop('text=Item 3', 'text=Item 2-3')
  await expect(page.locator('[data-testid="item"] >> nth=7')).toHaveText(
    'Item 3'
  )

  await expect(page.locator('[data-testid="item"] >> nth=2')).toHaveText(
    'Name=John'
  )
  await page.dragAndDrop(
    '[data-testid="item"] >> nth=2',
    '[data-testid="item"] >> nth=3'
  )
  await expect(page.locator('[data-testid="item"] >> nth=3')).toHaveText(
    'Name=John'
  )
})
test('Undo / Redo and Zoom buttons should work', async ({ page }) => {
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
  await page.click('text=Group #1', { button: 'right' })
  await page.click('text=Duplicate')
  await expect(page.locator('text="Group #1"')).toBeVisible()
  await expect(page.locator('text="Group #1 copy"')).toBeVisible()
  await page.click('text="Group #1"', { button: 'right' })
  await page.click('text=Delete')
  await expect(page.locator('text="Group #1"')).toBeHidden()
  await page.click('button[aria-label="Undo"]')
  await expect(page.locator('text="Group #1"')).toBeVisible()
  await page.click('button[aria-label="Redo"]')
  await expect(page.locator('text="Group #1"')).toBeHidden()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByTestId('graph')).toHaveAttribute(
    'style',
    /scale\(1\.2\);$/
  )
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByTestId('graph')).toHaveAttribute(
    'style',
    /scale\(1\.4\);$/
  )
  await page.getByRole('button', { name: 'Zoom out' }).dblclick()
  await page.getByRole('button', { name: 'Zoom out' }).dblclick()
  await expect(page.getByTestId('graph')).toHaveAttribute(
    'style',
    /scale\(0\.6\);$/
  )
})

test('Rename and icon change should work', async ({ page }) => {
  const probotId = createId()
  await createProbots([
    {
      id: probotId,
      name: 'My awesome probot',
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
        options: defaultTextInputOptions,
      }),
    },
  ])

  await page.goto(`/probots/${probotId}/edit`)
  await page.click('[data-testid="editable-icon"]')
  await page.getByRole('button', { name: 'Emoji' }).click()
  await expect(page.locator('text="My awesome probot"')).toBeVisible()
  await page.fill('input[placeholder="Search..."]', 'love')
  await page.click('text="😍"')
  await page.click('text="My awesome probot"')
  await page.fill('input[value="My awesome probot"]', 'My superb probot')
  await page.press('input[value="My superb probot"]', 'Enter')
  await page.click('[aria-label="Navigate back"]')
  await expect(page.locator('text="😍"')).toBeVisible()
  await expect(page.locator('text="My superb probot"')).toBeVisible()
})

test('Preview from group should work', async ({ page }) => {
  const probotId = createId()
  await importProbotInDatabase(
    getTestAsset('probots/editor/previewFromGroup.json'),
    {
      id: probotId,
    }
  )

  await page.goto(`/probots/${probotId}/edit`)
  await page
    .getByTestId('group')
    .nth(1)
    .click({ position: { x: 100, y: 10 } })
  await page.click('[aria-label="Preview bot from this group"]')
  await expect(
    page.locator('probot-standard').locator('text="Hello this is group 1"')
  ).toBeVisible()
  await page
    .getByTestId('group')
    .nth(2)
    .click({ position: { x: 100, y: 10 } })
  await page.click('[aria-label="Preview bot from this group"]')
  await expect(
    page.locator('probot-standard').locator('text="Hello this is group 2"')
  ).toBeVisible()
  await page.click('[aria-label="Close"]')
  await page.click('text="Preview"')
  await expect(
    page.locator('probot-standard').locator('text="Hello this is group 1"')
  ).toBeVisible()
})

test('Published probot menu should work', async ({ page }) => {
  const probotId = createId()
  await createProbots([
    {
      id: probotId,
      name: 'My awesome probot',
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
        options: defaultTextInputOptions,
      }),
    },
  ])
  await page.goto(`/probots/${probotId}/edit`)
  await expect(page.locator("text='Start'")).toBeVisible()
  await expect(page.locator('button >> text="Published"')).toBeVisible()
  await page.click('[aria-label="Show published probot menu"]')
  await page.click('text="Close probot to new responses"')
  await expect(page.locator('button >> text="Closed"')).toBeDisabled()
  await page.click('[aria-label="Show published probot menu"]')
  await page.click('text="Reopen probot to new responses"')
  await expect(page.locator('button >> text="Published"')).toBeDisabled()
  await page.click('[aria-label="Show published probot menu"]')
  await page.click('button >> text="Unpublish probot"')
  await page.click('button >> text="Publish"')
  await expect(page.locator('button >> text="Published"')).toBeVisible()
})
