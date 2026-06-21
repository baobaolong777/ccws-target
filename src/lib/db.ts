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
  tags: string[]
  folder_id: string | null
  created_at: string
  updated_at: string
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

  // 永久删除目标
  async hardDelete(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

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
      .single()

    if (error || !data) {
      // 创建默认设置
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

      if (insertError) throw insertError
      return newData as UserSettings
    }

    return data as UserSettings
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
      goal.title,
      goal.description,
      goal.status,
      goal.priority,
      goal.tags.join(';'),
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
