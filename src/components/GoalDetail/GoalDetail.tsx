import { useState, useEffect } from 'react'
import { Goal, goalService } from '../../lib/db'
import { format } from 'date-fns'

interface GoalDetailProps {
  goal: Goal
  folders: any[]
  onUpdate: (data: Partial<Goal>) => void
  onDelete: () => void
  onClose: () => void
}

export default function GoalDetail({ goal, folders, onUpdate, onDelete, onClose }: GoalDetailProps) {
  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description)
  const [status, setStatus] = useState(goal.status)
  const [priority, setPriority] = useState(goal.priority)
  const [startDate, setStartDate] = useState(
    goal.start_date ? format(new Date(goal.start_date), 'yyyy-MM-dd') : ''
  )
  const [targetDate, setTargetDate] = useState(
    goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : ''
  )
  const [folderId, setFolderId] = useState(goal.folder_id || '')
  const [tags, setTags] = useState(goal.tags.join(', '))
  const [isKeyGoal, setIsKeyGoal] = useState(goal.is_key_goal)
  const [repeatType, setRepeatType] = useState(goal.repeat_rule?.type || 'none')
  const [repeatInterval, setRepeatInterval] = useState(goal.repeat_rule?.interval || 1)

  // 当目标变化时更新表单
  useEffect(() => {
    setTitle(goal.title)
    setDescription(goal.description)
    setStatus(goal.status)
    setPriority(goal.priority)
    setStartDate(goal.start_date ? format(new Date(goal.start_date), 'yyyy-MM-dd') : '')
    setTargetDate(goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : '')
    setFolderId(goal.folder_id || '')
    setTags(goal.tags.join(', '))
    setIsKeyGoal(goal.is_key_goal)
    setRepeatType(goal.repeat_rule?.type || 'none')
    setRepeatInterval(goal.repeat_rule?.interval || 1)
  }, [goal])

  // 保存更改
  const handleSave = () => {
    const repeatRule = repeatType !== 'none' ? {
      type: repeatType as any,
      interval: repeatInterval,
      days_of_week: [],
      end_date: null
    } : null

    onUpdate({
      title,
      description,
      status,
      priority,
      start_date: startDate || null,
      target_date: targetDate || null,
      folder_id: folderId || null,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      is_key_goal: isKeyGoal,
      repeat_rule: repeatRule
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          目标详情
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 状态和优先级 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="pending">待完成</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              优先级
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        {/* 开始日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            开始日期
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 目标日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            目标日期
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 文件夹 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            文件夹
          </label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">无</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标签（用逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="工作, 学习, 生活"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 重复设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            重复
          </label>
          <div className="flex gap-2">
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'none')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
            {repeatType !== 'none' && (
              <input
                type="number"
                min="1"
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                className="w-20 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>
        </div>

        {/* 重点标记 */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isKeyGoal"
            checked={isKeyGoal}
            onChange={(e) => setIsKeyGoal(e.target.checked)}
            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isKeyGoal" className="text-sm text-gray-700 dark:text-gray-300">
            ⭐ 设为重点目标
          </label>
        </div>

        {/* 元信息 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 space-y-1">
            <p>创建时间：{format(new Date(goal.created_at), 'yyyy-MM-dd HH:mm')}</p>
            <p>更新时间：{format(new Date(goal.updated_at), 'yyyy-MM-dd HH:mm')}</p>
            {goal.completed_at && (
              <p>完成时间：{format(new Date(goal.completed_at), 'yyyy-MM-dd HH:mm')}</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onDelete}
            className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
