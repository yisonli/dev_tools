<template>
  <section class="photo-qr-panel" :class="{ 'is-screen-test': effect === 'hidden' }" aria-label="图片融合二维码">
    <div class="photo-effect-bar">
      <span>融合效果</span>
      <div class="photo-effect-switch" role="group" aria-label="融合效果">
        <button type="button" :aria-pressed="effect === 'photo'" @click="setEffect('photo')">柔光点阵</button>
        <button type="button" :aria-pressed="effect === 'hidden'" @click="setEffect('hidden')">影调融合</button>
      </div>
    </div>
    <div class="photo-controls">
      <div class="photo-controls-header">
        <h3>照片</h3>
        <button type="button" class="btn btn-secondary photo-upload-button" @click="fileInput?.click()"><ImagePlus :size="17" />{{ photo ? '更换照片' : '选择照片' }}</button>
        <input ref="fileInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="上传照片" @change="onFileChange" />
      </div>
      <div v-if="fileError" class="notice error" role="alert">{{ fileError }}</div>
      <div v-if="photo" class="photo-crop-wrap">
        <canvas ref="cropCanvas" width="512" height="512" class="photo-crop-canvas" tabindex="0" aria-label="照片裁剪预览，可拖动调整" @pointerdown="startDrag" @pointermove="drag" @pointerup="endDrag" @pointercancel="endDrag" />
        <label class="photo-range-label" for="photo-zoom">缩放 <span>{{ zoom.toFixed(1) }}×</span></label>
        <input id="photo-zoom" v-model.number="zoom" type="range" min="1" max="3" step="0.1" @input="onCropChange" />
        <details class="photo-position"><summary>精细定位</summary>
          <label for="photo-x">水平位置</label><input id="photo-x" v-model.number="focus.x" type="range" min="0" max="1" step="0.01" @input="onCropChange" />
          <label for="photo-y">垂直位置</label><input id="photo-y" v-model.number="focus.y" type="range" min="0" max="1" step="0.01" @input="onCropChange" />
        </details>
      </div>
      <div v-else class="photo-empty"><ImagePlus :size="28" aria-hidden="true" /><span>选择照片后预览二维码</span></div>
      <div class="photo-settings">
        <label class="photo-range-label" for="photo-strength">{{ effect === 'hidden' ? '纹理明暗强度' : '格子对比度' }} <span>{{ strength }}%</span></label>
        <input id="photo-strength" v-model.number="strength" type="range" min="0" max="100" step="5" @input="queueGeneration" />
        <template v-if="effect === 'photo'">
          <label class="photo-range-label" for="photo-cell-size">格子大小 <span>{{ Math.round(stamp * 100) }}%</span></label>
          <input id="photo-cell-size" v-model.number="stamp" type="range" min="0.28" max="0.65" step="0.01" @input="queueGeneration" />
          <label class="photo-range-label" for="photo-marker-size">定位图形大小 <span>{{ Math.round(markerStamp * 100) }}%</span></label>
          <input id="photo-marker-size" v-model.number="markerStamp" type="range" min="0.75" max="1" step="0.01" @input="queueGeneration" />
        </template>
        <button v-if="effect === 'photo'" type="button" class="btn btn-secondary photo-preset" :disabled="!photo" @click="applyScanPreset"><ScanLine :size="17" />易扫描预设</button>
        <label for="photo-size">导出尺寸</label>
        <select id="photo-size" v-model.number="size" class="input-field" @change="onSizeChange"><option :value="1024">1024 × 1024 PNG</option><option :value="1536">1536 × 1536 PNG</option></select>
      </div>
    </div>

    <div class="photo-result">
      <div class="photo-result-heading"><h3>{{ effect === 'hidden' ? '影调融合试验图' : '柔光点阵成品' }}</h3><div class="photo-view-switch" role="group" aria-label="预览模式"><button type="button" :aria-pressed="showOriginal" :disabled="!photo" @click="showOriginal = true">原图</button><button type="button" :aria-pressed="!showOriginal" :disabled="!photo" @click="showOriginal = false">成品</button></div></div>
      <div class="photo-result-frame">
        <canvas ref="resultCanvas" :width="size" :height="size" :class="{ 'is-hidden': showOriginal || !photo || !previewed }" :aria-label="effect === 'hidden' ? '微信扫码试验预览' : '照片融合二维码预览'" />
        <canvas ref="originalCanvas" :width="size" :height="size" :class="{ 'is-hidden': !showOriginal || !photo }" aria-label="原始照片预览" />
        <div v-if="!photo || (!content && !showOriginal) || (!previewed && status === 'verifying' && !showOriginal)" class="photo-result-empty">{{ !photo ? '上传照片后显示成品' : !content ? '选择内容后显示成品' : '正在生成…' }}</div>
      </div>
      <div class="photo-result-footer">
        <span class="photo-status" :class="status" role="status" aria-live="polite">{{ statusText[status] }}</span>
        <button v-if="effect === 'hidden'" type="button" class="btn btn-primary photo-download" :disabled="!previewed" @click="openScreen"><ScanLine :size="17" />放大扫码</button>
        <button v-else type="button" class="btn btn-primary photo-download" :disabled="status !== 'passed' || !artBlob" @click="downloadArt"><Download :size="17" />下载 PNG</button>
      </div>
      <p v-if="effect === 'hidden'" class="photo-experiment-note">试验图按照片纹理调整整个格子的明暗。放大后可用微信实测；未通过本地识别时结果仍不确定。</p>
      <p v-if="validationError" class="photo-validation-error" role="alert">{{ validationError }}</p>
    </div>
    <dialog ref="screenDialog" class="photo-screen-dialog" aria-label="微信扫码大图">
      <div class="photo-screen-header"><span>微信扫码预览</span><button type="button" class="icon-button" aria-label="关闭大图" @click="screenDialog.close()"><X :size="20" /></button></div>
      <canvas ref="screenCanvas" :width="size" :height="size" aria-label="微信扫码大图画布" />
      <p>{{ status === 'passed' ? '浏览器已识别，请用微信实测。' : '浏览器尚未识别，可用微信试扫或调整左侧参数。' }}</p>
    </dialog>
  </section>
