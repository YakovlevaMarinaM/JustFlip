import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import Dashboard from './Dashboard'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockFetch = (responses) => {
  const mockFn = vi.fn()
  responses.forEach(res => mockFn.mockResolvedValueOnce(res))
  return mockFn
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch([
      { ok: true, json: () => Promise.resolve([]) },
      { ok: true, json: () => Promise.resolve({ current_streak: 0, mastered: 0, due_now: 0 }) }
    ])
  })

  test('renders empty state when no decks', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    const button = await waitFor(() => screen.getByText(/создать первую колоду/i))
    expect(button).toBeInTheDocument()
  })

  test('opens modal when clicking create button', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)

    const button = await waitFor(() => screen.getByText(/создать первую колоду/i))
    fireEvent.click(button)

    const modalHeading = await waitFor(() =>
      screen.getByRole('heading', { name: 'Новая колода', level: 2 })
    )
    expect(modalHeading).toBeInTheDocument()

    // Проверяем, что форма внутри модалки видима
    expect(screen.getByLabelText('Название колоды')).toBeInTheDocument()
    expect(screen.getByLabelText('Описание')).toBeInTheDocument()
  })
})