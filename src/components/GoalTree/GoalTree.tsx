import { useState, useEffect } from 'react'
import { Goal, goalService } from '../../lib/db'
import GoalTreeNode from './GoalTreeNode'

interface GoalTreeProps {
  goals: Goal[]
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
  onSelect: (goal: Goal) => void
  onRefresh: () => void
}

export default function GoalTree({ goals, onComplete, onUndoComplete, onSelect, onRefresh }: GoalTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [reordering, setReordering] = useState(false)

  // 全部目标显示：未完成的 + 今天完成的（保留一天）
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const activeGoals = goals.filter(goal => {
    if (goal.status !== 'completed') return true
    // 已完成的，只显示今天完成的
    if (goal.completed_at) {
      const completedDate = new Date(goal.completed_at).toISOString().split('T')[0]
      return completedDate === todayStr
    }
    return true
  })

  // 获取根目标（没有父目标的）
  const rootGoals = activeGoals.filter(goal => !goal.parent_id)

  // 切换展开/折叠
  const toggleExpand = (goalId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) {
        newSet.delete(goalId)
      } else {
        newSet.add(goalId)
      }
      return newSet
    })
  }

  // 获取子目标
  const getChildren = (parentId: string) => {
    return activeGoals.filter(goal => goal.parent_id === parentId)
  }

  // 移动目标顺序
  const handleMoveGoal = async (goalId: string, direction: 'up' | 'down') => {
    setReordering(true)
    try {
      await goalService.moveGoal(goalId, direction)
      await onRefresh()
    } catch (error) {
      console.error('移动目标失败:', error)
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📋 全部目标
      </h3>

      {rootGoals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>还没有目标</p>
          <p className="text-sm">点击"新建"创建第一个目标</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rootGoals.map((goal, index) => (
            <div key={goal.id} className="flex items-start gap-2">
              {/* 移动按钮 */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveGoal(goal.id!, 'up')}
                  disabled={index === 0 || reordering}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="上移"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveGoal(goal.id!, 'down')}
                  disabled={index === rootGoals.length - 1 || reordering}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="下移"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1">
                <GoalTreeNode
                  goal={goal}
                  goals={activeGoals}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onComplete={onComplete}
                  onUndoComplete={onUndoComplete}
                  onSelect={onSelect}
                  onRefresh={onRefresh}
                  getChildren={getChildren}
                  level={0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
