import { expect, test } from '@playwright/test'

test('home screen lists fixture book and navigates to reader', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()
  const card = page.getByRole('button', { name: /Tsundoku テスト本/ })
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/reader\/tsundoku-test/)
})
