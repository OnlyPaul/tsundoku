import { expect, test } from '@playwright/test'

test('placeholder page is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '積ん読' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
})
