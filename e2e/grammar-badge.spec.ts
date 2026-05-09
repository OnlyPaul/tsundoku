import { expect, test } from '@playwright/test'

test.describe('sentence-help grammar link', () => {
  test('sentence with linked grammar reveals explanation inline', async ({ page }) => {
    await page.goto('/reader/tsundoku-test')

    await expect(page.getByText('学生').first()).toBeVisible()

    const helpButton = page.getByRole('button', {
      name: /sentence help for 00-test-chapter-1-p3-s0/i,
    })
    await expect(helpButton).toBeVisible()
    await helpButton.click()

    await expect(page.getByText(/because i'?m a student/i)).toBeVisible()

    const grammarButton = page.getByRole('button', { name: /show linked grammar/i })
    await expect(grammarButton).toBeVisible()
    await grammarButton.click()

    await expect(page.getByText(/because \(casual reason\)/i)).toBeVisible()
    await expect(page.getByText(/reason or cause/i)).toBeVisible()
  })
})
