import { test, expect } from './fixtures'

test.describe('Управление колодами', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('.logo-text', { timeout: 10000 })
  })

  test('создание новой колоды', async ({ authenticatedPage: page }) => {
    // Кнопка в хедере имеет класс btn-new-deck
    await page.click('button.btn-new-deck')
    
    await page.fill('#title', 'E2E Test Deck')
    await page.fill('#description', 'Created by Playwright')
    await page.click('button.btn-create')
    
    await page.waitForSelector('.deck-card h3', { timeout: 10000 })
    await expect(page.locator('.deck-card h3')).toContainText('E2E Test Deck')
  })

  test('добавление слов в колоду', async ({ authenticatedPage: page }) => {
    await page.click('button.btn-new-deck')
    await page.fill('#title', 'Words Deck')
    await page.click('button.btn-create')
    
    await page.click('.deck-card')
    await page.waitForSelector('h1', { timeout: 10000 })
    
    // Добавляем слово
    await page.click('button.btn-add-word')
    
    // В Deck.jsx инпуты без id — используем label + input
    await page.locator('label:has-text("Слово / термин") + input').fill('apple')
    await page.locator('label:has-text("Перевод / определение") + input').fill('яблоко')
    
    await page.click('button.btn-create')
    
    await page.waitForSelector('.word-card h3', { timeout: 10000 })
    await expect(page.locator('.word-card h3')).toContainText('apple')
  })
})
