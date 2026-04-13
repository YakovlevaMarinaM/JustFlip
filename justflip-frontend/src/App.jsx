import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'

function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h2>Добро пожаловать в JustFlip! 🎉</h2>
      <p>Бэкенд работает! API подключён.</p>
      <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Выйти
      </button>

      <h3 style={{ marginTop: '30px' }}>Доступные эндпоинты:</h3>
      <ul style={{ textAlign: 'left', display: 'inline-block' }}>
        <li>GET /api/users/me - данные пользователя</li>
        <li>GET /api/decks - ваши колоды</li>
        <li>POST /api/decks - создать колоду</li>
        <li>GET /api/study/next - следующее слово</li>
      </ul>

      <p style={{ marginTop: '20px' }}>
        <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer">
          Открыть Swagger документацию →
        </a>
      </p>
    </div>
  )
}

// Защищённый маршрут
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Перенаправление с главной на логин */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App