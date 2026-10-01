import { test, expect } from '@playwright/test'
import QRCode from 'qrcode'

async function photoFile(page, scene = 'bright') {
  const base64 = await page.evaluate(scene => {
    const canvas = document.createElement('canvas')
    canvas.width = 820
    canvas.height = 1080
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, 820, 1080)
    if (scene === 'dark') {
      gradient.addColorStop(0, '#142335'); gradient.addColorStop(1, '#54647a')
    } else {
      gradient.addColorStop(0, '#aedbd8'); gradient.addColorStop(1, '#f6ddb2')
    }
    context.fillStyle = gradient; context.fillRect(0, 0, 820, 1080)
    if (scene === 'busy') {
      for (let i = 0; i < 150; i++) {
        context.fillStyle = `hsl(${i * 37 % 360} 38% ${30 + i * 7 % 60}%)`
        context.fillRect(i * 43 % 820, i * 97 % 1080, 35, 55)
      }
    }
    context.fillStyle = '#26364b'
    context.beginPath(); context.ellipse(410, 440, 230, 350, 0, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#b36f58'
    context.beginPath(); context.ellipse(410, 475, 171, 225, 0, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#e2a983'
    context.beginPath(); context.ellipse(410, 459, 165, 220, 0, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#26364b'
    context.beginPath(); context.ellipse(405, 288, 182, 99, -.14, 0, Math.PI * 2); context.fill()
    for (const x of [351, 465]) {
      context.fillStyle = '#fff'; context.beginPath(); context.ellipse(x, 441, 24, 15, 0, 0, Math.PI * 2); context.fill()
      context.fillStyle = '#26364b'; context.beginPath(); context.arc(x, 442, 8, 0, Math.PI * 2); context.fill()
    }
    context.fillStyle = '#8d4e47'
    context.beginPath(); context.ellipse(411, 563, 43, 11, 0, 0, Math.PI); context.fill()
    context.fillStyle = '#486d73'
    context.beginPath(); context.ellipse(410, 1080, 322, 285, 0, 0, Math.PI * 2); context.fill()
    return canvas.toDataURL('image/png').split(',')[1]
  }, scene)
  return { name: `${scene}-portrait.png`, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

async function sourceQrFile(content = 'https://weixin.qq.com/r/local-qr-example') {
  return { name: 'wechat-source.png', mimeType: 'image/png', buffer: await QRCode.toBuffer(content, { errorCorrectionLevel: 'H', margin: 4, width: 600 }) }
}

async function sourceQrScreenshotFile(page, content) {
  const source = await sourceQrFile(content)
  const base64 = await page.evaluate(async encoded => {
    const image = new Image()
    image.src = `data:image/png;base64,${encoded}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 600; canvas.height = 800
    const context = canvas.getContext('2d')
    context.fillStyle = '#f7f9f8'; context.fillRect(0, 0, 600, 800)
    context.drawImage(image, 60, 135, 480, 480)
    context.fillStyle = '#1f925c'; context.fillRect(280, 355, 40, 40)
    return canvas.toDataURL('image/png').split(',')[1]
  }, source.buffer.toString('base64'))
  return { name: 'wechat-screenshot.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

async function openPhotoMode(page, scene = 'bright') {
  await page.goto('./#/qrcode')
  await page.getByRole('button', { name: '图片融合', exact: true }).click()
  await page.getByLabel('上传照片').setInputFiles(await photoFile(page, scene))
}

async function waitForManualScan(page) {
  await page.waitForFunction(() => {
    const status = document.querySelector('.photo-status')
    return status?.classList.contains('passed') || status?.classList.contains('failed')
  }, null, { timeout: 45000 })
  if (await page.locator('.photo-status.failed').count()) {
    for (const [selector, value] of [['#photo-strength', 70], ['#photo-cell-size', .4], ['#photo-marker-size', 1]]) {
      await page.locator(selector).evaluate((input, next) => {
        input.value = String(next)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
    }
    await expect(page.locator('.photo-status.verifying')).toBeVisible()
  }
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 45000 })
}

async function decodeThroughPage(page, expected) {
  const encoded = await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL('image/png').split(',')[1])
  await page.locator('input[accept="image/*"]').setInputFiles({ name: 'standard.png', mimeType: 'image/png', buffer: Buffer.from(encoded, 'base64') })
  await page.getByRole('button', { name: '解析二维码', exact: true }).click()
  await expect(page.locator('textarea[readonly]')).toHaveValue(expected)
}

test('standard QR generation, options and image parser still work', async ({ page }) => {
  await page.goto('./#/qrcode')
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeEnabled()
  await page.getByRole('combobox', { name: '内容类型' }).selectOption('url')
  await page.getByPlaceholder('https://example.com').fill('https://example.org/standard')
  await page.getByRole('combobox', { name: '尺寸' }).selectOption('500')
  await page.getByRole('combobox', { name: '纠错级别' }).selectOption('H')
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeEnabled()
  await decodeThroughPage(page, 'https://example.org/standard')
})

test('all six content types remain editable and encode the expected payload', async ({ page }) => {
  const cases = [
    { type: 'text', expected: 'QR text', fill: async () => page.getByRole('textbox', { name: '文本内容' }).fill('QR text') },
    { type: 'url', expected: 'https://example.org/test', fill: async () => page.getByRole('textbox', { name: '网址URL' }).fill('https://example.org/test') },
    { type: 'wifi', expected: 'WIFI:T:WPA;S:Guest;P:secret123;;', fill: async () => { await page.getByRole('textbox', { name: 'WiFi名称(SSID)' }).fill('Guest'); await page.getByRole('textbox', { name: 'WiFi密码' }).fill('secret123') } },
    { type: 'contact', expected: 'BEGIN:VCARD\nVERSION:3.0\nFN:李明\nTEL:13800138000\nEMAIL:lee@example.org\nORG:Example\nEND:VCARD', fill: async () => { await page.getByRole('textbox', { name: '联系人姓名' }).fill('李明'); await page.getByRole('textbox', { name: '联系人电话' }).fill('13800138000'); await page.getByRole('textbox', { name: '联系人邮箱' }).fill('lee@example.org'); await page.getByRole('textbox', { name: '联系人组织' }).fill('Example') } },
    { type: 'sms', expected: 'sms:13800138000?body=你好', fill: async () => { await page.getByRole('textbox', { name: '手机号码' }).fill('13800138000'); await page.getByRole('textbox', { name: '短信内容' }).fill('你好') } },
    { type: 'email', expected: 'mailto:lee@example.org?subject=Hello', fill: async () => { await page.getByRole('textbox', { name: '邮箱地址' }).fill('lee@example.org'); await page.getByRole('textbox', { name: '邮件主题' }).fill('Hello') } },
  ]
  for (const item of cases) {
    await page.goto('./#/qrcode')
    await page.getByRole('combobox', { name: '内容类型' }).selectOption(item.type)
    await item.fill()
    await expect(page.getByRole('button', { name: '下载二维码' })).toBeEnabled()
    await decodeThroughPage(page, item.expected)
  }
})

test('image fusion defaults to its first effect and uses an imported QR locally in both effects', async ({ page }) => {
  test.setTimeout(60000)
  const content = 'https://weixin.qq.com/r/local-qr-example'
  const uploads = []
  page.on('request', request => { if (request.method() !== 'GET') uploads.push(request.url()) })
  await page.goto('./#/qrcode')
  await expect(page.getByRole('group', { name: '二维码外观' }).getByRole('button')).toHaveCount(2)
  await page.getByRole('button', { name: '图片融合', exact: true }).click()
  await expect(page.getByRole('button', { name: '柔光点阵' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('combobox', { name: '内容类型' }).selectOption('image')
  await page.getByLabel('上传本地二维码图片').setInputFiles(await sourceQrScreenshotFile(page, content))
  await expect(page.getByRole('textbox', { name: '识别内容' })).toHaveValue(content)
  await page.getByLabel('上传照片').setInputFiles(await photoFile(page))
  await waitForManualScan(page)
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '下载 PNG' }).click()])
  const chunks = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk)
  await page.locator('input[accept="image/*"]').setInputFiles({ name: 'fused.png', mimeType: 'image/png', buffer: Buffer.concat(chunks) })
  await page.getByRole('button', { name: '解析二维码', exact: true }).click()
  await expect(page.locator('textarea[readonly]').last()).toHaveValue(content)
  await page.getByRole('button', { name: '影调融合' }).click()
  await expect(page.getByRole('textbox', { name: '识别内容' })).toHaveValue(content)
  await expect(page.getByRole('button', { name: '下载 PNG' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '放大扫码' })).toBeVisible()
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/photo-qr-import-mobile.png', fullPage: true })
  await page.getByRole('button', { name: '标准', exact: true }).click()
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeEnabled()
  expect(uploads).toEqual([])
})

test('invalid or replaced local QR images cannot reuse an older fused result', async ({ page }) => {
  test.setTimeout(60000)
  await openPhotoMode(page)
  await page.getByRole('combobox', { name: '内容类型' }).selectOption('image')
  await page.getByLabel('上传本地二维码图片').setInputFiles(await sourceQrFile())
  await waitForManualScan(page)
  await page.getByLabel('上传本地二维码图片').setInputFiles(await photoFile(page))
  await expect(page.getByRole('alert')).toContainText('未识别到二维码')
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeDisabled()
  await expect(page.getByLabel('照片融合二维码预览')).toBeHidden()
  await page.getByLabel('上传本地二维码图片').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') })
  await expect(page.getByRole('alert')).toContainText('JPEG、PNG 或 WebP')
  await page.getByLabel('上传本地二维码图片').setInputFiles(await sourceQrFile('https://example.org/new'))
  await expect(page.getByRole('textbox', { name: '识别内容' })).toHaveValue('https://example.org/new')
  await page.reload()
  await page.getByRole('combobox', { name: '内容类型' }).selectOption('image')
  await expect(page.getByRole('textbox', { name: '识别内容' })).toHaveCount(0)
})

for (const scene of ['bright', 'dark', 'busy']) {
  test(`photo QR retains the local portrait and validates ${scene} image`, async ({ page }) => {
    test.setTimeout(60000)
    await openPhotoMode(page, scene)
    await waitForManualScan(page)
    const preview = page.getByLabel('照片融合二维码预览')
    await expect(preview).toBeVisible()
    const moduleCount = QRCode.create('欢迎使用二维码工具！', { errorCorrectionLevel: 'H' }).modules.size
    const samples = await preview.evaluate((canvas, count) => {
      const ctx = canvas.getContext('2d')
      const point = (row, col) => {
        const cell = canvas.width / (count + 8)
        return [...ctx.getImageData(Math.floor((col + 4.5) * cell), Math.floor((row + 4.5) * cell), 1, 1).data]
      }
      return {
        corner: [...ctx.getImageData(0, 0, 1, 1).data],
        face: [...ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data],
        finderDark: point(0, 0),
        finderLight: point(1, 1),
      }
    }, moduleCount)
    expect(samples.corner.slice(0, 3).every(channel => channel >= 210)).toBe(true)
    expect(samples.corner.slice(0, 3)).not.toEqual([255, 255, 255])
    expect(samples.face.slice(0, 3)).not.toEqual([255, 255, 255])
    expect(samples.finderDark.slice(0, 3)).not.toEqual([23, 32, 51])
    expect(samples.finderLight.slice(0, 3)).not.toEqual([247, 249, 251])
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '下载 PNG' }).click()])
    expect(download.suggestedFilename()).toBe('photo-qrcode.png')
    const stream = await download.createReadStream()
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const blob = Buffer.concat(chunks)
    expect(blob.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    await page.locator('input[accept="image/*"]').setInputFiles({ name: 'art.png', mimeType: 'image/png', buffer: blob })
    await page.getByRole('button', { name: '解析二维码', exact: true }).click()
    await expect(page.locator('textarea[readonly]')).toHaveValue('欢迎使用二维码工具！')
  })
}

test('invalid images and long content cannot leave a downloadable stale result', async ({ page }) => {
  await openPhotoMode(page)
  await waitForManualScan(page)
  await page.getByLabel('上传照片').setInputFiles({ name: 'not-image.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })
  await expect(page.getByRole('alert')).toContainText('JPEG、PNG 或 WebP')
  await page.getByLabel('上传照片').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('10 MB')
  await page.getByRole('textbox', { name: '文本内容' }).fill('x'.repeat(3200))
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('内容过长', { timeout: 15000 })
})

test('changing content and size invalidates earlier result; original preview preserves the crop', async ({ page }) => {
  await openPhotoMode(page)
  await waitForManualScan(page)
  await page.getByRole('button', { name: '原图' }).click()
  await expect(page.getByLabel('原始照片预览')).toBeVisible()
  await page.getByRole('button', { name: '成品' }).click()
  await page.getByRole('combobox', { name: '导出尺寸' }).selectOption('1536')
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeDisabled()
  await waitForManualScan(page)
  await page.getByRole('textbox', { name: '文本内容' }).fill('https://example.org/new-target')
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeDisabled()
  await waitForManualScan(page)
  await page.getByRole('button', { name: '标准', exact: true }).click()
  await expect(page.getByRole('button', { name: '下载二维码' })).toBeEnabled()
  await page.getByRole('button', { name: '图片融合', exact: true }).click()
  await waitForManualScan(page)
})

test('crop drag and zoom change the photo and require fresh validation', async ({ page }) => {
  await openPhotoMode(page)
  await waitForManualScan(page)
  const crop = page.getByLabel('照片裁剪预览，可拖动调整')
  const before = await crop.evaluate(canvas => canvas.toDataURL())
  await page.getByLabel('缩放').fill('2')
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeDisabled()
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)), null, { timeout: 45000 })
  expect(await crop.evaluate(canvas => canvas.toDataURL())).not.toBe(before)
  const rect = await crop.boundingBox()
  await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .5)
  await page.mouse.down()
  await page.mouse.move(rect.x + rect.width * .35, rect.y + rect.height * .4, { steps: 4 })
  await page.mouse.up()
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)), null, { timeout: 45000 })
  await page.getByText('精细定位').click()
  expect(Number(await page.locator('#photo-x').inputValue())).toBeGreaterThan(.5)
})

test('photo mode stays usable at desktop and mobile widths', async ({ page }) => {
  await openPhotoMode(page)
  await waitForManualScan(page)
  await page.screenshot({ path: 'test-results/photo-qr-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(250)
  await expect(page.getByLabel('照片融合二维码预览')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/photo-qr-mobile.png', fullPage: true })
})

test('WeChat screen preview enlarges a QR that is visible to the camera without downloading', async ({ page }) => {
  await page.goto('./#/qrcode')
  await page.getByRole('button', { name: '图片融合', exact: true }).click()
  await page.getByRole('button', { name: '影调融合' }).click()
  await page.getByLabel('上传照片').setInputFiles(await photoFile(page, 'bright'))
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  await expect(page.getByRole('button', { name: '下载试验 PNG' })).toHaveCount(0)
  const preview = page.getByLabel('微信扫码试验预览')
  const previewBounds = await preview.boundingBox()
  await page.getByRole('button', { name: '放大扫码' }).click()
  const dialog = page.getByRole('dialog', { name: '微信扫码大图' })
  await expect(dialog).toBeVisible()
  const screen = page.getByLabel('微信扫码大图画布')
  const screenBounds = await screen.boundingBox()
  expect(screenBounds.width).toBeGreaterThan(previewBounds.width)
  expect(await screen.evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, 1, 1).data].at(-1))).toBe(255)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('WeChat screen preview closes on edit and keeps photo-mode settings separate', async ({ page }) => {
  await page.goto('./#/qrcode')
  await page.getByRole('button', { name: '图片融合', exact: true }).click()
  await page.getByRole('button', { name: '影调融合' }).click()
  await page.getByLabel('上传照片').setInputFiles(await photoFile(page))
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  const tonalResult = await page.getByLabel('微信扫码试验预览').evaluate(canvas => canvas.toDataURL())
  await page.getByRole('button', { name: '放大扫码' }).click()
  await expect(page.getByRole('dialog', { name: '微信扫码大图' })).toBeVisible()
  await page.getByRole('button', { name: '关闭大图' }).click()
  await page.getByRole('textbox', { name: '文本内容' }).fill('a different target')
  await expect(page.getByRole('button', { name: '放大扫码' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  await page.getByRole('button', { name: '柔光点阵' }).click()
  await expect(page.getByRole('button', { name: '易扫描预设' })).toBeVisible()
  expect(await page.locator('#photo-strength').inputValue()).toBe('70')
  expect(await page.locator('#photo-cell-size').inputValue()).toBe('0.32')
  expect(await page.locator('#photo-marker-size').inputValue()).toBe('0.94')
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)))
  expect(await page.getByLabel('照片融合二维码预览').evaluate(canvas => canvas.toDataURL())).not.toBe(tonalResult)
  await page.getByRole('button', { name: '影调融合' }).click()
  expect(await page.locator('#photo-strength').inputValue()).toBe('90')
  await expect(page.locator('#photo-cell-size')).toHaveCount(0)
})

test('manual scan preset recovers the photo-first settings without enabling downloads in the wrong mode', async ({ page }) => {
  await openPhotoMode(page)
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)))
  await page.getByRole('button', { name: '易扫描预设' }).click()
  expect(await page.locator('#photo-strength').inputValue()).toBe('70')
  expect(await page.locator('#photo-cell-size').inputValue()).toBe('0.4')
  expect(await page.locator('#photo-marker-size').inputValue()).toBe('1')
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeEnabled()
  await page.getByRole('button', { name: '影调融合' }).click()
  await expect(page.getByRole('button', { name: '下载 PNG' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '放大扫码' })).toBeVisible()
})

test('finder scales as one continuous block and full size remains scannable', async ({ page }) => {
  await openPhotoMode(page, 'bright')
  await page.getByRole('button', { name: '易扫描预设' }).click()
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  await page.locator('#photo-marker-size').evaluate(input => {
    input.value = '0.95'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.locator('.photo-status.verifying')).toBeVisible()
  await page.waitForFunction(() => ['passed', 'failed'].some(state => document.querySelector('.photo-status')?.classList.contains(state)))
  const topEdgeLuminance = await page.getByLabel('照片融合二维码预览').evaluate((canvas, matrixSize) => {
    const context = canvas.getContext('2d'), cell = canvas.width / (matrixSize + 8)
    const y = Math.floor((4 + .5) * cell)
    return Array.from({ length: 6 }, (_, index) => {
      const x = Math.round((4 + matrixSize - 7 + index + 1) * cell)
      const pixel = context.getImageData(x, y, 1, 1).data
      return pixel[0] * .2126 + pixel[1] * .7152 + pixel[2] * .0722
    })
  }, QRCode.create('欢迎使用二维码工具！', { errorCorrectionLevel: 'H' }).modules.size)
  expect(Math.max(...topEdgeLuminance)).toBeLessThan(145)
  await page.locator('#photo-marker-size').evaluate(input => {
    input.value = '1'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.locator('.photo-status.verifying')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('本地扫码校验通过', { timeout: 15000 })
  await expect(page.getByRole('button', { name: '下载 PNG' })).toBeEnabled()
})
