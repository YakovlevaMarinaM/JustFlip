import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom' // ← Добавили useSearchParams
import './Study.css'

function Study() {
  const [word, setWord] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 })
  const [completed, setCompleted] = useState(false)

  // Инициализируем forceMode сразу из URL параметров, если они есть
  const [searchParams] = useSearchParams()
  const urlForce = searchParams.get('force') === 'true'

  const [forceMode, setForceMode] = useState(urlForce)

  const navigate = useNavigate()

  useEffect(() => {
    fetchNextWord()
  }, [])

  const fetchNextWord = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = `http://localhost:8000/api/study/next?force=${forceMode}`
      console.log(' Запрос:', url)

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setWord(data)
        setFlipped(false)
        setCompleted(false)
      } else {
        console.log('Слов нет, завершаем сессию')
        setCompleted(true)
      }
    } catch (err) {
      console.error('Ошибка сети:', err)
      setCompleted(true)
    }
  }

  const submitResult = async (difficulty) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:8000/api/study/result?word_id=${word.id}&difficulty=${difficulty}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSessionStats(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }))
      fetchNextWord()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // === ЭКРАН ЗАВЕРШЕНИЯ СЕССИИ ===
  if (completed) {
    return (
      <div className="study-page">
        <div className="study-complete">
          <h1>Сессия завершена!🎉</h1>
          <p>Отличная работа — продолжай в том же духе</p>

          <div className="session-stats">
            <div className="stat">
              <span className="value">{sessionStats.easy}</span>
              <span className="label">легкотня</span>
            </div>
            <div className="stat">
              <span className="value">{sessionStats.medium}</span>
              <span className="label">ну нормик</span>
            </div>
            <div className="stat">
              <span className="value">{sessionStats.hard}</span>
              <span className="label">тяжко...</span>
            </div>
          </div>

          <div className="repeat-mode-toggle">
            <button
              className="mode-toggle-btn"
              onClick={() => setForceMode(!forceMode)}
            >
              {forceMode ? ' Режим: Все слова' : ' Режим: По расписанию'}
            </button>
          </div>

          <div className="actions">
            <button
              className="btn-repeat"
              disabled={!forceMode}
              onClick={async () => {
                setSessionStats({ easy: 0, medium: 0, hard: 0 })
                setCompleted(false)
                setTimeout(() => {
                  fetchNextWord()
                }, 100)
              }}
              style={{
                opacity: !forceMode ? 0.5 : 1,
                cursor: !forceMode ? 'not-allowed' : 'pointer'
              }}
            >
              {forceMode ? 'Повторить ещё раз' : 'Слова закончились'}
            </button>

            <button className="btn-home" onClick={() => navigate('/dashboard')}>
              на главную
            </button>
          </div>

          {!forceMode && (
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '10px' }}>
              включи режим "Все слова", чтобы повторить ещё раз прямо сейчас
            </p>
          )}
        </div>
      </div>
    )
  }

  // === ОСНОВНОЙ ЭКРАН ОБУЧЕНИЯ ===
  return (
    <div className="study-page">
      <div className="study-container">
        <header className="study-header">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← на главную
          </button>

          <button
            className="btn-finish-session"
            onClick={() => setCompleted(true)}
          >
             завершить
          </button>

          <span>учу…</span>
        </header>

        <div className="flashcard" onClick={() => setFlipped(!flipped)}>
          <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
            <div className="card-front">
              <h2>{word?.term}</h2>
              <p className="hint">нажми, чтобы перевернуть</p>
            </div>
            <div className="card-back">
              <h2>{word?.definition}</h2>
              {word?.example && <p className="example">{word.example}</p>}
            </div>
          </div>
        </div>

        {flipped && (
          <div className="rating-buttons">
            <button className="btn-hard" onClick={() => submitResult('hard')}>
              тяжко...
            </button>
            <button className="btn-medium" onClick={() => submitResult('medium')}>
              ну нормик)
            </button>
            <button className="btn-easy" onClick={() => submitResult('easy')}>
              легкотня
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Study