import { useState, useEffect } from 'react'
import { Goal, Task, goalService, taskService } from '../../lib/db'
import { format, differenceInDays } from 'date-fns'

interface GoalTreeNodeProps {
  goal: Goal
  goals: Goal[]
  expandedIds: Set<string>
  onToggleExpand: (goalId: string) => void
  onComplete: (goalId: string) => void
  onUndoComplete: (goalId: string) => void
  onSelect: (goal: Goal) => void
  onRefresh: () => void
  getChildren: (parentId: string) => Goal[]
  level: number
}

export default function GoalTreeNode({
  goal,
  goals,
  expandedIds,
  onToggleExpand,
  onComplete,
  onUndoComplete,
  onSelect,
  onRefresh,
  getChildren,
  level
}: GoalTreeNodeProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [childTitle, setChildTitle] = useState('')
  const [childDescription, setChildDescription] = useState('')
  const [childPriority, setChildPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [childStartDate, setChildStartDate] = useState(new Date().toISOString().split('T')[0])
  const [childTargetDate, setChildTargetDate] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskStartDate, setTaskStartDate] = useState(new Date().toISOString().split('T')[0])
  const [taskDueDate, setTaskDueDate] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTasks, setShowTasks] = useState(false)

  const children = getChildren(goal.id!)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(goal.id!)

  // 加载任务
  useEffect(() => {
    loadTasks()
  }, [goal.id])

  const loadTasks = async () => {
    try {
      const data = await taskService.getByGoal(goal.id!)
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
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

  const getDaysRemaining = () => {
    if (!goal.target_date) return null
    const target = new Date(goal.target_date)
    const today = new Date()
    const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return differenceInDays(targetDateOnly, todayDateOnly)
  }

  const daysRemaining = getDaysRemaining()

  const getPriorityColor = () => {
    switch (goal.priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusStyle = () => {
    if (goal.status === 'completed') {
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    }
    if (goal.status === 'cancelled') {
      return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
    }
    return 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
  }

  // 添加子目标
  const handleAddChild = async () => {
    if (!childTitle.trim()) return
    try {
      await goalService.create({
        title: childTitle.trim(),
        description: childDescription.trim(),
        status: 'pending',
        priority: childPriority,
        is_key_goal: false,
        tags: [],
        folder_id: goal.folder_id || null,
        parent_id: goal.id || null,
        start_date: childStartDate ? new Date(childStartDate).toISOString() : null,
        order_index: children.length,
        time_spent: 0,
        reminder_at: null,
        is_deleted: false,
        deleted_at: null,
        repeat_rule: null,
        target_date: childTargetDate ? new Date(childTargetDate).toISOString() : null,
        completed_at: null
      })
      setChildTitle('')
      setChildDescription('')
      setChildPriority('medium')
      setChildStartDate(new Date().toISOString().split('T')[0])
      setChildTargetDate('')
      setShowAddChild(false)
      onRefresh()
      if (!isExpanded) onToggleExpand(goal.id!)
    } catch (error) {
      console.error('添加子目标失败:', error)
    }
  }

  // 添加任务
  const handleAddTask = async () => {
    if (!taskTitle.trim()) return
    try {
      await taskService.create({
        goal_id: goal.id!,
        title: taskTitle.trim(),
        status: 'pending',
        start_date: taskStartDate ? new Date(taskStartDate).toISOString() : null,
        due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        order_index: 0
      })
      setTaskTitle('')
      setTaskStartDate(new Date().toISOString().split('T')[0])
      setTaskDueDate('')
      setShowAddTask(false)
      onRefresh()
    } catch (error) {
      console.error('添加任务失败:', error)
    }
  }

  const handleToggleKeyGoal = async () => {
    try {
      await goalService.update(goal.id!, { is_key_goal: !goal.is_key_goal })
      onRefresh()
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个目标吗？')) return
    try {
      await goalService.softDelete(goal.id!)
      onRefresh()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  return (
    <div style={{ marginLeft: level * 24 }}>
      <div
        className={`p-3 rounded-lg border cursor-pointer ${getStatusStyle()}`}
        onClick={() => onSelect(goal)}
      >
        <div className="flex items-start gap-3">
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(goal.id!) }}
              className="mt-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (goal.status === 'completed') onUndoComplete(goal.id!)
              else onComplete(goal.id!)
            }}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
              goal.status === 'completed'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}
          >
            {goal.status === 'completed' && <span className="text-white text-xs">✓</span>}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />
              <h4 className={`font-medium ${
                goal.status === 'completed'
                  ? 'text-green-600 dark:text-green-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {goal.title}
              </h4>
              {goal.is_key_goal && <span className="text-yellow-500">⭐</span>}
            </div>

            {goal.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{goal.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {daysRemaining !== null && goal.status !== 'completed' && (
                <span className={`${
                  daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 3 ? 'text-yellow-500' : 'text-gray-500'
                }`}>
                  {daysRemaining < 0 ? `已超期 ${Math.abs(daysRemaining)} 天` : daysRemaining === 0 ? '今天截止' : `剩余 ${daysRemaining} 天`}
                </span>
              )}
              {hasChildren && <span>{children.length} 个子目标</span>}
              {tasks.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTasks(!showTasks) }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  {tasks.length} 个任务 {showTasks ? '▲' : '▼'}
                </button>
              )}
              {goal.tags && goal.tags.length > 0 && (
                <div className="flex gap-1">
                  {goal.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddChild(true); setShowMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                >
                  ➕ 添加子目标
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddTask(true); setShowMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  📝 添加任务
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleKeyGoal(); setShowMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {goal.is_key_goal ? '⭐ 取消重点' : '☆ 设为重点'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false) }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                >
                  🗑️ 删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      {showTasks && tasks.length > 0 && (
        <div className="mt-2 ml-8 space-y-1">
          {tasks.map(task => (
            <div key={task.id} className={`flex items-center gap-2 p-2 rounded text-sm ${
              task.status === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <button
                onClick={() => handleCompleteTask(task.id!, task.status !== 'completed')}
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {task.status === 'completed' && <span className="text-white text-xs">✓</span>}
              </button>
              <span className={`flex-1 ${
                task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                📝 {task.title}
              </span>
              {task.due_date && (
                <span className="text-xs text-gray-400">
                  截止: {format(new Date(task.due_date), 'MM/dd')}
                </span>
              )}
              <button
                onClick={() => handleDeleteTask(task.id!)}
                className="text-gray-400 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 子目标 */}
      {isExpanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <GoalTreeNode
              key={child.id}
              goal={child}
              goals={goals}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onComplete={onComplete}
              onUndoComplete={onUndoComplete}
              onSelect={onSelect}
              onRefresh={onRefresh}
              getChildren={getChildren}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* 添加子目标弹窗 */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddChild(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加子目标</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 *</label>
                  <input type="text" value={childTitle} onChange={e => setChildTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    autoFocus onKeyDown={e => e.key === 'Enter' && handleAddChild()} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                  <textarea value={childDescription} onChange={e => setChildDescription(e.target.value)} rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优先级</label>
                  <select value={childPriority} onChange={e => setChildPriority(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始日期</label>
                    <input type="date" value={childStartDate} onChange={e => setChildStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截止日期</label>
                    <input type="date" value={childTargetDate} onChange={e => setChildTargetDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddChild(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">取消</button>
                  <button onClick={handleAddChild}
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">添加</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加任务弹窗 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddTask(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加任务</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务标题 *</label>
                  <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    autoFocus onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始日期</label>
                    <input type="date" value={taskStartDate} onChange={e => setTaskStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截止日期</label>
                    <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddTask(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">取消</button>
                  <button onClick={handleAddTask}
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">添加</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
