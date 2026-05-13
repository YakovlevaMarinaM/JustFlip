import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const [decks, setDecks] = useState([])
  const [stats, setStats] = useState({
    currentStreak: 0,
    mastered: 0,
    dueToday: 0,
    totalDecks: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [forceMode, setForceMode] = useState(() => {
    return localStorage.getItem('study_force_mode') === 'true'
  })
  const [editingDeck, setEditingDeck] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    localStorage.setItem('study_force_mode', forceMode)
  }, [forceMode])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) { navigate('/login'); return }

      const decksResponse = await fetch('http://localhost:8000/api/decks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!decksResponse.ok) {
        if (decksResponse.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
        }
        return
      }

      const decksData = await decksResponse.json()
      setDecks(decksData)

      const statsResponse = await fetch('http://localhost:8000/api/study/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          currentStreak: statsData.current_streak || 0,
          mastered: statsData.mastered || 0,
          dueToday: statsData.due_now || 0,
          totalDecks: decksData.length
        })
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const createDeck = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:8000/api/decks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newDeckTitle, description: newDeckDescription })
    })
    if (!response.ok) return
    setShowModal(false)
    setNewDeckTitle('')
    setNewDeckDescription('')
    fetchDashboardData()
  }

  const openEditDeck = (deck) => {
    setEditingDeck(deck)
    setEditTitle(deck.title)
    setEditDescription(deck.description || '')
    setShowEditModal(true)
  }

  const saveEditDeck = async (e) => {
    e.preventDefault()
    if (!editingDeck) return

    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/decks/${editingDeck.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: editTitle, description: editDescription })
    })

    if (response.ok) {
      setDecks(prev => prev.map(d =>
        d.id === editingDeck.id ? { ...d, title: editTitle, description: editDescription } : d
      ))
      setShowEditModal(false)
      setEditingDeck(null)
    }
  }

  const deleteDeck = async (deckId) => {
    if (!window.confirm('Удалить эту колоду? Это действие нельзя отменить.')) return

    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/decks/${deckId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.ok) {
      setDecks(prev => prev.filter(d => d.id !== deckId))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleStartStudy = () => {
    const url = forceMode ? '/study?force=true' : '/study'
    navigate(url)
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="logo">
            <div className="logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="12" rx="2.5" stroke="#D4A5A0" strokeWidth="1.8"/>
                <path d="M8 12h8M12 8v8" stroke="#F2E4B0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">JustFlip</span>
          </div>
          <div className="header-actions">
            <button className="btn-new-deck" onClick={() => setShowModal(true)}>+ Новая колода</button>
            <button className="btn-logout" onClick={handleLogout}>Выйти</button>
          </div>
        </header>

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Серия</span>
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-unit">дней подряд</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Выучено</span>
            <span className="stat-value">{stats.mastered}</span>
            <span className="stat-unit">слов всего</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">На повтор</span>
            <span className="stat-value">{stats.dueToday}</span>
            <span className="stat-unit">сегодня</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Колод</span>
            <span className="stat-value">{stats.totalDecks}</span>
            <span className="stat-unit">создано</span>
          </div>
        </div>

        {stats.dueToday > 0 && (
          <div className="study-reminder">
            <h2>Время повторить слова!</h2>
            <p>У тебя есть слова для повторения сегодня</p>
            <button className="btn-study" onClick={handleStartStudy}>Начать</button>
          </div>
        )}

        <div className="mode-selection-block" style={{
          marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px'
        }}>
          <div style={{ color: 'var(--text)', fontSize: '14px', fontWeight: '500' }}>Режим обучения:</div>
          <button
            onClick={() => setForceMode(!forceMode)}
            style={{
              background: forceMode ? 'linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)' : 'transparent',
              color: forceMode ? 'white' : 'var(--text)',
              border: forceMode ? 'none' : '1px solid var(--pink)',
              padding: '10px 20px', borderRadius: '20px', cursor: 'pointer',
              fontWeight: '600', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif'
            }}
          >
            {forceMode ? ' Все слова' : ' По расписанию'}
          </button>
          <button
            onClick={handleStartStudy}
            style={{
              background: 'linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)',
              color: 'white', border: 'none', padding: '10px 24px', borderRadius: '20px',
              cursor: 'pointer', fontWeight: '700',
              boxShadow: '0 4px 15px rgba(212, 165, 160, 0.4)',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            Начать обучение
          </button>
        </div>

        <section className="decks-section">
          <div className="section-header">
            <h2>Мои колоды</h2>
            <div className="section-actions">
              <button className="btn-secondary" onClick={() => setShowModal(true)}>Создать колоду</button>
            </div>
          </div>

          {loading ? (
            <p className="loading">Загрузка…</p>
          ) : decks.length === 0 ? (
            <div className="empty-state">
              <p>📭 Пока нет колод</p>
              <button className="btn-create-first" onClick={() => setShowModal(true)}>Создать первую колоду</button>
            </div>
          ) : (
            <div className="decks-grid">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="deck-card"
                  onClick={() => navigate(`/deck/${deck.id}`)}
                >
                  {/* ← НОВОЕ: Кнопки действий (не мешают клику по карточке) */}
                  <div className="deck-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-edit-deck" onClick={() => openEditDeck(deck)}>✏️</button>
                    <button className="btn-delete-deck" onClick={() => deleteDeck(deck.id)}>🗑️</button>
                  </div>

                  <h3>{deck.title}</h3>
                  <p>{deck.description || 'Нет описания'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Новая колода</h2>
              <form onSubmit={createDeck}>
                <div className="form-group">
                  <label htmlFor="title">Название колоды</label>
                  <input
                    type="text" id="title" value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="Например: Английские слова" required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Описание</label>
                  <textarea
                    id="description" value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    placeholder="Опиши колоду"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Отмена</button>
                  <button type="submit" className="btn-create">Создать</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editingDeck && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Редактировать колоду</h2>
              <form onSubmit={saveEditDeck}>
                <div className="form-group">
                  <label>Название колоды</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Отмена</button>
                  <button type="submit" className="btn-create">Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default Dashboard