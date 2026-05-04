import { expect, test } from '@playwright/test'

test.describe('furigana toggle', () => {
  test('toggle hides/shows furigana and persists across reload', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    const furigana = page.locator('rt').first()
    await expect(furigana).toBeVisible()

    const toggle = page.getByRole('button', { name: /furigana/i })
    await toggle.click()

    await expect(furigana).toBeHidden()

    await page.reload()
    await expect(page.locator('rt').first()).toBeHidden()

    await page.getByRole('button', { name: /furigana/i }).click()
    await expect(page.locator('rt').first()).toBeVisible()

    await page.reload()
    await expect(page.locator('rt').first()).toBeVisible()
  })
})
