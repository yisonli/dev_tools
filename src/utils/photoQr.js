import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

export const PHOTO_LIMIT = 10 * 1024 * 1024
export const PIXEL_LIMIT = 24_000_000
export const QUIET_MODULES = 4
const MIN_MODULE_PIXELS = 6
const CANCELLED = '已取消过期的二维码校验。'

export async function loadPhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('请选择 JPEG、PNG 或 WebP 图片。')
  }
  if (file.size > PHOTO_LIMIT) throw new Error('图片不能超过 10 MB。')

  let source
  let dispose
  if (typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(file, { imageOrientation: 'from-image' })
      dispose = () => source.close()
    } catch { /* Use the image element fallback below. */ }
  }
  if (!source) {
    const url = URL.createObjectURL(file)
    try {
      source = new Image()
      source.src = url
      await source.decode()
      dispose = () => URL.revokeObjectURL(url)
    } catch {
      URL.revokeObjectURL(url)
      throw new Error('无法读取这张图片，请换一张照片。')
    }
  }

  const width = source.width || source.naturalWidth
  const height = source.height || source.naturalHeight
  if (!width || !height || width * height > PIXEL_LIMIT) {
    dispose()
    throw new Error('图片像素不能超过 2400 万，请先缩小照片。')
  }
  return { source, width, height, dispose }
}

export function cropRect(photo, zoom, focus) {
  const side = Math.min(photo.width, photo.height) / Math.max(1, Math.min(3, zoom))
  return {
    x: (photo.width - side) * Math.max(0, Math.min(1, focus.x)),
    y: (photo.height - side) * Math.max(0, Math.min(1, focus.y)),
    side,
  }
}

export function drawCrop(canvas, photo, zoom, focus) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const crop = cropRect(photo, zoom, focus)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(photo.source, crop.x, crop.y, crop.side, crop.side, 0, 0, canvas.width, canvas.height)
  return crop
}

export function createMasks(content, width) {
  let masks
  try {
    masks = Array.from({ length: 8 }, (_, maskPattern) => QRCode.create(content, {
      errorCorrectionLevel: 'H', maskPattern,
    }))
  } catch {
    throw new Error('内容过长，无法生成高纠错二维码。请缩短内容或使用标准模式。')
  }
  const cells = masks[0].modules.size + QUIET_MODULES * 2
  if (width / cells < MIN_MODULE_PIXELS) {
    throw new Error(`当前内容的格子过密，请选择更大尺寸或缩短内容（每格至少 ${MIN_MODULE_PIXELS} 像素）。`)
  }
  return masks
}

const luminance = (data, offset) => data[offset] * .2126 + data[offset + 1] * .7152 + data[offset + 2] * .0722
const edge = (index, cells, width) => Math.round(index / cells * width)

function moduleBounds(row, col, count, width) {
  const cells = count + QUIET_MODULES * 2
  return {
    x0: edge(col + QUIET_MODULES, cells, width),
    x1: edge(col + QUIET_MODULES + 1, cells, width),
    y0: edge(row + QUIET_MODULES, cells, width),
    y1: edge(row + QUIET_MODULES + 1, cells, width),
  }
}

export function makePhotoBase(photo, zoom, focus, width, moduleCount) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = width
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const start = edge(QUIET_MODULES, moduleCount + 8, width)
  const end = edge(QUIET_MODULES + moduleCount, moduleCount + 8, width)
  const crop = cropRect(photo, zoom, focus)
  const sample = document.createElement('canvas')
  sample.width = sample.height = 8
  const sampleContext = sample.getContext('2d', { willReadFrequently: true })
  sampleContext.fillStyle = '#ffffff'
  sampleContext.fillRect(0, 0, 8, 8)
  sampleContext.drawImage(photo.source, crop.x, crop.y, crop.side, crop.side, 0, 0, 8, 8)
  const samplePixels = sampleContext.getImageData(0, 0, 8, 8).data
  const average = [0, 1, 2].map(channel => {
    let sum = 0
    for (let pixel = 0; pixel < 64; pixel++) sum += samplePixels[pixel * 4 + channel]
    return Math.round(sum / 64 * .12 + 255 * .88)
  })
  context.fillStyle = `rgb(${average.join(',')})`
  context.fillRect(0, 0, width, width)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(photo.source, crop.x, crop.y, crop.side, crop.side, start, start, end - start, end - start)
  return canvas
}

