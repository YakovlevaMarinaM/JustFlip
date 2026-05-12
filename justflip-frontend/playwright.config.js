import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // Запускать тесты параллельно
  forbidOnly: !!process.env.CI, // Запретить .only в CI
  retries: process.env.CI ? 2 : 0, // Повторы в CI
  workers: process.env.CI ? 1 : undefined, // Ограничить воркеры в CI
  reporter: 'html', // Отчёт в HTML
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry', // Трассировка при ошибках
    screenshot: 'only-on-failure', // Скриншоты при падениях
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Запуск серверов перед тестами (опционально)
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
})