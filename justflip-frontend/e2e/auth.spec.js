import { test, expect } from './fixtures'

test.describe('Авторизация', () => {
  test('регистрация нового пользователя', async ({ page }) => {
    const username = `testuser_${Date.now()}`
    page.on('dialog', dialog => dialog.accept())
    
    await page.goto('http://localhost:5173/register')
    
    // Селекторы по ID
    await page.fill('#username', username)
    await page.fill('#email', `${username}@test.com`)
    await page.fill('#password', 'Test123!')
    await page.click('button[type="submit"]')
    
    // Ждём элемент дашборда
    await page.waitForSelector('.logo-text', { timeout: 20000 })
    await expect(page.locator('.logo-text')).toContainText('JustFlip')
  })

  test('вход с неверным паролем', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept())
    
    await page.goto('http://localhost:5173/login')
    
    await page.fill('#username', 'wronguser')
    await page.fill('#password', 'wrongpass')
    await page.click('button[type="submit"]')
    
    // Проверяем ошибку
    await expect(page.locator('.global-error')).toBeVisible({ timeout: 5000 })
    await page.waitForSelector('#username', { timeout: 5000 })
  })

  test('выход из аккаунта', async ({ authenticatedPage }) => {
    // Кнопка "Выйти" имеет класс btn-logout
    await authenticatedPage.click('button.btn-logout')
    await authenticatedPage.waitForSelector('#username', { timeout: 10000 })
  })
})
