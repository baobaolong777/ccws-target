import { useState, useEffect } from 'react'
import { Task, taskService, Goal } from '../../lib/db'
import { format } from 'date-fns'

interface GoalDetailModalProps {
  goal: Goal
  onClose: () => void
}

export default function GoalDetailModal({ goal, onClose }: GoalDetailModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    try {
      const data = await taskService.getByGoal(goal.id!)
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    try {
      await taskService.create({
        goal_id: goal.id!,
        title: newTaskTitle,
        status: 'pending',
        start_date: newTaskStartDate ? new Date(newTaskStartDate).toISOString() : null,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
        order_index: tasks.length
      })
      setNewTaskTitle('')
      setNewTaskStartDate('')
      setNewTaskDueDate('')
      setShowAddTask(false)
      loadTasks()
    } catch (error) {
      console.error('添加任务失败:', error)
    }
  }

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      await taskService.update(taskId, { status: completed ? 'completed' : 'pending' })
      loadTasks()
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.delete(taskId)
      loadTasks()
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '✅ 已完成'
      case 'in_progress': return '⏳ 进行中'
      default: return '⬜ 待完成'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴 高'
      case 'medium': return '🟡 中'
      default: return '🟢 低'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl active:scale-95 transition-all duration-200">✕</button>
          </div>

          {/* Goal Info */}
          <div className="space-y-2 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
            {goal.description && <p className="text-gray-600 dark:text-gray-300">{goal.description}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span>状态: {getStatusText(goal.status)}</span>
              <span>优先级: {getPriorityText(goal.priority)}</span>
              {goal.target_date && <span>截止: {format(new Date(goal.target_date), 'yyyy-MM-dd')}</span>}
              {goal.start_date && <span>开始: {format(new Date(goal.start_date), 'yyyy-MM-dd')}</span>}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">📋 任务 ({tasks.length})</h3>
              <button onClick={() => setShowAddTask(true)} className="text-blue-500 hover:text-blue-600 text-sm">+ 添加</button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-gray-500">加载中...</div>
            ) : tasks.length === 0 && !showAddTask ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">还没有任务</p>
                <p className="text-xs">点击"添加"创建任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}>
                    <button onClick={() => handleCompleteTask(task.id!, task.status !== 'completed')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center animate-pulse-once ${
                        task.status === 'completed' ? 'bg-green-500 border-green-500 animate-check' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {task.status === 'completed' && <span className="text-white text-xs animate-check">✓</span>}
                    </button>
                    <div className="flex-1">
                      <span className={task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}>
                        {task.title}
                      </span>
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        {task.start_date && <span>开始: {format(new Date(task.start_date), 'MM/dd')}</span>}
                        {task.due_date && <span>截止: {format(new Date(task.due_date), 'MM/dd')}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id!)} className="text-red-400 hover:text-red-600 text-sm">删除</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Form */}
            {showAddTask && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl space-y-3">
                <input type="text" placeholder="任务标题" value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl dark:bg-gray-600 dark:text-white text-sm"
                  autoFocus onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">开始日期</label>
                    <input type="date" value={newTaskStartDate} onChange={e => setNewTaskStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl dark:bg-gray-600 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">截止日期</label>
                    <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl dark:bg-gray-600 dark:text-white text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowAddTask(false); setNewTaskTitle('') }}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl text-sm active:scale-[0.98] transition-all duration-200">取消</button>
                  <button onClick={handleAddTask}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-2xl text-sm active:scale-[0.98] transition-all duration-200">添加</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
