<template>
  <section ref="root" class="tool-workspace" :class="{ 'is-focused': focused, 'is-narrow': narrow }" :role="focused ? 'dialog' : undefined" :aria-modal="focused || undefined" :aria-label="focused ? title : undefined" @keydown="focusKeys">
    <header class="workspace-header">
      <div><p class="eyebrow">{{ category }}</p><h1>{{ title }}</h1></div>
      <div class="workspace-layout-actions">
        <button class="icon-button" :aria-pressed="layout === 'stack'" @click="layout = layout === 'split' ? 'stack' : 'split'">{{ layout === 'split' ? '上下布局' : '左右布局' }}</button>
        <button class="icon-button" :aria-pressed="focused" @click="toggleFocus">{{ focused ? '退出专注' : '专注模式' }}</button>
      </div>
    </header>
    <div class="workspace-toolbar"><slot name="toolbar" /></div>
    <div class="workspace-tabs" role="tablist" aria-label="工作面板">
      <button role="tab" :tabindex="tab === 'input' ? 0 : -1" :aria-selected="tab === 'input'" :aria-controls="`${id}-input`" @keydown="tabKeys" @click="tab = 'input'">{{ inputTitle }}</button>
      <button role="tab" :tabindex="tab === 'output' ? 0 : -1" :aria-selected="tab === 'output'" :aria-controls="`${id}-output`" @keydown="tabKeys" @click="tab = 'output'">{{ outputTitle }}<span v-if="fresh"> · 已更新</span></button>
    </div>
    <div class="workspace-panels" :class="[layout, { 'panel-maximized': maximized }]" :style="{ '--split-ratio': ratio + '%' }">
      <section v-show="visible('input')" :id="`${id}-input`" class="workspace-pane">
        <div class="pane-heading"><h2>{{ inputTitle }}</h2><div class="pane-actions"><slot name="input-actions" /><button v-if="!narrow" class="icon-button" :aria-label="maximized === 'input' ? '还原输入区' : '放大输入区'" @click="maximize('input')">{{ maximized === 'input' ? '还原' : '放大' }}</button></div></div>
        <slot name="input" />
      </section>
      <div v-show="!narrow && !maximized && layout === 'split'" class="workspace-divider" role="separator" tabindex="0" aria-label="调整输入与结果宽度" aria-orientation="vertical" :aria-valuenow="Math.round(ratio)" :aria-valuemin="30" :aria-valuemax="70" @pointerdown="startDrag" @keydown.left.prevent="ratio = Math.max(30, ratio - 2)" @keydown.right.prevent="ratio = Math.min(70, ratio + 2)" />
      <section v-show="visible('output')" :id="`${id}-output`" class="workspace-pane">
        <div class="pane-heading"><h2>{{ outputTitle }}</h2><div class="pane-actions"><slot name="output-actions" /><button v-if="!narrow" class="icon-button" :aria-label="maximized === 'output' ? '还原结果区' : '放大结果区'" @click="maximize('output')">{{ maximized === 'output' ? '还原' : '放大' }}</button></div></div>
        <slot name="output" />
      </section>
    </div>
    <div class="workspace-status" role="status" aria-live="polite"><slot name="status" /></div>
    <div class="workspace-details"><slot /></div>
  </section>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ id: String, title: String, category: { type: String, default: '开发工作区' }, inputTitle: { type: String, default: '输入' }, outputTitle: { type: String, default: '处理结果' }, initialPane: { type: String, default: 'input' }, fresh: Boolean })
const root = ref(null), focused = ref(false), maximized = ref(''), narrow = ref(false), tab = ref(props.initialPane)
let saved = {}
try { const value = JSON.parse(localStorage.getItem('dev-tools-layout') || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) saved = value } catch { /* Preferences are optional. */ }
const layout = ref(saved.layout === 'stack' ? 'stack' : 'split'), ratio = ref(Math.min(70, Math.max(30, Number(saved.ratio) || 50)))
let observer, previousFocus
const visible = side => narrow.value ? tab.value === side : !maximized.value || maximized.value === side
function toggleFocus() { if (!focused.value) previousFocus = document.activeElement; focused.value = !focused.value; if (!focused.value) previousFocus?.focus() }
function exitFocus(event) { if (event.defaultPrevented) return; maximized.value = ''; if (focused.value) toggleFocus() }
function focusKeys(event) {
  if (event.key === 'Escape') { exitFocus(event); return }
  if (!focused.value || event.key !== 'Tab' || event.defaultPrevented) return
  const nodes = [...root.value.querySelectorAll('button,input,select,a,[tabindex="0"],textarea')].filter(n => n.getClientRects().length && !n.disabled)
  if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus() }
  else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus() }
}
function maximize(side) { maximized.value = maximized.value === side ? '' : side }
function showPane(side) { tab.value = side; if (maximized.value) maximized.value = side }
function showResult() { showPane('output') }
function showInput() { showPane('input') }
async function tabKeys(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  tab.value = event.key === 'Home' ? 'input' : event.key === 'End' ? 'output' : tab.value === 'input' ? 'output' : 'input'
  await nextTick()
  root.value?.querySelector(`.workspace-tabs [aria-controls="${props.id}-${tab.value}"]`)?.focus()
}
watch(() => props.initialPane, showPane)
defineExpose({ showResult, showInput })
watch([layout, ratio], () => { try { localStorage.setItem('dev-tools-layout', JSON.stringify({ layout: layout.value, ratio: ratio.value })) } catch { /* No persistence needed. */ } })
function drag(event) {
  const bounds = root.value.querySelector('.workspace-panels').getBoundingClientRect()
  ratio.value = Math.min(70, Math.max(30, (event.clientX - bounds.left) / bounds.width * 100))
}
function stopDrag() { window.removeEventListener('pointermove', drag); window.removeEventListener('pointerup', stopDrag); window.removeEventListener('pointercancel', stopDrag) }
function startDrag(event) { event.preventDefault(); window.addEventListener('pointermove', drag); window.addEventListener('pointerup', stopDrag); window.addEventListener('pointercancel', stopDrag) }
onMounted(() => { observer = new ResizeObserver(entries => { narrow.value = entries[0].contentRect.width < 760 }); observer.observe(root.value) })
onBeforeUnmount(() => { observer?.disconnect(); stopDrag() })
</script>
