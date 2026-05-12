import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Чтобы не импортировать describe/it/expect
    environment: 'jsdom', // Имитация браузера
    setupFiles: './src/setupTests.js', // Файл инициализации
    css: false, // Отключаем обработку CSS в тестах для скорости
  },
})

