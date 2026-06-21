import { useState, useEffect } from 'react'
import { goalService, Goal } from '../lib/db'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export default function StatsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const allGoals = await goalService.getAll()
      setGoals(allGoals)
    } catch (error) {
      console.error('加载目标失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 计算统计数据
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const completedGoals = goals.filter(g => g.status === 'completed')
  const pendingGoals = goals.filter(g => g.status === 'pending')
  const inProgressGoals = goals.filter(g => g.status === 'in_progress')

  // 本周完成的目标
  const weekCompleted = completedGoals.filter(g => {
    if (!g.completedAt) return false
    const completedDate = g.completedAt.toDate()
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd })
  })

  // 本月完成的目标
  const monthCompleted = completedGoals.filter(g => {
    if (!g.completedAt) return false
    const completedDate = g.completedAt.toDate()
    return isWithinInterval(completedDate, { start: monthStart, end: monthEnd })
  })

  // 按优先级统计
  const highPriority = goals.filter(g => g.priority === 'high')
  const mediumPriority = goals.filter(g => g.priority === 'medium')
  const lowPriority = goals.filter(g => g.priority === 'low')

  // 完成率
  const completionRate = goals.length > 0
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">统计面板</h2>

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总目标数"
          value={goals.length}
          icon="📋"
          color="blue"
        />
        <StatCard
          title="已完成"
          value={completedGoals.length}
          icon="✅"
          color="green"
        />
        <StatCard
          title="进行中"
          value={inProgressGoals.length}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title="待完成"
          value={pendingGoals.length}
          icon="📝"
          color="gray"
        />
      </div>

      {/* 时间统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 本周完成 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📅 本周完成
          </h3>
          <div className="text-4xl font-bold text-blue-500 mb-2">
            {weekCompleted.length}
          </div>
          <p className="text-gray-500">
            {format(weekStart, 'M/d')} - {format(weekEnd, 'M/d')}
          </p>
        </div>

        {/* 本月完成 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 本月完成
          </h3>
          <div className="text-4xl font-bold text-purple-500 mb-2">
            {monthCompleted.length}
          </div>
          <p className="text-gray-500">
            {format(now, 'yyyy年 M月')}
          </p>
        </div>
      </div>

      {/* 完成率 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 完成率
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-green-500">
            {completionRate}%
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {completedGoals.length} / {goals.length} 个目标已完成
            </p>
          </div>
        </div>
      </div>

      {/* 优先级分布 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 优先级分布
        </h3>
        <div className="space-y-4">
          <PriorityBar
            label="高优先级"
            count={highPriority.length}
            total={goals.length}
            color="red"
          />
          <PriorityBar
            label="中优先级"
            count={mediumPriority.length}
            total={goals.length}
            color="yellow"
          />
          <PriorityBar
            label="低优先级"
            count={lowPriority.length}
            total={goals.length}
            color="green"
          />
        </div>
      </div>

      {/* 最近完成的目标 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ✨ 最近完成
        </h3>
        {completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals
              .sort((a, b) => {
                const aTime = a.completedAt?.toMillis() || 0
                const bTime = b.completedAt?.toMillis() || 0
                return bTime - aTime
              })
              .slice(0, 5)
              .map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <span className="text-green-500">✅</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white line-through">
                      {goal.title}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {goal.completedAt
                      ? format(goal.completedAt.toDate(), 'M/d')
                      : ''}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">还没有完成的目标</p>
        )}
      </div>
    </div>
  )
}

// 统计卡片组件
function StatCard({ title, value, icon, color }: {
  title: string
  value: number
  icon: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-500',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500',
    gray: 'bg-gray-50 dark:bg-gray-700 text-gray-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

// 优先级进度条组件
function PriorityBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  const colorClasses = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  }

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-gray-500">
          {count} 个 ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color as keyof typeof colorClasses]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
