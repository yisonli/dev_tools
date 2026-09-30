import { test, expect } from '@playwright/test'
const paths = ['base64','url','unicode','aes','des','rsa','sm2','hash','jwt','json','yaml','regex','text','qrcode','barcode','timestamp','password','uuid','diff']
for (const width of [1366, 390]) test(`all 19 tools load without runtime errors at ${width}px`, async ({ page }) => {
  test.setTimeout(90000)
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ width, height: width === 390 ? 844 : 768 })
  for (const path of paths) {
    await page.goto(`./#/${path}`)
    await expect(page.locator('main h1, main h2').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true)
  }
  expect(errors).toEqual([])
})
