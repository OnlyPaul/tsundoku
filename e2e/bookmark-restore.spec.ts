import { expect, test } from '@playwright/test'

test.describe('bookmark restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 200 })
  })

  test('reload returns reader to last-read paragraph', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    await expect(page.getByText('今日').first()).toBeVisible()

    await page.evaluate(() => {
      const p1 = document.querySelector('[data-paragraph-id="p1"]') as HTMLElement | null
      p1?.scrollIntoView({ block: 'start' })
    })

    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem('tsundoku:bookmark:tsundoku-test')),
      )
      .toMatch(/"paragraphId":"p1"/)

    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)

    await page.reload()

    await expect(page.getByText('今日').first()).toBeVisible()

    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })
})
