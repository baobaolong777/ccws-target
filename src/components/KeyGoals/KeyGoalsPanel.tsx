import { useState } from 'react'
import { Goal } from '../../lib/db'
import GoalTreeNode from '../GoalTree/GoalTreeNode'

interface KeyGoalsPanelProps {
  goals: Goal[]
  maxCount: number
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
  onSelect: (goal: Goal) => void
  onRefresh: () => void
}

export default function KeyGoalsPanel({ goals, maxCount, onComplete, onUndoComplete, onSelect, onRefresh }: KeyGoalsPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Filter goals by start_date and is_key_goal
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const visibleGoals = goals.filter(goal => {
    if (!goal.is_key_goal) return false
    if (goal.start_date && goal.start_date.split('T')[0] > todayStr) return false
    return true
  }).slice(0, maxCount)

  // Get root key goals (no parent)
  const rootGoals = visibleGoals.filter(g => !g.parent_id)

  // Get children for a goal (only key goals)
  const getChildren = (parentId: string) => {
    return visibleGoals.filter(g => g.parent_id === parentId)
  }

  // Toggle expand
  const toggleExpand = (goalId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) newSet.delete(goalId)
      else newSet.add(goalId)
      return newSet
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⭐ 重点目标
        </h3>
        <span className="text-sm text-gray-500">
          {visibleGoals.length} / {maxCount}
        </span>
      </div>

      {rootGoals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⭐</div>
          <p>还没有重点目标</p>
          <p className="text-sm">在目标上点击"设为重点"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rootGoals.map(goal => (
            <GoalTreeNode
              key={goal.id}
              goal={goal}
              goals={visibleGoals}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onComplete={onComplete}
              onUndoComplete={onUndoComplete}
              onSelect={onSelect}
              onRefresh={onRefresh}
              getChildren={getChildren}
              level={0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
