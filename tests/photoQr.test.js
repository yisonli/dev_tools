import test from 'node:test'
import assert from 'node:assert/strict'
import { cropRect, createMasks, manualProfile, loadPhoto, PHOTO_LIMIT, QUIET_MODULES } from '../src/utils/photoQr.js'

test('cropping stays within image dimensions while zooming and panning', () => {
  const photo = { width: 800, height: 1200 }
  assert.deepEqual(cropRect(photo, 1, { x: .5, y: .5 }), { x: 0, y: 200, side: 800 })
  assert.deepEqual(cropRect(photo, 2, { x: 1, y: 0 }), { x: 400, y: 0, side: 400 })
  assert.deepEqual(cropRect(photo, 2, { x: -1, y: 2 }), { x: 0, y: 800, side: 400 })
})

test('photo QR candidates use high correction and preserve function modules', () => {
  const candidates = createMasks('https://example.org/portrait', 1024)
  assert.equal(candidates.length, 8)
  const count = candidates[0].modules.size
  assert.ok(1024 / (count + QUIET_MODULES * 2) >= 6)
  for (const candidate of candidates) {
    assert.equal(candidate.errorCorrectionLevel.bit, 2)
    assert.equal(candidate.modules.size, count)
    assert.ok(candidate.modules.reservedBit.some(Boolean))
  }
  assert.throws(() => createMasks('x'.repeat(3200), 1536), /内容过长/)
  assert.throws(() => createMasks('https://example.org', 100), /格子过密/)
})

test('photo contrast and module sizes follow only the user-selected values', () => {
  const profile = manualProfile(40, .4, .85)
  assert.equal(profile.stamp, .4)
  assert.equal(profile.markerStamp, .85)
  assert.ok(profile.weight > manualProfile(0, .4, .85).weight)
  assert.ok(profile.weight < manualProfile(100, .4, .85).weight)
})

test('photo validation rejects unsupported files and oversized images', async () => {
  await assert.rejects(loadPhoto({ type: 'text/plain', size: 10 }), /JPEG/)
  await assert.rejects(loadPhoto({ type: 'image/png', size: PHOTO_LIMIT + 1 }), /10 MB/)
  const original = globalThis.createImageBitmap
  let closed = false
  globalThis.createImageBitmap = async () => ({ width: 5000, height: 5000, close() { closed = true } })
  try {
    await assert.rejects(loadPhoto({ type: 'image/png', size: 100 }), /2400 万/)
    assert.equal(closed, true)
  } finally { globalThis.createImageBitmap = original }
})
