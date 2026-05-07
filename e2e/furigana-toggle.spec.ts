import { expect, test } from '@playwright/test'

test.describe('furigana toggle', () => {
  test('toggle hides/shows furigana and persists across reload', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    const furigana = page.locator('article rt').first()
    await expect(furigana).toBeVisible()

    async function openSettingsAndClickFuriganaSwitch() {
      await page.getByRole('button', { name: /reading settings/i }).click()
      await page.getByRole('switch', { name: /furigana/i }).click()
      // Close the sheet so the next assertion observes the prose surface only.
      await page.keyboard.press('Escape')
    }

    await openSettingsAndClickFuriganaSwitch()
    await expect(page.locator('article rt').first()).toBeHidden()

    await page.reload()
    await expect(page.locator('article rt').first()).toBeHidden()

    await openSettingsAndClickFuriganaSwitch()
    await expect(page.locator('article rt').first()).toBeVisible()

    await page.reload()
    await expect(page.locator('article rt').first()).toBeVisible()
  })
})
