import { expect, test } from '@playwright/test'

test.describe('full read flow', () => {
  test('open first book from library and land on reader', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()

    const cards = page.locator('button').filter({ has: page.locator('img') })
    await expect(cards.first()).toBeVisible()
    await cards.first().click()

    await expect(page).toHaveURL(/\/reader\/[^/?]+/)
    await expect(page.getByRole('link', { name: '← Library' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Furigana:/ })).toBeVisible()
  })
})