export function rankMasks(masks, base) {
  const pixels = base.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, base.width, base.height).data
  return masks.map(mask => {
    let cost = 0
    const { size, data, reservedBit } = mask.modules
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      const index = row * size + col
      if (reservedBit[index]) continue
      const bounds = moduleBounds(row, col, size, base.width)
      const x = Math.floor((bounds.x0 + bounds.x1) / 2)
      const y = Math.floor((bounds.y0 + bounds.y1) / 2)
      const value = luminance(pixels, (y * base.width + x) * 4)
      cost += data[index] ? Math.max(0, value - 45) : Math.max(0, 220 - value)
    }
    return { mask, cost }
  }).sort((a, b) => a.cost - b.cost).slice(0, 2).map(item => item.mask)
}

export function manualProfile(strength, stamp, markerStamp) {
  const value = Math.max(0, Math.min(100, strength))
  return {
    weight: .16 + value * .008,
    stamp: Math.max(.28, Math.min(.65, stamp)),
    markerStamp: Math.max(.75, Math.min(1, markerStamp)),
  }
}

export function renderPhotoQr(base, symbol, profile) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = base.width
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(base, 0, 0)
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = image.data
  const { size, data, reservedBit } = symbol.modules

  // Modulate the source pixel's luminance, keeping a share of its texture and
  // relative RGB channels inside both data and function modules.
  function adjustPixel(offset, dark, weight, opacity) {
    const current = luminance(pixels, offset)
    const reference = dark ? 45 : 220
    const next = dark ? Math.min(current, current + (reference - current) * weight)
      : Math.max(current, current + (reference - current) * weight)
    if (next === current) return
    const ratio = dark ? next / Math.max(1, current) : (next - current) / Math.max(1, 255 - current)
    for (let channel = 0; channel < 3; channel++) {
      const original = pixels[offset + channel]
      const adjusted = dark ? original * ratio : original + (255 - original) * ratio
      pixels[offset + channel] = original + (adjusted - original) * opacity
    }
  }

  const inFinder = (row, col) =>
    (row < 7 && (col < 7 || col >= size - 7)) || (row >= size - 7 && col < 7)
  const inCornerAlignment = (row, col) =>
    size >= 25 && row >= size - 9 && row < size - 4 && col >= size - 9 && col < size - 4
  const functionWeight = Math.max(.32, profile.weight + .07)

  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    if (inFinder(row, col) || inCornerAlignment(row, col)) continue
    const index = row * size + col
    const { x0, x1, y0, y1 } = moduleBounds(row, col, size, canvas.width)
    const functionModule = Boolean(reservedBit[index])
    if (functionModule) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        adjustPixel((y * canvas.width + x) * 4, Boolean(data[index]), functionWeight, 1)
      }
      continue
    }
    const stamp = profile.stamp
    const centerX = (x0 + x1) / 2, centerY = (y0 + y1) / 2
    const radiusX = (x1 - x0) * stamp / 2, radiusY = (y1 - y0) * stamp / 2
    const feather = Math.max(1, Math.min(x1 - x0, y1 - y0) * .11)
    for (let y = Math.max(y0, Math.ceil(centerY - radiusY)); y < Math.min(y1, Math.floor(centerY + radiusY)); y++) {
      for (let x = Math.max(x0, Math.ceil(centerX - radiusX)); x < Math.min(x1, Math.floor(centerX + radiusX)); x++) {
        const distance = Math.min(radiusX - Math.abs(x + .5 - centerX), radiusY - Math.abs(y + .5 - centerY))
        const opacity = Math.max(0, Math.min(1, distance / feather))
        if (!opacity) continue
        adjustPixel((y * canvas.width + x) * 4, Boolean(data[index]), profile.weight, opacity)
      }
    }
  }

  function drawFunctionBlock(firstRow, firstCol, count) {
    const start = moduleBounds(firstRow, firstCol, size, canvas.width)
    const end = moduleBounds(firstRow + count - 1, firstCol + count - 1, size, canvas.width)
    const centerX = (start.x0 + end.x1) / 2, centerY = (start.y0 + end.y1) / 2
    const halfX = (end.x1 - start.x0) * profile.markerStamp / 2
    const halfY = (end.y1 - start.y0) * profile.markerStamp / 2
    const cellX = (end.x1 - start.x0) / count, cellY = (end.y1 - start.y0) / count
    for (let y = Math.max(0, Math.ceil(centerY - halfY)); y < Math.min(canvas.height, Math.floor(centerY + halfY)); y++) {
      const originalY = (y + .5 - centerY) / profile.markerStamp + centerY
      const moduleRow = Math.max(0, Math.min(count - 1, Math.floor((originalY - start.y0) / cellY)))
      for (let x = Math.max(0, Math.ceil(centerX - halfX)); x < Math.min(canvas.width, Math.floor(centerX + halfX)); x++) {
        const originalX = (x + .5 - centerX) / profile.markerStamp + centerX
        const moduleCol = Math.max(0, Math.min(count - 1, Math.floor((originalX - start.x0) / cellX)))
        const index = (firstRow + moduleRow) * size + firstCol + moduleCol
        adjustPixel((y * canvas.width + x) * 4, Boolean(data[index]), functionWeight, 1)
      }
    }
  }

  // Finder and corner alignment patterns are continuous structures. Scale
  // the complete pattern around its center, leaving the source photo in the
  // outer area instead of punching holes in individual function modules.
  drawFunctionBlock(0, 0, 7)
  drawFunctionBlock(0, size - 7, 7)
  drawFunctionBlock(size - 7, 0, 7)
  if (size >= 25) drawFunctionBlock(size - 9, size - 9, 5)

  context.putImageData(image, 0, 0)
  return canvas
}

