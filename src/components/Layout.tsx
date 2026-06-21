import { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface LayoutProps {
  children: ReactNode
  headerExtra?: ReactNode
}

export default function Layout({ children, headerExtra }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  const navItems = [
    { path: '/', label: '目标', icon: '📋' },
    { path: '/calendar', label: '日历', icon: '📅' },
    { path: '/stats', label: '统计', icon: '📊' },
  ]

  // Desktop sidebar keeps all items including Trash and Profile
  const sidebarItems = [
    ...navItems,
    { path: '/trash', label: '回收站', icon: '🗑️' },
    { path: '/profile', label: '我的', icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              CCWS 目标管理
            </h1>
            <div className="flex items-center gap-3">
              {headerExtra}
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 md:ml-64">
        {children}
      </main>

      {/* 底部导航 - 仅移动端显示 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 ${
                location.pathname === item.path
                  ? 'text-blue-500'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 侧边栏 - 仅桌面端显示 */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

    </div>
  )
}
