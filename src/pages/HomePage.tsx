import { useState, useEffect } from 'react'
import { goalService, folderService, Goal, settingsService, UserSettings } from '../lib/db'
import KeyGoalsPanel from '../components/KeyGoals/KeyGoalsPanel'
import GoalTree from '../components/GoalTree/GoalTree'
import GoalDetail from '../components/GoalDetail/GoalDetail'
import FolderList from '../components/Folder/FolderList'

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [keyGoals, setKeyGoals] = useState<Goal[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewGoal, setShowNewGoal] = useState(false)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [goalsData, foldersData, settingsData] = await Promise.all([
        goalService.getAll(),
        folderService.getAll(),
        settingsService.get()
      ])

      setGoals(goalsData)
      setFolders(foldersData)
      setSettings(settingsData)

      // 加载重点目标
      const keyGoalsData = await goalService.getKeyGoals(settingsData.key_goals_count)
      setKeyGoals(keyGoalsData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadData()
      return
    }
    try {
      const results = await goalService.search(searchKeyword)
      setGoals(results)
    } catch (error) {
      console.error('搜索失败:', error)
    }
  }

  // 创建新目标
  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    try {
      await goalService.create({
        title: goalData.title || '',
        description: goalData.description || '',
        status: goalData.status || 'pending',
        priority: goalData.priority || 'medium',
        is_key_goal: goalData.is_key_goal || false,
        tags: goalData.tags || [],
        folder_id: goalData.folder_id || null,
        parent_id: goalData.parent_id || null,
        start_date: goalData.start_date || null,
        target_date: goalData.target_date || null,
        completed_at: null,
        order_index: goals.length,
        time_spent: 0,
        reminder_at: null,
        is_deleted: false,
        deleted_at: null,
        repeat_rule: goalData.repeat_rule || null
      })
      await loadData()
      setShowNewGoal(false)
    } catch (error) {
      console.error('创建目标失败:', error)
    }
  }

  // 更新目标
  const handleUpdateGoal = async (goalId: string, data: Partial<Goal>) => {
    // Optimistic update
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...data } : g))
    setKeyGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...data } : g))
    setSelectedGoal(null)
    try {
      await goalService.update(goalId, data)
    } catch (error) {
      console.error('更新目标失败:', error)
      loadData()
    }
  }

  // 删除目标
  const handleDeleteGoal = async (goalId: string) => {
    // Optimistic update
    setGoals(prev => prev.filter(g => g.id !== goalId))
    setKeyGoals(prev => prev.filter(g => g.id !== goalId))
    setSelectedGoal(null)
    try {
      await goalService.softDelete(goalId)
    } catch (error) {
      console.error('删除目标失败:', error)
      loadData()
    }
  }

  // 完成目标
  const handleCompleteGoal = async (goalId: string) => {
    // Optimistic update
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, status: 'completed', completed_at: new Date().toISOString() } : g
    ))
    setKeyGoals(prev => prev.filter(g => g.id !== goalId))
    try {
      await goalService.update(goalId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('完成目标失败:', error)
      loadData()
    }
  }

  // 撤销完成
  const handleUndoComplete = async (goalId: string) => {
    // 找到被取消完成的目标
    const goalToUndo = goals.find(g => g.id === goalId)

    // Optimistic update
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, status: 'pending', completed_at: null } : g
    ))

    // 如果是重点目标，加回重点目标列表
    if (goalToUndo?.is_key_goal) {
      setKeyGoals(prev => {
        // 避免重复添加
        if (prev.some(g => g.id === goalId)) return prev
        const maxCount = settings?.key_goals_count || 5
        if (prev.length >= maxCount) return prev
        return [...prev, { ...goalToUndo, status: 'pending', completed_at: null }]
      })
    }

    try {
      await goalService.update(goalId, {
        status: 'pending',
        completed_at: null
      })
    } catch (error) {
      console.error('撤销完成失败:', error)
      loadData()
    }
  }

  // 按文件夹筛选目标
  const filteredGoals = selectedFolderId
    ? goals.filter(g => g.folder_id === selectedFolderId)
    : goals

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="搜索目标..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          搜索
        </button>
        <button
          onClick={() => setShowNewGoal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          + 新建
        </button>
      </div>

      {/* 重点目标 */}
      <KeyGoalsPanel
        goals={keyGoals}
        maxCount={settings?.key_goals_count || 5}
        onComplete={handleCompleteGoal}
        onUndoComplete={handleUndoComplete}
        onSelect={setSelectedGoal}
        onRefresh={loadData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：文件夹和目标树 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 文件夹列表 */}
          <FolderList
            folders={folders}
            onRefresh={loadData}
            onSelectFolder={setSelectedFolderId}
            selectedFolderId={selectedFolderId}
          />

          {/* 目标树 */}
          <GoalTree
            goals={filteredGoals}
            onComplete={handleCompleteGoal}
            onUndoComplete={handleUndoComplete}
            onSelect={setSelectedGoal}
            onRefresh={loadData}
          />
        </div>

        {/* 右侧：目标详情 */}
        <div className="lg:col-span-1">
          {selectedGoal ? (
            <GoalDetail
              goal={selectedGoal}
              folders={folders}
              onUpdate={(data) => handleUpdateGoal(selectedGoal.id!, data)}
              onDelete={() => handleDeleteGoal(selectedGoal.id!)}
              onClose={() => setSelectedGoal(null)}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center text-gray-500">
              选择一个目标查看详情
            </div>
          )}
        </div>
      </div>

      {/* 新建目标模态框 */}
      {showNewGoal && (
        <NewGoalModal
          folders={folders}
          onSubmit={handleCreateGoal}
          onClose={() => setShowNewGoal(false)}
        />
      )}
    </div>
  )
}

// 新建目标模态框
function NewGoalModal({ folders, onSubmit, onClose }: {
  folders: any[]
  onSubmit: (data: Partial<Goal>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [targetDate, setTargetDate] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [isKeyGoal, setIsKeyGoal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      priority,
      start_date: startDate ? new Date(startDate) as any : null,
      target_date: targetDate ? new Date(targetDate) as any : null,
      folder_id: folderId,
      is_key_goal: isKeyGoal
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            新建目标
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                文件夹
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isKeyGoal"
                checked={isKeyGoal}
                onChange={(e) => setIsKeyGoal(e.target.checked)}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isKeyGoal" className="text-sm text-gray-700 dark:text-gray-300">
                设为重点目标
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
