import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AuthForm from './components/Auth/AuthForm'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import TrashPage from './pages/TrashPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast/Toast'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNewGoal, setShowNewGoal] = useState(false)

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      // Apply saved theme on startup
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: settings } = await supabase.from('settings').select('theme').eq('user_id', user.id).single()
        if (settings?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      setLoading(false)
    })

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
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
      <ToastProvider>
        <AppContent showNewGoal={showNewGoal} setShowNewGoal={setShowNewGoal} />
      </ToastProvider>
    </Router>
  )
}

function AppContent({ showNewGoal, setShowNewGoal }: { showNewGoal: boolean; setShowNewGoal: (v: boolean) => void }) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <Layout headerExtra={
      isHomePage ? (
        <button
          onClick={() => setShowNewGoal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-2xl hover:bg-green-600 active:scale-[0.98] transition-all duration-200 text-sm"
        >
          + 新建
        </button>
      ) : undefined
    }>
      <Routes>
        <Route path="/" element={<HomePage showNewGoal={showNewGoal} setShowNewGoal={setShowNewGoal} />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
