import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Deck from './pages/Deck'
import Study from './pages/Study'

// Защита роутов — если нет токена, перекидывает на login
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Публичные страницы */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Защищённые страницы — требуют токена */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deck/:id"
          element={
            <ProtectedRoute>
              <Deck />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study"
          element={
            <ProtectedRoute>
              <Study />
            </ProtectedRoute>
          }
        />

        {/* Перенаправление с корня на login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 404 — несуществующая страница */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App