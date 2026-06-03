import { http } from '@/http/http'

export type TaskSlot = 'morning' | 'noon' | 'evening'
export type TaskStatus = 'pending' | 'done' | 'expired'
export type TaskPushStatus = 'waiting' | 'sent' | 'failed' | 'skipped'

export interface IEmployeeTask {
  id: number
  userId: number
  title: string
  slot: TaskSlot
  taskDate: string
  scheduledAt: string
  status: TaskStatus
  pushStatus: TaskPushStatus
  pushedAt?: string | null
  createTime: string
}

const SLOT_LABEL: Record<TaskSlot, string> = {
  morning: '早间 9:00',
  noon: '午间 14:00',
  evening: '晚间 18:00',
}

export function getTaskSlotLabel(slot: TaskSlot) {
  return SLOT_LABEL[slot] ?? slot
}

/** 今日任务 */
export function getTodayTasks() {
  return http<IEmployeeTask[]>({
    url: '/task/today',
    method: 'GET',
  })
}

/** 历史任务 */
export function getTaskList(params?: { pageNum?: number, pageSize?: number }) {
  return http<{ rows: IEmployeeTask[], total: number }>({
    url: '/task/list',
    method: 'GET',
    query: params,
  })
}

/** 完成任务 */
export function completeTask(id: number) {
  return http<IEmployeeTask>({
    url: `/task/${id}/complete`,
    method: 'POST',
  })
}

/** [调试] 生成今日任务 */
export function debugGenerateTasks(userId?: number) {
  return http<{ userCount: number, created: number }>({
    url: '/task/debug/generate',
    method: 'POST',
    data: userId ? { userId } : {},
  })
}

/** [调试] 推送到期任务 */
export function debugPushTasks() {
  return http<{ total: number, sent: number, failed: number, skipped: number }>({
    url: '/task/debug/push',
    method: 'POST',
  })
}

/** [调试] 推送单条 */
export function debugPushTask(id: number) {
  return http<{ errcode: number, errmsg?: string }>({
    url: `/task/debug/push/${id}`,
    method: 'POST',
  })
}
