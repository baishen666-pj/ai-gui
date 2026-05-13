import { test, expect } from '@playwright/test'

test.describe('Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads with chat view visible', async ({ page }) => {
    // The default view is 'chat', so ChatPanel should render
    // Look for the header that contains 'AI GUI' or '对话'
    const header = page.locator('header h2')
    await expect(header).toBeVisible()
    await expect(header).toHaveText(/AI GUI|对话/)
  })

  test('input area is present and typeable', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    await textarea.fill('Hello from E2E test')
    await expect(textarea).toHaveValue('Hello from E2E test')
  })

  test('slash command menu appears when typing /', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    // Clear and type just '/' to trigger the slash command menu
    await textarea.fill('/')
    await textarea.press('/')

    // The slash command menu should appear with known commands
    const slashMenu = page.locator('.fixed.z-50')
    await expect(slashMenu).toBeVisible()

    // Verify at least the /new command is shown
    await expect(page.locator('button:has-text("/new")')).toBeVisible()
  })

  test('new chat button exists in header', async ({ page }) => {
    // The '新对话' button appears in the chat header when messages are empty
    const newChatBtn = page.locator('header button:has-text("新对话")')
    await expect(newChatBtn).toBeVisible()
  })

  test('send button exists and is initially disabled', async ({ page }) => {
    const sendBtn = page.locator('button:has-text("发送")')
    await expect(sendBtn).toBeVisible()
    // Disabled when input is empty
    await expect(sendBtn).toBeDisabled()
  })

  test('session sidebar renders new chat button', async ({ page }) => {
    const newChatSidebarBtn = page.locator('button:has-text("+ 新对话")')
    await expect(newChatSidebarBtn).toBeVisible()
  })
})
