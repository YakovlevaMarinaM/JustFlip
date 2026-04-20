import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './Deck.css'

function Deck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddWord, setShowAddWord] = useState(false)
  const [newWord, setNewWord] = useState({ term: '', definition: '', example: '' })

  useEffect(() => {
    fetchDeckData()
  }, [id])

  const fetchDeckData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/decks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDeck(data)
      }

      const wordsResponse = await fetch(`http://localhost:8000/api/decks/${id}/words`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (wordsResponse.ok) {
        const wordsData = await wordsResponse.json()
        setWords(wordsData)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addWord = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/words', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newWord,
          deck_id: parseInt(id)
        })
      })
      if (response.ok) {
        setShowAddWord(false)
        setNewWord({ term: '', definition: '', example: '' })
        fetchDeckData()
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  if (loading) return <div className="loading-page">Загрузка...</div>

  return (
    <div className="deck-page">
      <div className="bg-cards">
        <div className="bg-card">apple</div>
        <div className="bg-card">учиться</div>
        <div className="bg-card">column</div>
      </div>
      <div className="glow"></div>

      <div className="deck-container">
        <header className="deck-header">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Назад
          </button>
          <h1>{deck?.title || 'Загрузка...'}</h1>
          <button className="btn-add-word" onClick={() => setShowAddWord(true)}>
            + Добавить слово
          </button>
        </header>

        <div className="deck-stats">
          <span>{words.length} слов</span>
          <span>0 на повтор</span>
          <span>0 выучено</span>
        </div>

        {words.length === 0 ? (
          <div className="empty-state">
            <p>📭 Пока нет слов</p>
            <button className="btn-add-first" onClick={() => setShowAddWord(true)}>
              Добавить первое слово
            </button>
          </div>
        ) : (
          <div className="words-list">
            {words.map((word) => (
              <div key={word.id} className="word-card">
                <h3>{word.term}</h3>
                <p>{word.definition}</p>
                {word.example && <p className="example">{word.example}</p>}
              </div>
            ))}
          </div>
        )}

        {showAddWord && (
          <div className="modal-overlay" onClick={() => setShowAddWord(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Добавить слово</h2>
              <form onSubmit={addWord}>
                <div className="form-group">
                  <label>Слово / термин</label>
                  <input
                    type="text"
                    value={newWord.term}
                    onChange={(e) => setNewWord({...newWord, term: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Перевод / определение</label>
                  <input
                    type="text"
                    value={newWord.definition}
                    onChange={(e) => setNewWord({...newWord, definition: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Пример (необязательно)</label>
                  <textarea
                    value={newWord.example}
                    onChange={(e) => setNewWord({...newWord, example: e.target.value})}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddWord(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn-create">
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Deck