import { expect } from '@playwright/test'

// Ожидание загрузки данных
export async function waitForDataLoad(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout })
}

// Генерация уникальных данных
export function generateTestData(prefix = 'test') {
  const timestamp = Date.now()
  return {
    username: `${prefix}_${timestamp}`,
    email: `${prefix}_${timestamp}@test.com`,
    password: 'Test123!',
    deckTitle: `${prefix} Deck ${timestamp}`,
  }
}

// Ожидание модалки
export async function waitForModal(page, title) {
  await expect(page.locator('.modal h2')).toContainText(title)
}