</template>

<script setup>
import { ref, shallowRef, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { ImagePlus, Download, ScanLine, X } from '@lucide/vue'
import { loadPhoto, cropRect, drawCrop, createMasks, makePhotoBase, rankMasks, manualProfile, renderPhotoQr, renderTonalQr, verifyCandidate, isCancelled } from '../../utils/photoQr.js'

const props = defineProps({ content: { type: String, default: '' }, active: Boolean })
const fileInput = ref(null), cropCanvas = ref(null), resultCanvas = ref(null), originalCanvas = ref(null), screenCanvas = ref(null), screenDialog = ref(null)
const photo = shallowRef(null), artBlob = shallowRef(null), fileError = ref(''), validationError = ref('')
const zoom = ref(1), focus = ref({ x: .5, y: .5 }), size = ref(1024)
const effect = ref('photo')
const preferences = { photo: ref({ strength: 70, stamp: .32, markerStamp: .94 }), hidden: ref({ strength: 90, stamp: .32, markerStamp: .94 }) }
const setting = key => computed({ get: () => preferences[effect.value].value[key], set: value => { preferences[effect.value].value[key] = value } })
const strength = setting('strength'), stamp = setting('stamp'), markerStamp = setting('markerStamp')
const status = ref('idle'), showOriginal = ref(false)
const previewed = ref(false)
const statusText = { idle: '等待照片和内容', loading: '正在读取照片…', verifying: '正在校验扫码…', passed: '本地扫码校验通过', failed: '未通过扫码校验' }
let sequence = 0, fileSequence = 0, timer, pointer = null, validatedContent = ''

function invalidate() {
  sequence++
  clearTimeout(timer)
  if (screenDialog.value?.open) screenDialog.value.close()
  artBlob.value = null
  previewed.value = false
  validatedContent = ''
  validationError.value = ''
  status.value = photo.value && props.active && props.content ? 'verifying' : 'idle'
  return sequence
}

function showCrop() {
  if (!photo.value || !cropCanvas.value) return
  drawCrop(cropCanvas.value, photo.value, zoom.value, focus.value)
  if (originalCanvas.value) drawCrop(originalCanvas.value, photo.value, zoom.value, focus.value)
}

function queueGeneration() {
  const current = invalidate()
  fileError.value = ''
  showCrop()
  if (!photo.value || !props.active || !props.content) return
  timer = setTimeout(() => generate(current), 320)
}

async function generate(current) {
  const isCurrent = () => current === sequence && props.active
  if (!isCurrent() || !photo.value) return
  try {
    const masks = createMasks(props.content, size.value)
    const base = makePhotoBase(photo.value, zoom.value, focus.value, size.value, masks[0].modules.size)
    const ranked = rankMasks(masks, base)
    const started = performance.now()
    const profile = effect.value === 'photo' ? manualProfile(strength.value, stamp.value, markerStamp.value) : null
    for (const mask of ranked) {
      if (!isCurrent()) return
      if (performance.now() - started > 18000) throw new Error('校验耗时过长，请缩短内容或换用更清晰的照片。')
      const art = effect.value === 'hidden' ? renderTonalQr(base, mask, strength.value) : renderPhotoQr(base, mask, profile)
      if (!previewed.value) {
        resultCanvas.value.getContext('2d').drawImage(art, 0, 0)
        previewed.value = true
      }
      const blob = await verifyCandidate(art, props.content, isCurrent)
      if (blob && isCurrent()) {
        resultCanvas.value.getContext('2d').drawImage(art, 0, 0)
        artBlob.value = blob
        validatedContent = props.content
        status.value = 'passed'
        return
      }
    }
    if (isCurrent()) throw new Error(effect.value === 'hidden' ? '浏览器未识别当前效果，可打开大图用微信试扫，或调高纹理明暗强度。' : '当前参数未通过识别，可点击“易扫描预设”、缩短内容或调整裁剪。')
  } catch (error) {
    if (isCurrent() && !isCancelled(error)) {
      status.value = 'failed'
      validationError.value = error.message || '生成失败，请更换照片或调整内容。'
    }
  }
}

async function onFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const currentFile = ++fileSequence
  invalidate()
  fileError.value = ''
  status.value = 'loading'
  try {
    const loaded = await loadPhoto(file)
    if (currentFile !== fileSequence) { loaded.dispose(); return }
    photo.value?.dispose()
    photo.value = loaded
    zoom.value = 1
    focus.value = { x: .5, y: .5 }
    showOriginal.value = false
    await nextTick()
    queueGeneration()
  } catch (error) {
    if (currentFile === fileSequence) {
      fileError.value = error.message || '读取照片失败。'
      status.value = photo.value ? 'idle' : 'failed'
    }
  }
}

