/**
 * 流式 UTF-8 解码器
 * 微信小程序运行时没有全局 TextDecoder，且分块数据可能在多字节字符中间被截断，
 * 因此需要手动按字节解码，并缓存不完整的尾部字节到下一块。
 */
export class Utf8StreamDecoder {
  private pending: number[] = []

  decode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const all = this.pending.length ? this.pending.concat(Array.from(bytes)) : Array.from(bytes)

    let i = 0
    const len = all.length
    let out = ''

    while (i < len) {
      const b0 = all[i]
      let seqLen = 1
      if (b0 >= 0xF0)
        seqLen = 4
      else if (b0 >= 0xE0)
        seqLen = 3
      else if (b0 >= 0xC0)
        seqLen = 2

      // 不完整的多字节序列，留到下一块
      if (i + seqLen > len)
        break

      if (seqLen === 1) {
        out += String.fromCharCode(b0)
      }
      else if (seqLen === 2) {
        const cp = ((b0 & 0x1F) << 6) | (all[i + 1] & 0x3F)
        out += String.fromCharCode(cp)
      }
      else if (seqLen === 3) {
        const cp = ((b0 & 0x0F) << 12) | ((all[i + 1] & 0x3F) << 6) | (all[i + 2] & 0x3F)
        out += String.fromCharCode(cp)
      }
      else {
        const cp = ((b0 & 0x07) << 18) | ((all[i + 1] & 0x3F) << 12) | ((all[i + 2] & 0x3F) << 6) | (all[i + 3] & 0x3F)
        out += String.fromCodePoint(cp)
      }

      i += seqLen
    }

    this.pending = i < len ? all.slice(i) : []
    return out
  }
}

/** 优先使用原生 TextDecoder（H5/App），不可用时回退手动解码（小程序） */
export function createUtf8Decoder(): { decode: (buffer: ArrayBuffer) => string } {
  if (typeof TextDecoder !== 'undefined') {
    const native = new TextDecoder('utf-8')
    return {
      decode: (buffer: ArrayBuffer) => native.decode(buffer, { stream: true }),
    }
  }
  return new Utf8StreamDecoder()
}
