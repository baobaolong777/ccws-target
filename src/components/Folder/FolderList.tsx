import { useState } from 'react'
import { folderService } from '../../lib/db'

interface FolderListProps {
  folders: any[]
  onRefresh: () => void
  onSelectFolder: (folderId: string | null) => void
  selectedFolderId: string | null
}

export default function FolderList({ folders, onRefresh, onSelectFolder, selectedFolderId }: FolderListProps) {
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6')
  const [error, setError] = useState('')

  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ]

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setError('')

    // 检查重复名字
    const exists = folders.some(
      f => f.name.toLowerCase() === newFolderName.trim().toLowerCase()
    )
    if (exists) {
      setError('文件夹名称已存在')
      return
    }

    try {
      await folderService.create(newFolderName.trim(), newFolderColor)
      setNewFolderName('')
      setNewFolderColor('#3B82F6')
      setShowNewFolder(false)
      onRefresh()
    } catch (error) {
      console.error('创建文件夹失败:', error)
    }
  }

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个文件夹吗？文件夹中的目标不会被删除。')) {
      return
    }
    try {
      await folderService.delete(folderId)
      if (selectedFolderId === folderId) {
        onSelectFolder(null)
      }
      onRefresh()
    } catch (error) {
      console.error('删除文件夹失败:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📁 文件夹
        </h3>
        <button
          onClick={() => setShowNewFolder(true)}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          + 新建
        </button>
      </div>

      {folders.length === 0 && !showNewFolder ? (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm">还没有文件夹</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* 全部目标选项 */}
          <div
            onClick={() => onSelectFolder(null)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedFolderId === null
                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">📋</span>
            <span className="flex-1 text-gray-900 dark:text-white">全部目标</span>
          </div>

          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                selectedFolderId === folder.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: folder.color }}
              />
              <span className="flex-1 text-gray-900 dark:text-white">
                {folder.name}
              </span>
              <button
                onClick={(e) => handleDeleteFolder(folder.id, e)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 text-sm transition-opacity"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 新建文件夹表单 */}
      {showNewFolder && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <input
            type="text"
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => {
              setNewFolderName(e.target.value)
              setError('')
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white mb-3"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />

          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}

          <div className="flex gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setNewFolderColor(color)}
                className={`w-6 h-6 rounded-full ${
                  newFolderColor === color
                    ? 'ring-2 ring-offset-2 ring-blue-500'
                    : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
                setError('')
              }}
              className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              取消
            </button>
            <button
              onClick={handleCreateFolder}
              className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              创建
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
