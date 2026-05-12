import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import Deck from './Deck'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  }
})

describe('Deck Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ title: 'Test Deck' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([
        { id: 1, term: 'Apple', definition: 'Яблоко' },
        { id: 2, term: 'Cat', definition: 'Кот' }
      ])})
  })

  test('renders words list', async () => {
    render(<MemoryRouter><Deck /></MemoryRouter>)
    expect(await screen.findByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Cat')).toBeInTheDocument()
  })

  test('can add a new word', async () => {
    render(<MemoryRouter><Deck /></MemoryRouter>)

    // Нажимаем "Добавить слово"
    const addBtn = await screen.findByRole('button', { name: /добавить слово/i })
    fireEvent.click(addBtn)

    // Ждём появления заголовка модалки
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /добавить слово|редактировать слово/i, level: 2 }))
        .toBeInTheDocument()
    })

    const inputs = screen.getAllByRole('textbox')
    const termInput = inputs[0] // первый — термин
    const defInput = inputs[1]  // второй — определение

    fireEvent.change(termInput, { target: { value: 'New Word' } })
    fireEvent.change(defInput, { target: { value: 'Новое Слово' } })

    const modal = screen.getByRole('heading', { name: /добавить слово|редактировать слово/i, level: 2 }).closest('.deck-modal')
    const submitBtn = within(modal).getByRole('button', { name: /добавить|создать|обновить/i })

    // Саблимит
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 3 }) })
    fireEvent.click(submitBtn)

    // Проверяем, что fetch был вызван
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/words',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})