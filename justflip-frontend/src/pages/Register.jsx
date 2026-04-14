import './Register.css'
import { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import './Register.css'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await authAPI.register(username, email, password)
      alert('Регистрация успешна! Теперь войдите.')
      navigate('/login')
    } catch (err) {
      setError('Ошибка регистрации. Возможно, пользователь уже существует.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential })
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        alert('Регистрация через Google успешна!')
        navigate('/dashboard')
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Ошибка входа через Google')
      }
    } catch (err) {
      console.error(err)
      setError('Ошибка сети при подключении к Google')
    }
  }

  return (
    <div className="register-page">
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

      <div className="card-wrap">
        <div className="card">
          <div className="logo">
            <div className="logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="12" rx="2.5" stroke="#D4A5A0" strokeWidth="1.8"/>
                <path d="M8 12h8M12 8v8" stroke="#F2E4B0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">JustFlip</span>
          </div>

          <h1 className="heading">Создать аккаунт</h1>
          <p className="subheading">Начни учить слова прямо сейчас — это бесплатно</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username123"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="m3 7 9 6 9-6"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Подтвердите пароль</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
                </svg>
                <input
                  type="password"
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="divider"><span>или</span></div>

          <div className="google-btn-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Ошибка входа через Google')}
              text="signup_with"
              size="large"
              width="100%"
            />
          </div>

          <p className="card-footer">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register