import { supabase } from './supabase'

// 类型定义
export interface Goal {
  id?: string
  user_id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  is_key_goal: boolean
  is_daily: boolean
  tags: string[]
  folder_id: string | null
  created_at: string
  updated_at: string
  start_date: string | null
  target_date: string | null
  completed_at: string | null
  parent_id: string | null
  order_index: number
  time_spent: number
  reminder_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  repeat_rule: RepeatRule | null
}

export interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly' | 'none'
  interval: number
  days_of_week: string[]
  end_date: string | null
}

export interface Folder {
  id?: string
  user_id: string
  name: string
  color: string
  created_at: string
  order_index: number
}

export interface UserSettings {
  id?: string
  user_id: string
  key_goals_count: number
  theme: 'light' | 'dark'
  reminder_enabled: boolean
}

// 获取当前用户ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('用户未登录')
  return user.id
}

// 目标操作
export const goalService = {
  // 创建目标
  async create(goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  },

  // 更新目标
  async update(goalId: string, data: Partial<Goal>) {
    const { error } = await supabase
      .from('goals')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)

    if (error) throw error
  },

  // 删除目标（移到回收站）
  async softDelete(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', goalId)

    if (error) throw error
  },

  // 永久删除目标（级联删除子目标和任务）
  async hardDelete(goalId: string) {
    // Delete tasks for this goal
    await supabase.from('tasks').delete().eq('goal_id', goalId)
    // Delete child goals recursively
    const { data: children } = await supabase.from('goals').select('id').eq('parent_id', goalId)
    if (children) {
      for (const child of children) {
        await goalService.hardDelete(child.id)
      }
    }
    // Delete the goal itself
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) throw error
  },

  // 恢复目标
  async restore(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', goalId)

    if (error) throw error
  },

  // 获取用户所有目标
  async getAll() {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)

    if (error) throw error
    return data as Goal[]
  },

  // 获取重点目标
  async getKeyGoals(limit: number = 5) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_key_goal', true)
      .eq('is_deleted', false)
      .neq('status', 'completed')
      .limit(limit)

    if (error) throw error
    return data as Goal[]
  },

  // 获取回收站目标
  async getDeleted() {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return data as Goal[]
  },

  // 获取子目标
  async getChildren(parentId: string) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)

    if (error) throw error
    return data as Goal[]
  },

  // 搜索目标
  async search(keyword: string) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)

    if (error) throw error

    return (data as Goal[]).filter(goal =>
      goal.title.toLowerCase().includes(keyword.toLowerCase()) ||
      goal.description.toLowerCase().includes(keyword.toLowerCase())
    )
  },

  // 移动目标顺序
  async moveGoal(goalId: string, direction: 'up' | 'down') {
    const userId = await getCurrentUserId()

    // 获取当前目标
    const { data: currentGoal, error: currentError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (currentError) throw currentError

    // 获取同级根目标（parent_id为null的）
    const { data: siblings, error: siblingsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_id', currentGoal.parent_id)
      .eq('is_deleted', false)
      .order('order_index')

    if (siblingsError) throw siblingsError

    // 找到当前目标和相邻目标
    const currentIndex = siblings.findIndex(g => g.id === goalId)
    if (currentIndex === -1) throw new Error('找不到目标')

    let targetIndex: number
    if (direction === 'up') {
      targetIndex = currentIndex - 1
    } else {
      targetIndex = currentIndex + 1
    }

    // 检查边界
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      return // 已经在边界，不需要移动
    }

    // 交换 order_index
    const targetGoal = siblings[targetIndex]
    const currentOrderIndex = currentGoal.order_index
    const targetOrderIndex = targetGoal.order_index

    // 更新两个目标的 order_index
    await Promise.all([
      goalService.update(goalId, { order_index: targetOrderIndex }),
      goalService.update(targetGoal.id!, { order_index: currentOrderIndex })
    ])
  }
}

// 文件夹操作
export const folderService = {
  async create(name: string, color: string) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name,
        color,
        created_at: new Date().toISOString(),
        order_index: 0
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  },

  async update(folderId: string, data: Partial<Folder>) {
    const { error } = await supabase
      .from('folders')
      .update(data)
      .eq('id', folderId)

    if (error) throw error
  },

  async delete(folderId: string) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) throw error
  },

  async getAll() {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data as Folder[]
  }
}

// 用户设置操作
export const settingsService = {
  async get() {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    if (data && data.length > 0) {
      return data[0] as UserSettings
    }

    // No settings exist yet, create default
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert({
        user_id: userId,
        key_goals_count: 5,
        theme: 'light',
        reminder_enabled: true
      })
      .select()
      .single()

    if (insertError) {
      // Race condition: another request may have inserted first, try fetching again
      const { data: retryData, error: retryError } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)

      if (retryError) throw retryError
      if (retryData && retryData.length > 0) {
        return retryData[0] as UserSettings
      }
      throw insertError
    }

    return newData as UserSettings
  },

  async update(data: Partial<UserSettings>) {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('settings')
      .update(data)
      .eq('user_id', userId)

    if (error) throw error
  }
}

// 批量操作
export const batchService = {
  async completeGoals(goalIds: string[]) {
    const { error } = await supabase
      .from('goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .in('id', goalIds)

    if (error) throw error
  },

  async deleteGoals(goalIds: string[]) {
    const { error } = await supabase
      .from('goals')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .in('id', goalIds)

    if (error) throw error
  },

  async moveToFolder(goalIds: string[], folderId: string) {
    const { error } = await supabase
      .from('goals')
      .update({ folder_id: folderId })
      .in('id', goalIds)

    if (error) throw error
  }
}

// 任务类型和服务
export interface Task {
  id?: string
  goal_id: string
  user_id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  start_date: string | null
  due_date: string | null
  created_at: string
  order_index: number
}

export const taskService = {
  async getByGoal(goalId: string) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .order('order_index')
    if (error) throw error
    return data as Task[]
  },

  async create(task: Omit<Task, 'id' | 'user_id' | 'created_at'>) {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: userId, created_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data.id
  },

  async update(taskId: string, data: Partial<Task>) {
    const { error } = await supabase.from('tasks').update(data).eq('id', taskId)
    if (error) throw error
  },

  async delete(taskId: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) throw error
  }
}

// 导出功能
export const exportService = {
  async toJSON() {
    const goals = await goalService.getAll()
    const folders = await folderService.getAll()
    return {
      exportDate: new Date().toISOString(),
      goals,
      folders
    }
  },

  async toCSV() {
    const goals = await goalService.getAll()
    const headers = ['ID', '标题', '描述', '状态', '优先级', '标签', '创建时间', '目标时间', '完成时间']
    const rows = goals.map(goal => [
      goal.id,
      `"${(goal.title || '').replace(/"/g, '""')}"`,
      `"${(goal.description || '').replace(/"/g, '""')}"`,
      goal.status,
      goal.priority,
      `"${(goal.tags || []).join(';')}"`,
      goal.created_at,
      goal.target_date,
      goal.completed_at
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    return csv
  },

  download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
