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

  // 获取根目标（没有父目标的）
  const rootGoals = goals.filter(goal => !goal.parent_id)

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
    return goals.filter(goal => goal.parent_id === parentId)
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
          {rootGoals.map((goal) => (
            <GoalTreeNode
              key={goal.id}
              goal={goal}
              goals={goals}
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
