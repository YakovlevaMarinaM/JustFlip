import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './Deck.css'

function Deck() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWord, setEditingWord] = useState(null)
  const [newWord, setNewWord] = useState({ term: '', definition: '', example: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDeckData()
  }, [id])

  const fetchDeckData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [deckRes, wordsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/decks/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:8000/api/decks/${id}/words`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (deckRes.ok) setDeck(await deckRes.json())
      if (wordsRes.ok) setWords(await wordsRes.json())
    } catch (err) {
      console.error('Ошибка загрузки:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingWord(null)
    setNewWord({ term: '', definition: '', example: '' })
    setShowModal(true)
  }

  const openEdit = (word) => {
    setEditingWord(word)
    setNewWord({ term: word.term, definition: word.definition, example: word.example || '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingWord(null)
  }

  const saveWord = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = editingWord
        ? `http://localhost:8000/api/words/${editingWord.id}`
        : 'http://localhost:8000/api/words'
      const method = editingWord ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newWord, deck_id: parseInt(id) })
      })

      if (res.ok) {
        const data = await res.json()
        if (editingWord) {
          setWords(prev => prev.map(w => w.id === editingWord.id ? data : w))
        } else {
          setWords(prev => [data, ...prev])
        }
        closeModal()
        setNewWord({ term: '', definition: '', example: '' })
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteWord = async (wordId) => {
    if (!window.confirm('Удалить это слово?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/words/${wordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setWords(prev => prev.filter(w => w.id !== wordId))
    } catch (err) {
      console.error('Ошибка удаления:', err)
    }
  }

  if (loading) return <div className="loading-page">загрузка...</div>

  return (
    <div className="deck-page">
      <div className="deck-container">
        <header className="deck-header">
          <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>← Назад</button>
          <h1>{deck?.title || 'Загрузка...'}</h1>
          <button type="button" className="btn-add-word" onClick={openAdd}>+ Добавить слово</button>
        </header>

        <div className="deck-stats">
          <span>{words.length} слов(а)</span>
        </div>

        {words.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет слов</p>
            <button type="button" className="btn-add-first" onClick={openAdd}>Добавить первое слово</button>
          </div>
        ) : (
          <div className="words-list">
            {words.map(word => (
              <div key={word.id} className="word-card">
                <h3>{word.term}</h3>
                <p>{word.definition}</p>
                {word.example && <p className="example">{word.example}</p>}
                <div className="word-actions">
                  <button type="button" className="btn-edit" onClick={() => openEdit(word)}>✏️</button>
                  <button type="button" className="btn-delete" onClick={() => deleteWord(word.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="deck-modal-overlay" onClick={closeModal}>
            <div className="deck-modal" onClick={e => e.stopPropagation()}>
              <h2>{editingWord ? 'Редактировать слово' : 'Добавить слово'}</h2>
              <form onSubmit={saveWord}>
                <div className="form-group">
                  <label>Слово / термин</label>
                  <input type="text" value={newWord.term} onChange={e => setNewWord({...newWord, term: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Перевод / определение</label>
                  <input type="text" value={newWord.definition} onChange={e => setNewWord({...newWord, definition: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Пример (необязательно)</label>
                  <textarea value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Отмена</button>
                  <button type="submit" className="btn-create" disabled={saving}>
                    {saving ? 'Сохранение...' : editingWord ? 'Обновить' : 'Добавить'}
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