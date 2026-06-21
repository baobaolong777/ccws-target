import { useState, useEffect } from 'react'
import { Goal, goalService } from '../../lib/db'

interface DailyGoalsProps {
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
}

export default function DailyGoals({ onComplete, onUndoComplete }: DailyGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    try {
      const allGoals = await goalService.getAll()
      // 显示所有每日目标（不按日期过滤）
      const dailyGoals = allGoals.filter(g => g.is_daily)
      setGoals(dailyGoals)
    } catch (error) {
      console.error('加载每日目标失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    try {
      await goalService.create({
        title: newTitle.trim(),
        description: '',
        status: 'pending',
        priority: 'medium',
        is_key_goal: false,
        is_daily: true,
        tags: [],
        folder_id: null,
        parent_id: null,
        start_date: null,
        order_index: goals.length,
        time_spent: 0,
        reminder_at: null,
        is_deleted: false,
        deleted_at: null,
        repeat_rule: null,
        target_date: null,
        completed_at: null
      })
      setNewTitle('')
      loadGoals()
    } catch (error) {
      console.error('添加失败:', error)
    }
  }

  const handleComplete = async (goalId: string) => {
    // 标记为今日完成
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, status: 'completed', completed_at: new Date().toISOString() } : g
    ))
    onComplete(goalId)
  }

  const handleUndo = async (goalId: string) => {
    // 取消今日完成
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, status: 'pending', completed_at: null } : g
    ))
    onUndoComplete(goalId)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('确定要删除这个每日目标吗？')) return
    try {
      await goalService.softDelete(goalId)
      loadGoals()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const completedCount = goals.filter(g => g.status === 'completed').length

  if (loading) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
          🔄 每日目标
        </h3>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="添加..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            +
          </button>
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {completedCount}/{goals.length}
        </span>
      </div>

      {/* Goal list */}
      {goals.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-sm">
          还没有每日目标，添加一个吧！
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map(goal => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                goal.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <button
                onClick={() => {
                  if (goal.status === 'completed') handleUndo(goal.id!)
                  else handleComplete(goal.id!)
                }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  goal.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {goal.status === 'completed' && (
                  <span className="text-white text-xs">✓</span>
                )}
              </button>
              <span className={`flex-1 ${
                goal.status === 'completed'
                  ? 'line-through text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {goal.title}
              </span>
              <button
                onClick={() => handleDelete(goal.id!)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
