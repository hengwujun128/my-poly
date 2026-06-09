/**
 * 将 nest-prisma-api /captchaImage 返回的 SVG 转为各端可展示的地址
 */

/** 小程序端：utf8 data URI */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

/** H5：base64 data URI */
function svgToBase64DataUri(svg: string): string {
  const trimmed = svg.trim()
  if (typeof btoa === 'function') {
    const encoded = encodeURIComponent(trimmed).replace(
      /%([0-9A-F]{2})/gi,
      (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)),
    )
    return `data:image/svg+xml;base64,${btoa(encoded)}`
  }
  return svgToDataUri(trimmed)
}

/**
 * 小程序：写入本地临时 svg 文件（image 组件对本地 svg 支持比 data URI 更稳定）
 */
export function persistCaptchaSvg(svg: string): Promise<string> {
  const trimmed = svg.trim()
  if (!trimmed)
    return Promise.resolve('')

  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    const userPath = (globalThis as any).wx?.env?.USER_DATA_PATH ?? ''
    const filePath = `${userPath}/captcha_${Date.now()}.svg`
    fs.writeFile({
      filePath,
      data: trimmed,
      encoding: 'utf8',
      success: () => resolve(filePath),
      fail: err => reject(err),
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve(svgToBase64DataUri(trimmed))
  // #endif
}

/**
 * 规范化验证码图片地址（非小程序或兜底）
 */
export function normalizeCaptchaSrc(img?: string): string {
  if (!img)
    return ''
  if (img.startsWith('data:') || img.startsWith('wxfile://') || img.startsWith('http'))
    return img
  const trimmed = img.trim()
  if (trimmed.startsWith('<') || trimmed.startsWith('<?xml'))
    return svgToDataUri(trimmed)
  return `data:image/png;base64,${trimmed}`
}
