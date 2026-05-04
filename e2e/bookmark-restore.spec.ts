import { expect, test } from '@playwright/test'

test.describe('bookmark restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {}
    })
    await page.setViewportSize({ width: 375, height: 480 })
  })

  test('reload returns reader to last-read paragraph', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    const target = page.getByText('日本語').first()
    await expect(target).toBeVisible()
    await target.scrollIntoViewIfNeeded()

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem('tsundoku:bookmark:tsundoku-test')),
      )
      .toMatch(/p2/)

    await page.reload()

    const restored = page.getByText('日本語').first()
    await expect(restored).toBeInViewport()
  })
})
