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
