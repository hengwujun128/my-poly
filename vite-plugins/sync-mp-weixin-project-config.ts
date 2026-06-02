import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/** 将根目录 project.config.json 的 setting 合并进 dist 输出，避免 *-vendor.js 被微信误判为无依赖 */
export default function syncMpWeixinProjectConfigPlugin(): Plugin {
  return {
    name: 'sync-mp-weixin-project-config',
    apply: 'build',
    closeBundle() {
      const platform = process.env.UNI_PLATFORM
      if (platform !== 'mp-weixin')
        return

      for (const mode of ['dev', 'build']) {
        mergeProjectConfig(mode)
      }
    },
  }
}

function mergeProjectConfig(mode: string) {
  const distConfigPath = path.resolve(process.cwd(), `dist/${mode}/mp-weixin/project.config.json`)
  const rootConfigPath = path.resolve(process.cwd(), 'project.config.json')

  if (!fs.existsSync(distConfigPath) || !fs.existsSync(rootConfigPath))
    return

  try {
    const distConfig = JSON.parse(fs.readFileSync(distConfigPath, 'utf8')) as Record<string, unknown>
    const rootConfig = JSON.parse(fs.readFileSync(rootConfigPath, 'utf8')) as {
      setting?: Record<string, unknown>
      appid?: string
    }

    distConfig.setting = {
      ...(distConfig.setting as Record<string, unknown> | undefined),
      ...rootConfig.setting,
      ignoreDevUnusedFiles: false,
      ignoreUploadUnusedFiles: false,
    }

    if (rootConfig.appid)
      distConfig.appid = rootConfig.appid

    fs.writeFileSync(distConfigPath, `${JSON.stringify(distConfig, null, 2)}\n`)
  }
  catch (error) {
    console.warn(`[sync-mp-weixin-project-config] merge failed (${mode}):`, error)
  }
}
