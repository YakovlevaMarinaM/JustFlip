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
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')

      const decksResponse = await fetch('http://localhost:8000/api/decks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (decksResponse.ok) {
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
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDeck = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/decks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newDeckTitle,
          description: newDeckDescription
        })
      })
      if (response.ok) {
        setShowModal(false)
        setNewDeckTitle('')
        setNewDeckDescription('')
        fetchDashboardData()
      }
    } catch (err) {
      console.error('Error creating deck:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="dashboard-page">
      {/* Фоновые карточки */}
      <div className="bg-cards">
        <div className="bg-card">apple</div>
        <div className="bg-card">учиться</div>
        <div className="bg-card">column</div>
        <div className="bg-card">flip</div>
        <div className="bg-card">palabra</div>
        <div className="bg-card">память</div>
        <div className="bg-card">learn</div>
      </div>

      <div className="glow"></div>

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
            <button className="btn-new-deck" onClick={() => setShowModal(true)}>
              + Новая колода
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </header>

        {/* Stats */}
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

        {/* Study Reminder */}
        {stats.dueToday > 0 && (
          <div className="study-reminder">
            <h2>Время повторить слова!</h2>
            <p>У тебя есть слова для повторения сегодня</p>
            <button className="btn-study" onClick={() => navigate('/study')}>
              Начать
            </button>
          </div>
        )}

        {/* Decks Section */}
        <section className="decks-section">
          <div className="section-header">
            <h2>Мои колоды</h2>
            <div className="section-actions">
              <button className="btn-secondary">Все колоды</button>
              <button className="btn-secondary" onClick={() => setShowModal(true)}>
                Создать колоду
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading">Загрузка…</p>
          ) : decks.length === 0 ? (
            <div className="empty-state">
              <p>📭 Пока нет колод</p>
              <button className="btn-create-first" onClick={() => setShowModal(true)}>
                Создать первую колоду
              </button>
            </div>
          ) : (
            <div className="decks-grid">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="deck-card"
                  onClick={() => navigate(`/deck/${deck.id}`)}
                >
                  <h3>{deck.title}</h3>
                  <p>{deck.description || 'Нет описания'}</p>
                  <div className="deck-stats">
                    <span>0 слов</span>
                    <span>0 на повтор</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Новая колода</h2>
              <form onSubmit={createDeck}>
                <div className="form-group">
                  <label htmlFor="title">Название колоды</label>
                  <input
                    type="text"
                    id="title"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="Например: Английские слова"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Описание</label>
                  <textarea
                    id="description"
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    placeholder="Опиши колоду"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn-create">
                    Создать
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

export default Dashboard