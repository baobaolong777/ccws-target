import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db, auth } from './firebase'

// 类型定义
export interface Goal {
  id?: string
  userId: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  isKeyGoal: boolean
  tags: string[]
  folderId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  targetDate: Timestamp | null
  completedAt: Timestamp | null
  parentId: string | null
  orderIndex: number
  timeSpent: number
  reminderAt: Timestamp | null
  isDeleted: boolean
  deletedAt: Timestamp | null
  repeatRule: RepeatRule | null
}

export interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly' | 'none'
  interval: number
  daysOfWeek: string[]
  endDate: Timestamp | null
}

export interface Folder {
  id?: string
  userId: string
  name: string
  color: string
  createdAt: Timestamp
  orderIndex: number
}

export interface UserSettings {
  id?: string
  userId: string
  keyGoalsCount: number
  theme: 'light' | 'dark'
  reminderEnabled: boolean
}

// 获取当前用户ID
const getCurrentUserId = (): string => {
  const user = auth.currentUser
  if (!user) throw new Error('用户未登录')
  return user.uid
}

// 目标操作
export const goalService = {
  // 创建目标
  async create(goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = getCurrentUserId()
    const docRef = await addDoc(collection(db, 'goals'), {
      ...goal,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  // 更新目标
  async update(goalId: string, data: Partial<Goal>) {
    const docRef = doc(db, 'goals', goalId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  },

  // 删除目标（移到回收站）
  async softDelete(goalId: string) {
    const docRef = doc(db, 'goals', goalId)
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp()
    })
  },

  // 永久删除目标
  async hardDelete(goalId: string) {
    const docRef = doc(db, 'goals', goalId)
    await deleteDoc(docRef)
  },

  // 恢复目标
  async restore(goalId: string) {
    const docRef = doc(db, 'goals', goalId)
    await updateDoc(docRef, {
      isDeleted: false,
      deletedAt: null
    })
  },

  // 获取用户所有目标
  async getAll() {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('isDeleted', '==', false)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[]
  },

  // 获取重点目标
  async getKeyGoals(limit: number = 5) {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('isKeyGoal', '==', true),
      where('isDeleted', '==', false)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[]
  },

  // 获取回收站目标
  async getDeleted() {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('isDeleted', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[]
  },

  // 获取子目标
  async getChildren(parentId: string) {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('parentId', '==', parentId),
      where('isDeleted', '==', false)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[]
  },

  // 搜索目标
  async search(keyword: string) {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('isDeleted', '==', false)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Goal)
      .filter(goal =>
        goal.title.toLowerCase().includes(keyword.toLowerCase()) ||
        goal.description.toLowerCase().includes(keyword.toLowerCase())
      )
  }
}

// 文件夹操作
export const folderService = {
  async create(name: string, color: string) {
    const userId = getCurrentUserId()
    const docRef = await addDoc(collection(db, 'folders'), {
      userId,
      name,
      color,
      createdAt: serverTimestamp(),
      orderIndex: 0
    })
    return docRef.id
  },

  async update(folderId: string, data: Partial<Folder>) {
    const docRef = doc(db, 'folders', folderId)
    await updateDoc(docRef, data)
  },

  async delete(folderId: string) {
    const docRef = doc(db, 'folders', folderId)
    await deleteDoc(docRef)
  },

  async getAll() {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'folders'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Folder[]
  }
}

// 用户设置操作
export const settingsService = {
  async get() {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'settings'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      // 创建默认设置
      const docRef = await addDoc(collection(db, 'settings'), {
        userId,
        keyGoalsCount: 5,
        theme: 'light',
        reminderEnabled: true
      })
      return {
        id: docRef.id,
        userId,
        keyGoalsCount: 5,
        theme: 'light',
        reminderEnabled: true
      } as UserSettings
    }
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as UserSettings
  },

  async update(data: Partial<UserSettings>) {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, 'settings'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docRef = doc(db, 'settings', snapshot.docs[0].id)
      await updateDoc(docRef, data)
    }
  }
}

// 批量操作
export const batchService = {
  // 批量完成目标
  async completeGoals(goalIds: string[]) {
    const promises = goalIds.map(id =>
      goalService.update(id, {
        status: 'completed',
        completedAt: Timestamp.now() as any
      })
    )
    await Promise.all(promises)
  },

  // 批量删除目标
  async deleteGoals(goalIds: string[]) {
    const promises = goalIds.map(id => goalService.softDelete(id))
    await Promise.all(promises)
  },

  // 批量移动到文件夹
  async moveToFolder(goalIds: string[], folderId: string) {
    const promises = goalIds.map(id =>
      goalService.update(id, { folderId })
    )
    await Promise.all(promises)
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
      goal.createdAt?.toDate().toISOString(),
      goal.targetDate?.toDate().toISOString(),
      goal.completedAt?.toDate().toISOString()
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