export function renderTonalQr(base, symbol, strength) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = base.width
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(base, 0, 0)
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = image.data
  const { size, data, reservedBit } = symbol.modules
  const amount = Math.max(0, Math.min(100, strength))
  const darkTarget = 155 - amount * .7
  const lightTarget = 100 + amount * .9
  const textureRetention = Math.max(.55, .98 - amount * .004)

  // This method tones a complete module from its photographic average. Every
  // pixel keeps its local texture; no center stamp or alpha-channel code is used.
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    const index = row * size + col
    const { x0, x1, y0, y1 } = moduleBounds(row, col, size, canvas.width)
    let sum = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      sum += luminance(pixels, (y * canvas.width + x) * 4)
    }
    const mean = sum / Math.max(1, (x1 - x0) * (y1 - y0))
    const dark = Boolean(data[index])
    const target = reservedBit[index]
      ? (dark ? Math.min(darkTarget, 80) : Math.max(lightTarget, 190))
      : (dark ? darkTarget : lightTarget)
    const adjustedMean = dark ? Math.min(mean, target) : Math.max(mean, target)
    const delta = adjustedMean - mean
    if (delta) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const offset = (y * canvas.width + x) * 4
        const current = luminance(pixels, offset)
        const desired = Math.max(0, Math.min(255, current + delta))
        const ratio = delta < 0 ? desired / Math.max(1, current) : (desired - current) / Math.max(1, 255 - current)
        for (let channel = 0; channel < 3; channel++) {
          const original = pixels[offset + channel]
          pixels[offset + channel] = delta < 0 ? original * ratio : original + (255 - original) * ratio
        }
      }
    }
    const meanColor = [0, 0, 0]
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const offset = (y * canvas.width + x) * 4
      for (let channel = 0; channel < 3; channel++) meanColor[channel] += pixels[offset + channel]
    }
    const count = Math.max(1, (x1 - x0) * (y1 - y0))
    for (let channel = 0; channel < 3; channel++) meanColor[channel] /= count
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const offset = (y * canvas.width + x) * 4
      for (let channel = 0; channel < 3; channel++) {
        pixels[offset + channel] = meanColor[channel] + (pixels[offset + channel] - meanColor[channel]) * textureRetention
      }
    }
  }

  context.putImageData(image, 0, 0)
  return canvas
}

export function canvasBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片导出失败。')), type, quality))
}

async function readsExact(image, content) {
  try {
    const result = await QrScanner.scanImage(image, { returnDetailedScanResult: true })
    return result.data === content
  } catch { return false }
}

export async function verifyCandidate(canvas, content, isCurrent = () => true) {
  const png = await canvasBlob(canvas)
  if (!isCurrent()) throw new Error(CANCELLED)
  if (!await readsExact(png, content)) return null
  if (!isCurrent()) throw new Error(CANCELLED)

  const smaller = document.createElement('canvas')
  smaller.width = smaller.height = Math.round(canvas.width * .75)
  const context = smaller.getContext('2d')
  context.imageSmoothingQuality = 'high'
  context.drawImage(canvas, 0, 0, smaller.width, smaller.height)
  if (!await readsExact(await canvasBlob(smaller), content)) return null
  if (!isCurrent()) throw new Error(CANCELLED)
  if (!await readsExact(await canvasBlob(canvas, 'image/jpeg', .85), content)) return null
  if (!isCurrent()) throw new Error(CANCELLED)
  return png
}

export function isCancelled(error) { return error?.message === CANCELLED }
