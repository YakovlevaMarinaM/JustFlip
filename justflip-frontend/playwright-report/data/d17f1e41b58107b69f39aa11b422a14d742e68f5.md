# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Авторизация >> выход из аккаунта
- Location: e2e/auth.spec.js:35:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button.btn-logout')

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
  3  | test.describe('Авторизация', () => {
  4  |   test('регистрация нового пользователя', async ({ page }) => {
  5  |     const username = `testuser_${Date.now()}`
  6  |     page.on('dialog', dialog => dialog.accept())
  7  |     
  8  |     await page.goto('http://localhost:5173/register')
  9  |     
  10 |     // ✅ Селекторы по ID
  11 |     await page.fill('#username', username)
  12 |     await page.fill('#email', `${username}@test.com`)
  13 |     await page.fill('#password', 'Test123!')
  14 |     await page.click('button[type="submit"]')
  15 |     
  16 |     // ✅ Ждём элемент дашборда
  17 |     await page.waitForSelector('.logo-text', { timeout: 20000 })
  18 |     await expect(page.locator('.logo-text')).toContainText('JustFlip')
  19 |   })
  20 | 
  21 |   test('вход с неверным паролем', async ({ page }) => {
  22 |     page.on('dialog', dialog => dialog.accept())
  23 |     
  24 |     await page.goto('http://localhost:5173/login')
  25 |     
  26 |     await page.fill('#username', 'wronguser')
  27 |     await page.fill('#password', 'wrongpass')
  28 |     await page.click('button[type="submit"]')
  29 |     
  30 |     // Проверяем ошибку
  31 |     await expect(page.locator('.global-error')).toBeVisible({ timeout: 5000 })
  32 |     await page.waitForSelector('#username', { timeout: 5000 })
  33 |   })
  34 | 
  35 |   test('выход из аккаунта', async ({ authenticatedPage }) => {
  36 |     // ✅ Кнопка "Выйти" имеет класс btn-logout
> 37 |     await authenticatedPage.click('button.btn-logout')
     |                             ^ Error: page.click: Test timeout of 30000ms exceeded.
  38 |     await authenticatedPage.waitForSelector('#username', { timeout: 10000 })
  39 |   })
  40 | })
  41 | 
```