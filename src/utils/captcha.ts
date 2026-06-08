/**
 * 将 nest-prisma-api /captchaImage 返回的 SVG 转为各端可展示的地址
 */

interface SvgSize {
  width: number
  height: number
}

function parseSvgSize(svg: string): SvgSize {
  const wMatch = svg.match(/\bwidth="([\d.]+)/)
  const hMatch = svg.match(/\bheight="([\d.]+)/)
  const vbMatch = svg.match(/viewBox=["']([^"']+)["']/)
  if (vbMatch) {
    const parts = vbMatch[1].split(/[\s,]+/).map(Number)
    if (parts.length === 4) {
      return {
        width: Math.ceil(wMatch ? Number(wMatch[1]) : parts[2]),
        height: Math.ceil(hMatch ? Number(hMatch[1]) : parts[3]),
      }
    }
  }
  return {
    width: Math.ceil(Number(wMatch?.[1] || 120)),
    height: Math.ceil(Number(hMatch?.[1] || 40)),
  }
}

/** utf8 data URI */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

/** base64 data URI */
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

function isSvgContent(img?: string): boolean {
  const trimmed = img?.trim() || ''
  return trimmed.startsWith('<') || trimmed.startsWith('<?xml')
}

// #ifdef H5
function svgToPngDataUriH5(svg: string): Promise<string> {
  const { width, height } = parseSvgSize(svg)
  const url = svgToDataUri(svg)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas context unavailable'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('svg render failed'))
    img.src = url
  })
}
// #endif

// #ifdef MP-WEIXIN
function renderSvgOnWxCanvas(svg: string, dataUri: string): Promise<string> {
  const { width, height } = parseSvgSize(svg)
  const wxApi = (globalThis as any).wx

  if (!wxApi?.createOffscreenCanvas) {
    return Promise.reject(new Error('offscreen canvas unavailable'))
  }

  return new Promise((resolve, reject) => {
    const canvas = wxApi.createOffscreenCanvas({
      type: '2d',
      width,
      height,
    })
    const ctx = canvas.getContext('2d')
    const img = canvas.createImage()

    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      wxApi.canvasToTempFilePath({
        canvas,
        width,
        height,
        destWidth: width,
        destHeight: height,
        fileType: 'png',
        success: (res: { tempFilePath: string }) => resolve(res.tempFilePath),
        fail: (err: unknown) => reject(err),
      })
    }
    img.onerror = (err: unknown) => reject(err)
    img.src = dataUri
  })
}

function svgToPngTempPathWx(svg: string): Promise<string> {
  return renderSvgOnWxCanvas(svg, svgToBase64DataUri(svg))
    .catch(() => renderSvgOnWxCanvas(svg, svgToDataUri(svg)))
}
// #endif

/**
 * 将验证码 SVG / base64 转为 image 组件可展示的地址
 */
export function persistCaptchaSvg(svg: string): Promise<string> {
  const trimmed = svg.trim()
  if (!trimmed) {
    return Promise.resolve('')
  }

  if (!isSvgContent(trimmed)) {
    return Promise.resolve(`data:image/png;base64,${trimmed}`)
  }

  // #ifdef H5
  return svgToPngDataUriH5(trimmed)
  // #endif

  // #ifdef MP-WEIXIN
  return svgToPngTempPathWx(trimmed)
  // #endif

  // #ifndef H5
  // #ifndef MP-WEIXIN
  return Promise.resolve(svgToBase64DataUri(trimmed))
  // #endif
  // #endif
}

/**
 * 规范化验证码图片地址（兜底）
 */
export function normalizeCaptchaSrc(img?: string): string {
  if (!img) {
    return ''
  }
  if (img.startsWith('data:') || img.startsWith('wxfile://') || img.startsWith('http')) {
    return img
  }
  const trimmed = img.trim()
  if (isSvgContent(trimmed)) {
    return svgToDataUri(trimmed)
  }
  return `data:image/png;base64,${trimmed}`
}
