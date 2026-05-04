import { expect, test } from '@playwright/test'

test.describe('grammar badge', () => {
  test('paragraph with grammar reference opens explanation sheet', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    await expect(page.getByText('日本語').first()).toBeVisible()

    const badge = page.getByRole('button', { name: /grammar/i })
    await expect(badge).toBeVisible()
    await badge.click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText(/ながら/)).toBeVisible()
    await expect(sheet.getByText(/simultaneously|while/i)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })
})
