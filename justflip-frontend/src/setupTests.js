import '@testing-library/jest-dom' // Добавляет matchers типа toBeInTheDocument()

// Мокаем fetch, так как компоненты используют его напрямую
global.fetch = vi.fn()

// Мокаем window.confirm (чтобы тесты не зависали на алертах)
window.confirm = vi.fn(() => true)