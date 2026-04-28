import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Study.css'

function Study() {
  const [word, setWord] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 })
  const [completed, setCompleted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNextWord()
  }, [])

  const fetchNextWord = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/study/next', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWord(data)
        setFlipped(false)
      } else {
        setCompleted(true)
      }
    } catch (err) {
      console.error('Error:', err)
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

  if (completed) {
    return (
      <div className="study-page">
        <div className="bg-cards">
          <div className="bg-card">apple</div>
          <div className="bg-card">learn</div>
        </div>
        <div className="glow"></div>

        <div className="study-complete">
          <h1>🎉 Сессия завершена!</h1>
          <p>Отличная работа — продолжай в том же духе</p>

          <div className="session-stats">
            <div className="stat">
              <span className="value">{sessionStats.easy}</span>
              <span className="label">Легко</span>
            </div>
            <div className="stat">
              <span className="value">{sessionStats.medium}</span>
              <span className="label">Средне</span>
            </div>
            <div className="stat">
              <span className="value">{sessionStats.hard}</span>
              <span className="label">Сложно</span>
            </div>
          </div>

          <div className="actions">
            <button className="btn-repeat" onClick={() => { setCompleted(false); fetchNextWord() }}>
              Повторить ещё раз
            </button>
            <button className="btn-home" onClick={() => navigate('/dashboard')}>
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="study-page">
      <div className="bg-cards">
        <div className="bg-card">apple</div>
        <div className="bg-card">учиться</div>
      </div>
      <div className="glow"></div>

      <div className="study-container">
        <header className="study-header">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← На главную
          </button>
          <span>Учу… Слово 1 из 10</span>
        </header>

        <div className="flashcard" onClick={() => setFlipped(!flipped)}>
          <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
            <div className="card-front">
              <h2>{word?.term}</h2>
              <p className="hint">Нажми, чтобы перевернуть</p>
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
              😰 Сложно
            </button>
            <button className="btn-medium" onClick={() => submitResult('medium')}>
              🤔 Средне
            </button>
            <button className="btn-easy" onClick={() => submitResult('easy')}>
              😊 Легко
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Study