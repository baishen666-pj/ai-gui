import { test, expect } from '@playwright/test'

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('sidebar renders with navigation items', async ({ page }) => {
    const sidebar = page.locator('aside[role="navigation"]')
    await expect(sidebar).toBeVisible()

    // Verify all 9 nav items are present using their aria-labels
    const expectedLabels = ['聊天', '画布', '3D', '记忆', '工具', '定时', '工作流', '角色', '设置']
    for (const label of expectedLabels) {
      await expect(sidebar.locator(`button[aria-label="${label}"]`)).toBeVisible()
    }
  })

  test('chat is the default active view', async ({ page }) => {
    const chatBtn = page.locator('aside[role="navigation"] button[aria-label="聊天"]')
    await expect(chatBtn).toHaveAttribute('aria-current', 'page')
  })

  test('clicking canvas nav item switches to canvas view', async ({ page }) => {
    const canvasBtn = page.locator('aside[role="navigation"] button[aria-label="画布"]')
    await canvasBtn.click()
    await expect(canvasBtn).toHaveAttribute('aria-current', 'page')

    // Chat header should no longer be present
    const chatHeader = page.locator('header h2:has-text("AI GUI")')
    await expect(chatHeader).not.toBeVisible()
  })

  test('clicking 3D nav item switches to 3D view', async ({ page }) => {
    const btn = page.locator('aside[role="navigation"] button[aria-label="3D"]')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-current', 'page')
  })

  test('clicking settings nav item switches to settings view', async ({ page }) => {
    const settingsBtn = page.locator('aside[role="navigation"] button[aria-label="设置"]')
    await settingsBtn.click()
    await expect(settingsBtn).toHaveAttribute('aria-current', 'page')

    // Settings panel should show header
    const settingsHeader = page.locator('header h2:has-text("设置")')
    await expect(settingsHeader).toBeVisible()
  })

  test('clicking workflow nav item switches to workflow view', async ({ page }) => {
    const workflowBtn = page.locator('aside[role="navigation"] button[aria-label="工作流"]')
    await workflowBtn.click()
    await expect(workflowBtn).toHaveAttribute('aria-current', 'page')

    // Workflow is lazy-loaded; wait for the create button to confirm the view rendered
    await expect(page.locator('button:has-text("+ 新建工作流")')).toBeVisible({ timeout: 15000 })
  })

  test('theme toggle button is present', async ({ page }) => {
    const themeBtn = page.locator('aside[role="navigation"] button[aria-label^="切换主题"]')
    await expect(themeBtn).toBeVisible()
  })

  test('clicking theme toggle cycles through themes', async ({ page }) => {
    const themeBtn = page.locator('aside[role="navigation"] button[aria-label^="切换主题"]')

    // Default is dark
    await expect(themeBtn).toHaveAttribute('aria-label', /暗色/)

    // Click to cycle to light
    await themeBtn.click()
    await expect(themeBtn).toHaveAttribute('aria-label', /亮色/)

    // Click to cycle to cyberpunk
    await themeBtn.click()
    await expect(themeBtn).toHaveAttribute('aria-label', /赛博/)
  })
})
