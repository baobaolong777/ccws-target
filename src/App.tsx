import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './lib/firebase'
import AuthForm from './components/Auth/AuthForm'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import TrashPage from './pages/TrashPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
