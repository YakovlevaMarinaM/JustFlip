import { test, expect } from './fixtures'

test.describe('Сессия обучения', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // fixtures уже залогинил и мы на дашборде
    await authenticatedPage.waitForSelector('.dashboard-container', { timeout: 10000 })

    // Проверяем есть ли хоть одно слово во всех колодах через API
    // Проще всего — просто всегда идём на /study?force=true и проверяем что карточка есть
    // Если слов нет — создаём колоду со словом
    const hasDecks = await authenticatedPage.locator('.deck-card').count() > 0
    if (!hasDecks) {
      await authenticatedPage.click('button.btn-new-deck')
      await authenticatedPage.fill('#title', 'Study Deck')
      await authenticatedPage.click('button.btn-create')
      await authenticatedPage.waitForSelector('.deck-card', { timeout: 10000 })
    }

    // Заходим в первую колоду и добавляем слово если слов нет
    await authenticatedPage.click('.deck-card')
    await authenticatedPage.waitForSelector('.deck-container', { timeout: 10000 })

    const hasWords = await authenticatedPage.locator('.word-card').count() > 0
    if (!hasWords) {
      await authenticatedPage.click('button.btn-add-word')
      await authenticatedPage.fill('#term', 'test')
      await authenticatedPage.fill('#definition', 'тест')
      await authenticatedPage.click('button.btn-create')
      await authenticatedPage.waitForSelector('.word-card', { timeout: 10000 })
    }

    await authenticatedPage.goBack()
    await authenticatedPage.waitForSelector('.dashboard-container', { timeout: 10000 })
  })

  test('полный цикл обучения', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/study?force=true')

    await expect(page.locator('.card-front h2')).toBeVisible()

    await page.click('.flashcard')
    await expect(page.locator('.card-back h2')).toBeVisible()

    await page.click('button:has-text("легкотня")')

    await page.waitForTimeout(1000)
  })

  test('переключение режима обучения', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/study?force=true')

    await page.click('button:has-text("завершить")')

    const toggle = page.locator('.mode-toggle-btn')
    await expect(toggle).toBeVisible()

    const initialText = await toggle.textContent()
    await toggle.click()

    const newText = await toggle.textContent()
    expect(newText).not.toEqual(initialText)
  })

  test('завершение сессии', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/study?force=true')

    await page.click('button:has-text("завершить")')

    await expect(page.locator('.study-complete h1')).toContainText('завершена')

    await page.click('button:has-text("на главную")')
    await expect(page).toHaveURL(/dashboard/)
  })
})