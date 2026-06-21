import { useState, useEffect } from 'react'
import { Goal, goalService } from '../../lib/db'
import ConfirmModal from '../ConfirmModal/ConfirmModal'

interface DailyGoalsProps {
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
}

export default function DailyGoals({ onComplete, onUndoComplete }: DailyGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    try {
      const allGoals = await goalService.getAll()
      const dailyGoals = allGoals.filter(g => g.is_daily)
      // Reset status if completed yesterday or earlier
      const today = new Date().toISOString().split('T')[0]
      const goalsWithReset = dailyGoals.map(g => {
        if (g.status === 'completed' && g.completed_at) {
          const completedDate = g.completed_at.split('T')[0]
          if (completedDate !== today) {
            return { ...g, status: 'pending' as const, completed_at: null }
          }
        }
        return g
      })
      setGoals(goalsWithReset)
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

  const handleDelete = (goalId: string) => {
    setDeleteGoalId(goalId)
  }

  const confirmDelete = async () => {
    if (!deleteGoalId) return
    setDeleteGoalId(null)
    try {
      await goalService.softDelete(deleteGoalId)
      loadGoals()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const completedCount = goals.filter(g => g.status === 'completed').length

  if (loading) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
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
            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 text-sm animate-pulse-once"
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
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">🌟</div>
          <p className="font-medium text-gray-700 dark:text-gray-300">今天还没有目标</p>
          <p className="text-sm mt-1">开始新的一天吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map(goal => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-colors group ${
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
                className={`w-5 h-5 rounded border-2 flex items-center justify-center animate-pulse-once ${
                  goal.status === 'completed'
                    ? 'bg-green-500 border-green-500 animate-check'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {goal.status === 'completed' && (
                  <span className="text-white text-xs animate-check">✓</span>
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
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm transition-opacity animate-pulse-once"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 确认删除弹窗 */}
      {deleteGoalId && (
        <ConfirmModal
          title="删除每日目标"
          message="确定要删除这个每日目标吗？"
          confirmText="删除"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteGoalId(null)}
          danger
        />
      )}
    </div>
  )
}