function onCropChange() { showCrop(); queueGeneration() }
function onSizeChange() { queueGeneration(); nextTick(showCrop) }
function setEffect(next) {
  if (effect.value === next) return
  effect.value = next
  queueGeneration()
}
function startDrag(event) {
  if (!photo.value) return
  event.preventDefault()
  cropCanvas.value.setPointerCapture(event.pointerId)
  pointer = { x: event.clientX, y: event.clientY, focus: { ...focus.value } }
}
function drag(event) {
  if (!pointer || !photo.value) return
  const rect = cropCanvas.value.getBoundingClientRect()
  const crop = cropRect(photo.value, zoom.value, focus.value)
  const spanX = photo.value.width - crop.side, spanY = photo.value.height - crop.side
  focus.value = {
    x: spanX ? Math.max(0, Math.min(1, pointer.focus.x - (event.clientX - pointer.x) * crop.side / rect.width / spanX)) : .5,
    y: spanY ? Math.max(0, Math.min(1, pointer.focus.y - (event.clientY - pointer.y) * crop.side / rect.height / spanY)) : .5,
  }
  onCropChange()
}
function endDrag(event) {
  if (pointer && cropCanvas.value?.hasPointerCapture(event.pointerId)) cropCanvas.value.releasePointerCapture(event.pointerId)
  pointer = null
}

function applyScanPreset() {
  preferences.photo.value = { strength: 70, stamp: .4, markerStamp: 1 }
  queueGeneration()
}

function openScreen() {
  if (effect.value !== 'hidden' || !previewed.value) return
  screenCanvas.value.getContext('2d').drawImage(resultCanvas.value, 0, 0)
  screenDialog.value.showModal()
}

