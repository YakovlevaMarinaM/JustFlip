import { test, expect } from './fixtures'

test.describe('Управление колодами', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('.logo-text', { timeout: 10000 })
  })

  test('создание новой колоды', async ({ authenticatedPage: page }) => {
    await page.click('button.btn-new-deck')

    await page.fill('#title', 'E2E Test Deck')
    await page.fill('#description', 'Created by Playwright')
    await page.click('button.btn-create')

    await page.waitForSelector('.deck-card h3', { timeout: 10000 })
    // Берём первый найденный элемент с нужным текстом
    await expect(page.locator('.deck-card h3', { hasText: 'E2E Test Deck' }).first()).toBeVisible()
  })

  test('добавление слов в колоду', async ({ authenticatedPage: page }) => {
    await page.click('button.btn-new-deck')
    await page.fill('#title', 'Words Deck')
    await page.click('button.btn-create')

    await page.click('.deck-card')
    await page.waitForSelector('h1', { timeout: 10000 })

    await page.click('button.btn-add-word')

    await page.fill('#term', 'apple')
    await page.fill('#definition', 'яблоко')

    await page.click('button.btn-create')

    await page.waitForSelector('.word-card h3', { timeout: 10000 })
    await expect(page.locator('.word-card h3', { hasText: 'apple' }).first()).toBeVisible()
  })
})