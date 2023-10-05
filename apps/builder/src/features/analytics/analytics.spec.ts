import { getTestAsset } from '@/test/utils/playwright'
import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import {
  importProbotInDatabase,
  injectFakeResults,
} from '@typebot.io/lib/playwright/databaseActions'
import { starterWorkspaceId } from '@typebot.io/lib/playwright/databaseSetup'

test('analytics are not available for non-pro workspaces', async ({ page }) => {
  const probotId = createId()
  await importProbotInDatabase(
    getTestAsset('probots/results/submissionHeader.json'),
    {
      id: probotId,
      workspaceId: starterWorkspaceId,
    }
  )
  await injectFakeResults({ probotId, count: 10 })
  await page.goto(`/probots/${probotId}/results/analytics`)
  const firstDropoffBox = page.locator('text="%" >> nth=0')
  await firstDropoffBox.hover()
  await expect(
    page.locator('text="Upgrade your plan to PRO to reveal drop-off rate."')
  ).toBeVisible()
  await firstDropoffBox.click()
  await expect(
    page.locator(
      'text="You need to upgrade your plan in order to unlock in-depth analytics"'
    )
  ).toBeVisible()
})
