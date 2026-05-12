import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Автоматически закрываем все алерты
    page.on('dialog', dialog => dialog.accept())
    
    // Переход на логин
    await page.goto('http://localhost:5173/login')
    
    // Селекторы по ID (как в Login.jsx)
    await page.fill('#username', 'e2etest')
    await page.fill('#password', 'Test123!')
    await page.click('button[type="submit"]')
    
    // Ждём элемент дашборда (не URL!)
    await page.waitForSelector('.logo-text', { timeout: 20000 })
    await page.waitForFunction(() => 
      document.querySelector('.logo-text')?.textContent?.includes('JustFlip'),
      { timeout: 5000 }
    )
    
    await use(page)
  },
})

export { expect } from '@playwright/test'
