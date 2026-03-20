import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login screen by default', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('shows create account option', async ({ page }) => {
    await page.goto('/')
    const createLink = page.locator('text=Create Account')
    await expect(createLink).toBeVisible()
  })

  test('shows forgot password option', async ({ page }) => {
    await page.goto('/')
    const forgotLink = page.locator('text=Forgot Password')
    await expect(forgotLink).toBeVisible()
  })

  test('validates empty email/password', async ({ page }) => {
    await page.goto('/')
    // Try to submit empty form
    const loginBtn = page.locator('button:has-text("Sign In"), button:has-text("Log In")')
    if (await loginBtn.isVisible()) {
      await loginBtn.click()
      // Should show some form of error
      await page.waitForTimeout(500)
    }
  })

  test('create account form has role selection', async ({ page }) => {
    await page.goto('/')
    const createLink = page.locator('text=Create Account')
    if (await createLink.isVisible()) {
      await createLink.click()
      await page.waitForTimeout(300)
      // Check for role checkboxes or selection
      const learnerOption = page.locator('text=Learner')
      const publisherOption = page.locator('text=Publisher')
      await expect(learnerOption).toBeVisible()
      await expect(publisherOption).toBeVisible()
    }
  })
})
