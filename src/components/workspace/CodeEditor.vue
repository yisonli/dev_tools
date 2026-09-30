<template>
  <div class="code-editor" :class="{ 'is-readonly': readonly }">
    <div v-if="!hideToolbar" class="editor-options">
      <span>{{ readonly ? '只读' : '可编辑' }} · {{ language.toUpperCase() }}</span>
      <span><button type="button" @click="find">查找</button><button type="button" :aria-pressed="wrap" @click="wrap = !wrap">{{ wrap ? '取消换行' : '自动换行' }}</button></span>
    </div>
    <div ref="host" class="editor-host" />
    <div class="editor-position">{{ position }} <span>Ctrl/Cmd+F 查找 · Esc 后按 Tab 离开编辑区</span></div>
  </div>
</template>

<script>
// EditorState is immutable; retain undo and selection without retaining DOM views.
const editorStates = new Map()
</script>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorState, StateEffect, Compartment, Prec } from '@codemirror/state'
import { EditorView, keymap, placeholder as editorPlaceholder } from '@codemirror/view'
import { history, indentWithTab } from '@codemirror/commands'
import { openSearchPanel } from '@codemirror/search'
import { json } from '@codemirror/lang-json'
import { yaml } from '@codemirror/lang-yaml'
import { setDiagnostics, linter } from '@codemirror/lint'

const props = defineProps({ modelValue: { type: String, default: '' }, language: { type: String, default: 'text' }, readonly: Boolean, hideToolbar: Boolean, label: { type: String, default: '代码编辑区' }, editorKey: String, placeholder: { type: String, default: '粘贴内容，或导入文件…' }, errorOffset: { type: Number, default: null }, errorMessage: String })
const emit = defineEmits(['update:modelValue', 'run'])
const host = ref(null), wrap = ref(true), position = ref('第 1 行，第 1 列')
const languageConfig = new Compartment(), wrapping = new Compartment()
let view, lintJob
const languageExtension = () => props.language === 'json' ? json() : props.language === 'yaml' ? yaml() : []
function lintContent(editor) {
  lintJob?.cancel()
  const text = editor.state.doc.toString()
  if (!text.trim() || text.length > 100 * 1024 || new TextEncoder().encode(text).length > 100 * 1024 || !['json', 'yaml'].includes(props.language)) return []
  return new Promise(resolve => {
    let worker
    const finish = diagnostics => { clearTimeout(timer); worker?.terminate(); if (lintJob?.worker === worker) lintJob = null; resolve(diagnostics) }
    const timer = setTimeout(() => finish([]), 8000)
    try {
      worker = new Worker(new URL('../../workers/processor.js', import.meta.url), { type: 'module' })
      lintJob = { worker, cancel: () => finish([]) }
      worker.onmessage = ({ data }) => {
        const from = Math.min(data.offset ?? 0, text.length)
        finish(data.error ? [{ from, to: Math.min(from + 1, text.length), severity: 'error', message: data.error }] : [])
      }
      worker.onerror = () => finish([])
      worker.postMessage({ kind: props.language, action: 'check', input: text })
    } catch { finish([]) }
  })
}
function find() { openSearchPanel(view) }
function focusOffset(offset) {
  if (!view) return
  const pos = Math.max(0, Math.min(offset, view.state.doc.length))
  view.dispatch({ selection: { anchor: pos }, scrollIntoView: true }); view.focus()
}
defineExpose({ focusOffset, focus: () => view?.focus(), find, toggleWrap: () => { wrap.value = !wrap.value } })
onMounted(() => {
  const saved = props.editorKey && editorStates.get(props.editorKey)
  wrap.value = saved?.wrap ?? true
  const extensions = [basicSetup, languageConfig.of(languageExtension()), wrapping.of(wrap.value ? EditorView.lineWrapping : []),
    EditorState.phrases.of({ 'Find': '查找', 'Replace': '替换', 'next': '下一处', 'previous': '上一处', 'all': '全部', 'match case': '区分大小写', 'regexp': '正则', 'by word': '完整单词', 'replace': '替换', 'replace all': '替换全部', 'close': '关闭', 'No diagnostics': '没有语法问题' }),
    ...(props.readonly ? [] : [linter(lintContent, { delay: 500 })]),
    EditorState.readOnly.of(props.readonly), EditorView.editable.of(!props.readonly),
    EditorView.contentAttributes.of({ 'aria-label': props.label, 'aria-multiline': 'true' }), editorPlaceholder(props.placeholder),
    Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { emit('run'); return true } }])), keymap.of([indentWithTab]),
    EditorView.updateListener.of(update => {
      if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
      const head = update.state.selection.main.head, line = update.state.doc.lineAt(head)
      position.value = `第 ${line.number} 行，第 ${head - line.from + 1} 列 · ${update.state.doc.lines} 行`
    }),
    EditorView.theme({ '&': { height: '100%', fontSize: '14px' }, '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', lineHeight: '1.65' }, '.cm-content': { padding: '12px 0' }, '.cm-gutters': { backgroundColor: '#f8fafc', borderRight: '1px solid #edf0f5', color: '#94a3b8' }, '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#eff6ff88' } }),
  ]
  // Reconfigure retained history to the new component's callbacks and compartments.
  const retained = saved?.state.doc.toString() === props.modelValue
  const state = retained ? saved.state.update({ effects: StateEffect.reconfigure.of(extensions) }).state : EditorState.create({ doc: props.modelValue, extensions })
  view = new EditorView({ state, parent: host.value })
  // The upstream search panel commits on keyup/change. Also commit pasted
  // queries immediately, including context-menu paste and assistive input.
  view.dom.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement && event.target.closest('.cm-search')) event.target.dispatchEvent(new Event('change', { bubbles: true }))
  })
  if (retained) view.requestMeasure({ write: () => { view.scrollDOM.scrollTop = saved.scroll.top; view.scrollDOM.scrollLeft = saved.scroll.left } })
  const head = state.selection.main.head, line = state.doc.lineAt(head)
  position.value = `第 ${line.number} 行，第 ${head - line.from + 1} 列 · ${state.doc.lines} 行`
})
watch(() => props.modelValue, value => {
  if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
})
watch(() => props.language, () => view?.dispatch({ effects: languageConfig.reconfigure(languageExtension()) }))
watch(wrap, value => view?.dispatch({ effects: wrapping.reconfigure(value ? EditorView.lineWrapping : []) }))
watch(() => [props.errorOffset, props.errorMessage], () => {
  if (!view) return
  const from = Math.min(props.errorOffset ?? 0, view.state.doc.length)
  view.dispatch(setDiagnostics(view.state, props.errorOffset == null ? [] : [{ from, to: Math.min(from + 1, view.state.doc.length), severity: 'error', message: props.errorMessage || '语法错误' }]))
})
onBeforeUnmount(() => {
  lintJob?.cancel()
  if (props.editorKey && view) editorStates.set(props.editorKey, {
    // Retain text/history, not extensions closing over the unmounted component.
    state: view.state.update({ effects: StateEffect.reconfigure.of([history()]) }).state,
    wrap: wrap.value,
    scroll: { top: view.scrollDOM.scrollTop, left: view.scrollDOM.scrollLeft },
  })
  view?.destroy()
})
</script>
