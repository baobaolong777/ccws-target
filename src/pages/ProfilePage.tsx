import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { settingsService, exportService, UserSettings } from '../lib/db'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUser()
    loadSettings()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadSettings = async () => {
    try {
      const settingsData = await settingsService.get()
      setSettings(settingsData)
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新设置
  const handleUpdateSettings = async (data: Partial<UserSettings>) => {
    setSaving(true)
    try {
      await settingsService.update(data)
      setSettings(prev => prev ? { ...prev, ...data } : null)
    } catch (error) {
      console.error('更新设置失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 导出 JSON
  const handleExportJSON = async () => {
    try {
      const data = await exportService.toJSON()
      const json = JSON.stringify(data, null, 2)
      exportService.download(json, `ccws-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  // 导出 CSV
  const handleExportCSV = async () => {
    try {
      const csv = await exportService.toCSV()
      exportService.download(csv, `ccws-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h2>

      {/* 用户信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          👤 账号信息
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">邮箱</span>
            <span className="text-gray-900 dark:text-white">
              {user?.email || '未登录'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">用户ID</span>
            <span className="text-gray-900 dark:text-white text-sm font-mono">
              {user?.id?.substring(0, 16)}...
            </span>
          </div>
        </div>
      </div>

      {/* 显示设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ⚙️ 显示设置
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              首页显示重点目标数量
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={settings?.key_goals_count || 5}
                onChange={(e) => handleUpdateSettings({ key_goals_count: parseInt(e.target.value) })}
                className="flex-1"
                disabled={saving}
              />
              <span className="w-8 text-center text-gray-900 dark:text-white font-medium">
                {settings?.key_goals_count || 5}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              在首页显示的重点目标数量（1-10）
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">深色模式</p>
              <p className="text-sm text-gray-500">切换应用主题</p>
            </div>
            <button
              onClick={() => handleUpdateSettings({
                theme: settings?.theme === 'dark' ? 'light' : 'dark'
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings?.theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              disabled={saving}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings?.theme === 'dark' ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">启用提醒</p>
              <p className="text-sm text-gray-500">接收目标到期提醒</p>
            </div>
            <button
              onClick={() => handleUpdateSettings({
                reminder_enabled: !settings?.reminder_enabled
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings?.reminder_enabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              disabled={saving}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings?.reminder_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 数据导出 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📦 数据导出
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExportJSON}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📄</span>
            导出为 JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📊</span>
            导出为 CSV
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          导出的数据包含所有目标和文件夹信息。
        </p>
      </div>

      {/* 关于 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ℹ️ 关于
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>CCWS 目标管理应用 v1.0.0</p>
          <p>帮助你管理目标，实现梦想</p>
          <p className="pt-2">
            功能特性：树状目标、日历视图、统计分析、多设备同步、离线使用
          </p>
        </div>
      </div>
    </div>
  )
}
