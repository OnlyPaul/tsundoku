import { expect, test } from '@playwright/test'

test.describe('grammar badge', () => {
  test('paragraph with grammar reference opens explanation sheet', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    await expect(page.getByText('学生').first()).toBeVisible()

    const badge = page.getByRole('button', { name: /grammar/i })
    await expect(badge).toBeVisible()
    await badge.click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { name: /because/i })).toBeVisible()
    await expect(sheet.getByText(/reason or cause/i)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })
})
