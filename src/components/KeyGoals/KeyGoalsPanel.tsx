import { useState } from 'react'
import { Goal } from '../../lib/db'
import { differenceInDays } from 'date-fns'
import GoalDetailModal from './GoalDetailModal'

interface KeyGoalsPanelProps {
  goals: Goal[]
  maxCount: number
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
  onSelect: (goal: Goal) => void
}

export default function KeyGoalsPanel({ goals, maxCount, onComplete, onUndoComplete, onSelect }: KeyGoalsPanelProps) {
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<Goal | null>(null)

  // Filter goals by start_date - only show goals where start_date is null OR start_date <= today
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const visibleGoals = goals.filter(goal => {
    if (!goal.start_date) return true
    return goal.start_date.split('T')[0] <= todayStr
  })

  // 计算倒计时（只比较日期，忽略时间）
  const getDaysRemaining = (goal: Goal) => {
    if (!goal.target_date) return null
    const target = new Date(goal.target_date)
    const today = new Date()
    const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return differenceInDays(targetDateOnly, todayDateOnly)
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-700'
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⭐ 重点目标
          </h3>
          <span className="text-sm text-gray-500">
            {visibleGoals.length} / {maxCount}
          </span>
        </div>

        {visibleGoals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⭐</div>
            <p>还没有重点目标</p>
            <p className="text-sm">在目标上点击"设为重点"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleGoals.map((goal) => {
              const daysRemaining = getDaysRemaining(goal)
              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalDetail(goal)}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(goal.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (goal.status === 'completed') {
                          onUndoComplete(goal.id!)
                        } else {
                          onComplete(goal.id!)
                        }
                      }}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        goal.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {goal.status === 'completed' && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </button>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${
                        goal.status === 'completed'
                          ? 'text-green-600 dark:text-green-400 line-through'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {goal.title}
                      </h4>

                      {/* 倒计时 */}
                      {daysRemaining !== null && goal.status !== 'completed' && (
                        <p className={`text-sm mt-1 ${
                          daysRemaining < 0
                            ? 'text-red-500 font-medium'
                            : daysRemaining <= 3
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-500'
                        }`}>
                          {daysRemaining < 0
                            ? `⚠️ 已超期 ${Math.abs(daysRemaining)} 天`
                            : daysRemaining === 0
                            ? '🔔 今天截止'
                            : `⏰ 剩余 ${daysRemaining} 天`}
                        </p>
                      )}
                    </div>

                    {/* 状态标签 */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      goal.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : goal.status === 'in_progress'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {goal.status === 'completed'
                        ? '已完成'
                        : goal.status === 'in_progress'
                        ? '进行中'
                        : '待完成'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedGoalDetail && (
        <GoalDetailModal goal={selectedGoalDetail} onClose={() => setSelectedGoalDetail(null)} />
      )}
    </>
  )
}
