import { useState, useEffect } from 'react'
import { goalService, taskService, Goal, Task } from '../lib/db'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import GoalDetailModal from '../components/KeyGoals/GoalDetailModal'

export default function CalendarPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  useEffect(() => {
    loadData()
  }, [currentMonth])

  const loadData = async () => {
    try {
      const goalsData = await goalService.getAll()
      setGoals(goalsData)
      // Load tasks for all goals in parallel
      const allTasksResults = await Promise.all(
        goalsData.map(goal =>
          taskService.getByGoal(goal.id!)
            .then(goalTasks => goalTasks.map(t => ({ ...t, goal_title: goal.title })))
            .catch(() => [])
        )
      )
      setTasks(allTasksResults.flat() as Task[])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // For week view, show only the 7 days of the current week
  const days = viewMode === 'week'
    ? eachDayOfInterval({ start: startOfWeek(currentMonth, { weekStartsOn: 0 }), end: endOfWeek(currentMonth, { weekStartsOn: 0 }) })
    : monthDays

  // Get items for a specific date (goals in range + tasks in range)
  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const goalsForDate = goals.filter(goal => {
      if (goal.status === 'cancelled' || goal.is_deleted) return false
      const start = goal.start_date ? format(new Date(goal.start_date), 'yyyy-MM-dd') : null
      const end = goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : null
      // 有开始和截止：显示范围内每一天
      if (start && end) return dateStr >= start && dateStr <= end
      // 只有截止：显示截止当天 + 往前7天
      if (end && !start) {
        const endDate = new Date(goal.target_date!)
        const weekBefore = new Date(endDate)
        weekBefore.setDate(weekBefore.getDate() - 7)
        const weekBeforeStr = format(weekBefore, 'yyyy-MM-dd')
        return dateStr >= weekBeforeStr && dateStr <= end
      }
      // 只有开始：从开始往后显示
      if (start) return dateStr >= start
      return false
    })
    const tasksForDate = tasks.filter(task => {
      const start = task.start_date ? format(new Date(task.start_date), 'yyyy-MM-dd') : null
      const end = task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : null
      if (start && end) return dateStr >= start && dateStr <= end
      if (end) return dateStr === end
      if (start) return dateStr >= start
      return false
    })
    return { goals: goalsForDate, tasks: tasksForDate }
  }

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : { goals: [] as Goal[], tasks: [] as Task[] }

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">日历视图</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            月
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            周
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
              </h3>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                今天
              </button>
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
            >
              →
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {viewMode === 'month' && Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const items = getItemsForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)
              const hasGoals = items.goals.length > 0
              const hasTasks = items.tasks.length > 0

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-1 rounded-lg relative flex flex-col items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isTodayDate
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm">{format(day, 'd')}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {hasGoals && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {hasTasks && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500" /> 目标</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> 任务</div>
          </div>
        </div>

        {/* Right panel - selected date details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate ? format(selectedDate, 'M月d日', { locale: zhCN }) + ' 的安排' : '选择一个日期'}
          </h3>

          {selectedDate ? (
            <div className="space-y-4">
              {selectedItems.goals.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">目标 ({selectedItems.goals.length})</h4>
                  {selectedItems.goals.map(goal => (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          goal.status === 'completed' ? 'bg-green-500' :
                          goal.priority === 'high' ? 'bg-red-500' :
                          goal.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className={`font-medium ${
                          goal.status === 'completed'
                            ? 'text-green-600 dark:text-green-400 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}>{goal.title}</span>
                        {goal.is_key_goal && <span className="text-yellow-500">★</span>}
                      </div>
                      {goal.target_date && (
                        <p className="text-xs text-gray-400 mt-1">
                          截止: {format(new Date(goal.target_date), 'MM/dd')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedItems.tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">📝 任务 ({selectedItems.tasks.length})</h4>
                  {selectedItems.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border mb-2 ${
                        task.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={task.status === 'completed' ? 'text-green-500' : 'text-gray-400'}>
                          {task.status === 'completed' ? '☑' : '☐'}
                        </span>
                        <div className="flex-1">
                          <span className={
                            task.status === 'completed'
                              ? 'text-green-600 dark:text-green-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }>{task.title}</span>
                          {task.goal_title && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              🎯 {task.goal_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedItems.goals.length === 0 && selectedItems.tasks.length === 0 && (
                <p className="text-gray-500 text-center py-4">这天没有安排</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">点击日历中的日期查看详情</p>
          )}
        </div>
      </div>

      {selectedGoal && <GoalDetailModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />}
    </div>
  )
}
