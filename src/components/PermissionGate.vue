<script lang="ts" setup>
import type { UserRole } from '@/api/types/login'
import { computed } from 'vue'
import { usePermission } from '@/hooks/usePermission'

const props = defineProps<{
  /** 所需角色之一；不传则始终显示 */
  roles?: UserRole | UserRole[]
}>()

const { hasRole } = usePermission()

const visible = computed(() => {
  if (!props.roles)
    return true
  return hasRole(props.roles)
})
</script>

<template>
  <slot v-if="visible" />
</template>
