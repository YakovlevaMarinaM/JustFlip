# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deck-management.spec.js >> Управление колодами >> добавление слов в колоду
- Location: e2e/deck-management.spec.js:20:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button.btn-new-deck')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img [ref=e8]
    - generic [ref=e11]: JustFlip
  - heading "Вход" [level=1] [ref=e12]
  - paragraph [ref=e13]: Добро пожаловать обратно! ✦
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]: Имя пользователя
      - generic [ref=e17]:
        - img
        - textbox "Имя пользователя" [ref=e18]:
          - /placeholder: username123
          - text: e2etest
    - generic [ref=e19]:
      - generic [ref=e20]: Пароль
      - generic [ref=e21]:
        - img
        - textbox "Пароль" [ref=e22]:
          - /placeholder: ••••••••
          - text: Test123!
    - generic [ref=e23]: Неверный логин или пароль
    - button "Войти" [ref=e24] [cursor=pointer]
  - generic [ref=e26]: или
  - button "Войти через Google" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
    - text: Войти через Google
  - paragraph [ref=e33]:
    - text: Нет аккаунта?
    - link "Зарегистрироваться" [ref=e34] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test.describe('Управление колодами', () => {
  4  |   test.beforeEach(async ({ authenticatedPage }) => {
  5  |     await authenticatedPage.waitForSelector('.logo-text', { timeout: 10000 })
  6  |   })
  7  | 
  8  |   test('создание новой колоды', async ({ authenticatedPage: page }) => {
  9  |     // ✅ Кнопка в хедере имеет класс btn-new-deck
  10 |     await page.click('button.btn-new-deck')
  11 |     
  12 |     await page.fill('#title', 'E2E Test Deck')
  13 |     await page.fill('#description', 'Created by Playwright')
  14 |     await page.click('button.btn-create')
  15 |     
  16 |     await page.waitForSelector('.deck-card h3', { timeout: 10000 })
  17 |     await expect(page.locator('.deck-card h3')).toContainText('E2E Test Deck')
  18 |   })
  19 | 
  20 |   test('добавление слов в колоду', async ({ authenticatedPage: page }) => {
> 21 |     await page.click('button.btn-new-deck')
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  22 |     await page.fill('#title', 'Words Deck')
  23 |     await page.click('button.btn-create')
  24 |     
  25 |     await page.click('.deck-card')
  26 |     await page.waitForSelector('h1', { timeout: 10000 })
  27 |     
  28 |     // Добавляем слово
  29 |     await page.click('button.btn-add-word')
  30 |     
  31 |     // ✅ В Deck.jsx инпуты без id — используем label + input
  32 |     await page.locator('label:has-text("Слово / термин") + input').fill('apple')
  33 |     await page.locator('label:has-text("Перевод / определение") + input').fill('яблоко')
  34 |     
  35 |     await page.click('button.btn-create')
  36 |     
  37 |     await page.waitForSelector('.word-card h3', { timeout: 10000 })
  38 |     await expect(page.locator('.word-card h3')).toContainText('apple')
  39 |   })
  40 | })
  41 | 
```