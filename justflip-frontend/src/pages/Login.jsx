import { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Обычный вход
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authAPI.login(username, password)
      localStorage.setItem('token', response.data.access_token)
      alert('Вход успешен!')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Неверный логин или пароль')
    } finally {
      setIsLoading(false)
    }
  }

  // Вход через Google
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError('')
      try {
        console.log('Google token response:', tokenResponse)

        const res = await fetch('http://localhost:8000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
            token_type: 'access_token'
          })
        })

        if (res.ok) {
          const data = await res.json()
          localStorage.setItem('token', data.access_token)
          alert('Вход через Google успешен!')
          navigate('/dashboard')
        } else {
          const errData = await res.json()
          setError(errData.detail || 'Ошибка входа через Google')
        }
      } catch (err) {
        console.error(err)
        setError('Ошибка сети при входе через Google')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      setError('Ошибка входа через Google')
      setIsLoading(false)
    },
    flow: 'implicit',
    scope: 'openid email profile'
  })

  return (
    <div className="login-page">
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

      <div className="card-wrap">
        <div className="card">
          {/* Логотип */}
          <div className="logo">
            <div className="logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="12" rx="2.5" stroke="#D4A5A0" strokeWidth="1.8"/>
                <path d="M8 12h8M12 8v8" stroke="#F2E4B0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">JustFlip</span>
          </div>

          {/* Заголовки */}
          <h1 className="heading">Вход</h1>
          <p className="subheading">Добро пожаловать обратно! ✦</p>

          {/* Форма */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
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
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Ошибка */}
            {error && <div className="global-error visible">{error}</div>}

            {/* Кнопка входа */}
            <button
              type="submit"
              className={`btn-submit ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              <span className="btn-text">Войти</span>
              <div className="spinner"></div>
            </button>
          </form>

          {/* Разделитель */}
          <div className="divider"><span>или</span></div>

          {/* Google кнопка */}
          <button
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="btn-google"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </button>

          {/* Футер */}
          <p className="card-footer">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login