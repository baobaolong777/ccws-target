import { useState, createContext, useContext, ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✕'
      default: return 'ℹ'
    }
  }

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500'
      case 'error': return 'border-l-red-500'
      default: return 'border-l-blue-500'
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      case 'error': return 'bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-200'
      default: return 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border-l-4 ${getAccentColor(toast.type)} ${getBgColor(toast.type)} text-sm animate-fade-in backdrop-blur-sm`}
          >
            <div className={`w-6 h-6 rounded-full ${getIconBg(toast.type)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">{getIcon(toast.type)}</span>
            </div>
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
