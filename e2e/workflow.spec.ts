import { test, expect } from '@playwright/test'

test.describe('Workflow View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Navigate to workflow view via sidebar
    const workflowBtn = page.locator('aside[role="navigation"] button[aria-label="工作流"]')
    await workflowBtn.click()

    // Wait for the lazy-loaded WorkflowEditor to finish loading.
    // It renders either the empty state text or the "+ 新建工作流" button.
    await page.locator('button:has-text("+ 新建工作流")').waitFor({ state: 'visible', timeout: 15000 })
  })

  test('workflow list renders with header', async ({ page }) => {
    const header = page.locator('header h2:has-text("工作流")')
    await expect(header).toBeVisible()
  })

  test('empty state shows when no workflows exist', async ({ page }) => {
    // The empty state shows the agent workflow description
    const emptyText = page.locator('text=Agent 工作流引擎')
    await expect(emptyText).toBeVisible()
  })

  test('can create a new workflow', async ({ page }) => {
    const createBtn = page.locator('button:has-text("+ 新建工作流")')
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // After creating, the editor should show with the new workflow name
    const editorHeader = page.locator('header h2:has-text("工作流")')
    await expect(editorHeader).toBeVisible()

    // The back button and node add buttons should appear
    const backBtn = page.locator('button[title="返回列表"]')
    await expect(backBtn).toBeVisible()
  })

  test('workflow editor shows node type buttons after creating workflow', async ({ page }) => {
    // Create a workflow first
    const createBtn = page.locator('button:has-text("+ 新建工作流")')
    await createBtn.click()

    // Verify node type add buttons appear
    await expect(page.locator('button:has-text("+ Agent")')).toBeVisible()
    await expect(page.locator('button:has-text("+ 条件")')).toBeVisible()
    await expect(page.locator('button:has-text("+ 结束")')).toBeVisible()
  })

  test('can navigate back from editor to list', async ({ page }) => {
    // Create a workflow
    await page.locator('button:has-text("+ 新建工作流")').click()

    // Click back button
    const backBtn = page.locator('button[title="返回列表"]')
    await backBtn.click()

    // Should be back at the list view with create button
    await expect(page.locator('button:has-text("+ 新建工作流")')).toBeVisible()
  })
})
