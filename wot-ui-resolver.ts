import type { ComponentResolver } from '@uni-helper/vite-plugin-uni-components'

/**
 * Wot UI v2 (@wot-ui/ui) 组件自动导入 resolver
 * @see https://unibest.tech/base/7-ui
 */
export function WotResolver(): ComponentResolver {
  return {
    type: 'component',
    resolve: (name: string) => {
      if (!name.startsWith('Wd'))
        return

      const kebabName = name
        .slice(2)
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')

      return {
        name,
        from: `@wot-ui/ui/components/wd-${kebabName}/wd-${kebabName}.vue`,
      }
    },
  }
}
