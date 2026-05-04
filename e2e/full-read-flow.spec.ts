import { expect, test } from '@playwright/test'

test.describe('full read flow', () => {
  test('open book, tap token, see vocab popup, navigate to next chapter', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()

    const card = page.getByRole('button', { name: /Tsundoku テスト本/ })
    await expect(card).toBeVisible()
    await card.click()

    await expect(page).toHaveURL(/\/reader\/tsundoku-test/)
    await expect(page.getByText('私').first()).toBeVisible()

    await page.getByRole('button', { name: '私' }).click()

    const popup = page.getByRole('dialog')
    await expect(popup).toBeVisible()
    await expect(popup.getByText('わたし')).toBeVisible()
    await expect(popup.getByText(/\bI\b|me/)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(popup).toBeHidden()

    await page.getByRole('button', { name: /next/i }).click()

    await expect(page.getByText('今日')).toBeVisible()
    await expect(page.getByText('友達')).toBeVisible()
  })
})
