import test from '@playwright/test'
import { createProbots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import {
  defaultGoogleAnalyticsOptions,
  IntegrationBlockType,
} from '@typebot.io/schemas'
import { createId } from '@paralleldrive/cuid2'

test.describe('Google Analytics block', () => {
  test('its configuration should work', async ({ page }) => {
    const probotId = createId()
    await createProbots([
      {
        id: probotId,
        ...parseDefaultGroupWithBlock({
          type: IntegrationBlockType.GOOGLE_ANALYTICS,
          options: defaultGoogleAnalyticsOptions,
        }),
      },
    ])

    await page.goto(`/probots/${probotId}/edit`)
    await page.click('text=Configure...')
    await page.fill('input[placeholder="G-123456..."]', 'G-VWX9WG1TNS')
    await page.fill('input[placeholder="Example: conversion"]', 'conversion')
    await page.click('text=Advanced')
    await page.fill('input[placeholder="Example: Probot"]', 'Probot')
    await page.fill('input[placeholder="Example: Campaign Z"]', 'Campaign Z')
    await page.fill('input[placeholder="Example: 0"]', '0')
  })
})
