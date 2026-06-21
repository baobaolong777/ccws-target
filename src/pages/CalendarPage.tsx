import { useState, useEffect } from 'react'
import { goalService, Goal } from '../lib/db'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function CalendarPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [currentMonth])

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

  // 获取当月所有日期
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 获取指定日期的目标
  const getGoalsForDate = (date: Date) => {
    return goals.filter(goal => {
      if (!goal.target_date) return false
      const goalDate = new Date(goal.target_date)
      return isSameDay(goalDate, date)
    })
  }

  // 获取选中日期的目标
  const selectedGoals = selectedDate ? getGoalsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">日历视图</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日历 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              →
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1">
            {/* 填充月初空白 */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* 日期 */}
            {days.map((day) => {
              const dayGoals = getGoalsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-1 rounded-lg relative ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isTodayDate
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm">{format(day, 'd')}</span>
                  {dayGoals.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayGoals.slice(0, 3).map((goal, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            goal.status === 'completed'
                              ? 'bg-green-500'
                              : goal.priority === 'high'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 选中日期的目标 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate
              ? format(selectedDate, 'M月d日', { locale: zhCN }) + ' 的目标'
              : '选择一个日期'}
          </h3>

          {selectedDate ? (
            selectedGoals.length > 0 ? (
              <div className="space-y-3">
                {selectedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-3 rounded-lg border ${
                      goal.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 w-2 h-2 rounded-full ${
                          goal.priority === 'high'
                            ? 'bg-red-500'
                            : goal.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          goal.status === 'completed'
                            ? 'text-green-600 dark:text-green-400 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {goal.title}
                        </h4>
                        {goal.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                这天没有目标
              </p>
            )
          ) : (
            <p className="text-gray-500 text-center py-8">
              点击日历中的日期查看目标
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
