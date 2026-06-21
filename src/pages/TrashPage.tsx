import { useState, useEffect } from 'react'
import { goalService, Goal } from '../lib/db'
import { format } from 'date-fns'

export default function TrashPage() {
  const [deletedGoals, setDeletedGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeletedGoals()
  }, [])

  const loadDeletedGoals = async () => {
    try {
      const goals = await goalService.getDeleted()
      setDeletedGoals(goals)
    } catch (error) {
      console.error('加载回收站失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 恢复目标
  const handleRestore = async (goalId: string) => {
    try {
      await goalService.restore(goalId)
      await loadDeletedGoals()
    } catch (error) {
      console.error('恢复目标失败:', error)
    }
  }

  // 永久删除
  const handlePermanentDelete = async (goalId: string) => {
    if (!confirm('确定要永久删除这个目标吗？此操作不可恢复。')) {
      return
    }
    try {
      await goalService.hardDelete(goalId)
      await loadDeletedGoals()
    } catch (error) {
      console.error('删除目标失败:', error)
    }
  }

  // 清空回收站
  const handleEmptyTrash = async () => {
    if (!confirm('确定要清空回收站吗？所有目标将被永久删除。')) {
      return
    }
    try {
      // Sequential deletion to avoid conflicts with recursive hardDelete
      for (const goal of deletedGoals) {
        // Only delete top-level goals; hardDelete will handle children recursively
        if (!goal.parent_id) {
          await goalService.hardDelete(goal.id!)
        }
      }
      // Delete any remaining child goals that weren't covered by parent recursion
      const remainingGoals = await goalService.getDeleted()
      for (const goal of remainingGoals) {
        await goalService.hardDelete(goal.id!)
      }
      await loadDeletedGoals()
    } catch (error) {
      console.error('清空回收站失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🗑️ 回收站
        </h2>
        {deletedGoals.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 active:scale-[0.98] transition-all duration-200"
          >
            清空回收站
          </button>
        )}
      </div>

      {deletedGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🗑️</span>
          </div>
          <p className="font-medium text-gray-700 dark:text-gray-300">回收站是空的</p>
          <p className="text-sm text-gray-500 mt-1">删除的目标会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    删除于 {goal.deleted_at ? format(new Date(goal.deleted_at), 'yyyy-MM-dd HH:mm') : '未知'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(goal.id!)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 text-sm"
                  >
                    恢复
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(goal.id!)}
                    className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 active:scale-[0.98] transition-all duration-200 text-sm"
                  >
                    永久删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          💡 提示：回收站中的目标会在30天后自动永久删除。
        </p>
      </div>
    </div>
  )
}
