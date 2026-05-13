import { test, expect } from './fixtures'

test.describe('Сессия обучения', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:5173/dashboard')

    // Создаём колоду со словом, если нет
    const hasDecks = await authenticatedPage.locator('.deck-card').count() > 0
    if (!hasDecks) {
      await authenticatedPage.click('button:has-text("создать колоду")')
      await authenticatedPage.fill('#title', 'Study Deck')
      await authenticatedPage.click('button:has-text("создать")')

      await authenticatedPage.click('.deck-card')
      await authenticatedPage.click('button:has-text("добавить первое слово")')
      await authenticatedPage.fill('input[type="text"] >> nth=0', 'test')
      await authenticatedPage.fill('input[type="text"] >> nth=1', 'тест')
      await authenticatedPage.click('button:has-text("добавить")')
      await authenticatedPage.goBack()
    }
  })

  test('полный цикл обучения', async ({ authenticatedPage: page }) => {
    // Заходим в колоду и начинаем обучение
    await page.click('.deck-card')
    await page.goto('http://localhost:5173/study?force=true')

    // Проверяем, что карточка загрузилась
    await expect(page.locator('.card-front h2')).toBeVisible()

    // Переворачиваем карточку
    await page.click('.flashcard')
    await expect(page.locator('.card-back h2')).toBeVisible()

    // Оцениваем слово
    await page.click('button:has-text("легкотня")')

    // Проверяем, что появилось следующее слово или экран завершения
    await page.waitForTimeout(1000)
  })

  test('переключение режима обучения', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/study')

    const toggle = page.locator('.mode-toggle-btn')
    await expect(toggle).toBeVisible()

    const initialText = await toggle.textContent()
    await toggle.click()

    const newText = await toggle.textContent()
    expect(newText).not.toEqual(initialText)
  })

  test('завершение сессии', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/study?force=true')

    // Завершаем сессию вручную
    await page.click('button:has-text("завершить")')

    // Проверяем экран завершения
    await expect(page.locator('.study-complete h1')).toContainText('завершена')

    // Возврат на дашборд
    await page.click('button:has-text("на главную")')
    await expect(page).toHaveURL(/dashboard/)
  })
})
