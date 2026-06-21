import { useState } from 'react'
import { Goal, goalService } from '../../lib/db'
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
  const children = getChildren(goal.id!)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(goal.id!)

  // 计算倒计时（只比较日期，忽略时间）
  const getDaysRemaining = () => {
    if (!goal.target_date) return null
    const target = new Date(goal.target_date)
    const today = new Date()
    // 只取年月日，忽略时间
    const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const days = differenceInDays(targetDateOnly, todayDateOnly)
    return days
  }

  const daysRemaining = getDaysRemaining()

  // 获取优先级颜色
  const getPriorityColor = () => {
    switch (goal.priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  // 获取状态样式
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
    const title = prompt('输入子目标标题:')
    if (!title) return

    try {
      await goalService.create({
        title,
        description: '',
        status: 'pending',
        priority: 'medium',
        is_key_goal: false,
        tags: [],
        folder_id: goal.folder_id || null,
        parent_id: goal.id || null,
        start_date: null,
        order_index: children.length,
        time_spent: 0,
        reminder_at: null,
        is_deleted: false,
        deleted_at: null,
        repeat_rule: null,
        target_date: null,
        completed_at: null
      })
      onRefresh()
      if (!isExpanded) {
        onToggleExpand(goal.id!)
      }
    } catch (error) {
      console.error('添加子目标失败:', error)
    }
  }

  // 切换重点状态
  const handleToggleKeyGoal = async () => {
    try {
      await goalService.update(goal.id!, { is_key_goal: !goal.is_key_goal })
      onRefresh()
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  // 删除目标
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
          {/* 展开/折叠按钮 */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(goal.id!)
              }}
              className="mt-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-5" />
          )}

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
            <div className="flex items-center gap-2">
              {/* 优先级标记 */}
              <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />

              {/* 标题 */}
              <h4 className={`font-medium ${
                goal.status === 'completed'
                  ? 'text-green-600 dark:text-green-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {goal.title}
              </h4>

              {/* 重点标记 */}
              {goal.is_key_goal && (
                <span className="text-yellow-500">⭐</span>
              )}
            </div>

            {/* 描述预览 */}
            {goal.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {goal.description}
              </p>
            )}

            {/* 底部信息 */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {/* 倒计时 */}
              {daysRemaining !== null && goal.status !== 'completed' && (
                <span className={`${
                  daysRemaining < 0
                    ? 'text-red-500'
                    : daysRemaining <= 3
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}>
                  {daysRemaining < 0
                    ? `已超期 ${Math.abs(daysRemaining)} 天`
                    : daysRemaining === 0
                    ? '今天截止'
                    : `剩余 ${daysRemaining} 天`}
                </span>
              )}

              {/* 子目标数量 */}
              {hasChildren && (
                <span>{children.length} 个子目标</span>
              )}

              {/* 标签 */}
              {goal.tags && goal.tags.length > 0 && (
                <div className="flex gap-1">
                  {goal.tags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                  {goal.tags.length > 2 && (
                    <span>+{goal.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              ⋮
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddChild()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                >
                  添加子目标
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleKeyGoal()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {goal.is_key_goal ? '取消重点' : '设为重点'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  )
}