function downloadArt() {
  if (effect.value !== 'photo' || status.value !== 'passed' || !artBlob.value || validatedContent !== props.content) return
  const url = URL.createObjectURL(artBlob.value)
  const link = document.createElement('a')
  link.href = url
  link.download = 'photo-qrcode.png'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

watch(() => [props.content, props.active], queueGeneration)
onBeforeUnmount(() => { invalidate(); fileSequence++; photo.value?.dispose() })
</script>

<style scoped>
.photo-qr-panel { display: grid; grid-template-columns: minmax(250px, 360px) minmax(0, 1fr); gap: 24px; margin-top: 20px; }
.photo-qr-panel.is-screen-test { grid-template-columns: minmax(240px, 280px) minmax(0, 1fr); }
.photo-effect-bar { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; grid-column: 1 / -1; justify-content: space-between; }
.photo-effect-bar > span { color: #475569; font-size: 13px; font-weight: 600; }
.photo-effect-switch { background: #e8edf5; border-radius: 6px; display: inline-flex; padding: 3px; }
.photo-effect-switch button { border-radius: 4px; color: #52627a; font-size: 13px; min-width: 106px; padding: 7px 11px; }
.photo-effect-switch button[aria-pressed="true"] { background: white; color: #1d4ed8; }
.photo-controls, .photo-result { min-width: 0; }
.photo-controls-header, .photo-result-heading, .photo-result-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.photo-controls h3, .photo-result h3 { color: #27354a; font-size: 15px; font-weight: 650; margin: 0; }
.photo-upload-button, .photo-download, .photo-preset { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; }
.photo-preset { margin-top: 12px; }
.photo-crop-wrap { margin-top: 14px; }
.photo-crop-canvas { aspect-ratio: 1; background: white; border: 1px solid #dbe2ec; border-radius: 6px; cursor: grab; display: block; max-width: 100%; touch-action: none; width: 100%; }
.photo-crop-canvas:active { cursor: grabbing; }
.photo-crop-canvas:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.photo-empty, .photo-result-empty { align-items: center; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; display: flex; flex-direction: column; gap: 10px; justify-content: center; min-height: 180px; padding: 18px; text-align: center; }
.photo-empty { margin-top: 14px; }
.photo-settings { display: grid; gap: 6px; margin-top: 16px; }
.photo-settings label, .photo-position label { color: #475569; font-size: 13px; }
.photo-range-label { display: flex; justify-content: space-between; margin-top: 14px; }
input[type="range"] { accent-color: #2563eb; width: 100%; }
.photo-position { border-top: 1px solid #e7ecf3; margin-top: 16px; padding-top: 12px; }
.photo-position summary { color: #475569; cursor: pointer; font-size: 13px; }
.photo-position label { display: block; margin-top: 12px; }
.photo-view-switch { background: #e8edf5; border-radius: 6px; display: inline-flex; padding: 3px; }
.photo-view-switch button { border-radius: 4px; color: #52627a; font-size: 12px; padding: 5px 10px; }
.photo-view-switch [aria-pressed="true"] { background: white; color: #1d4ed8; }
.photo-result-frame { aspect-ratio: 1; margin: 14px auto 0; max-width: min(100%, 660px); position: relative; width: 100%; }
.is-screen-test .photo-result-frame { max-width: min(100%, 860px); }
.photo-result-frame canvas { border: 1px solid #dbe2ec; border-radius: 6px; display: block; height: 100%; object-fit: contain; width: 100%; }
.photo-result-frame canvas.is-hidden { display: none; }
.photo-result-empty { background: #f8fafc; height: 100%; inset: 0; position: absolute; }
.photo-result-footer { flex-wrap: wrap; margin-top: 14px; }
.photo-status { color: #64748b; font-size: 13px; }
.photo-status.passed { color: #15803d; }.photo-status.failed { color: #b91c1c; }
.photo-validation-error { color: #b91c1c; font-size: 13px; line-height: 1.5; margin-top: 10px; }
.photo-experiment-note { color: #92400e; }
.photo-experiment-note { font-size: 12px; line-height: 1.6; margin: 10px 0 0; }
.photo-screen-dialog { background: white; border: 0; color: #334155; height: 100dvh; max-height: 100dvh; max-width: 100vw; padding: 12px; width: 100vw; }
.photo-screen-dialog::backdrop { background: #0f172a; }
.photo-screen-header { align-items: center; display: flex; font-size: 14px; font-weight: 650; justify-content: space-between; margin: 0 auto 8px; max-width: 1200px; }
.photo-screen-dialog canvas { aspect-ratio: 1; display: block; height: auto; margin: auto; max-height: calc(100dvh - 105px); max-width: calc(100vw - 24px); width: min(calc(100vw - 24px), calc(100dvh - 105px), 1200px); }
.photo-screen-dialog p { font-size: 12px; margin: 8px auto 0; max-width: 1200px; text-align: center; }
@media (max-width: 960px) { .photo-qr-panel, .photo-qr-panel.is-screen-test { grid-template-columns: 1fr; } .photo-crop-canvas { max-width: 420px; } }
</style>
