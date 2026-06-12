import type { UserRole } from '@/api/types/login'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { canAccessPage, getUserRoles, hasRole, isVisibleForRoles } from '@/utils/permission'

export function usePermission() {
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)

  const roles = computed(() => getUserRoles(userInfo.value))

  function checkRole(required: UserRole | UserRole[]) {
    return hasRole(userInfo.value, required)
  }

  function checkVisible(itemRoles?: UserRole[]) {
    return isVisibleForRoles(userInfo.value, itemRoles)
  }

  function checkPage(path?: string) {
    return canAccessPage(userInfo.value, path)
  }

  return {
    roles,
    hasRole: checkRole,
    isVisibleForRoles: checkVisible,
    canAccessPage: checkPage,
  }
}
