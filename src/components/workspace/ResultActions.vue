<template>
  <button class="icon-button" :disabled="!fresh" @click="copyText(session.output)">复制</button>
  <button class="icon-button" :disabled="!fresh" @click="downloadText(session.output, session.extension)">下载</button>
  <select aria-label="发送结果到工具" class="transfer-select" :disabled="!fresh" :value="''" @change="choose($event)">
    <option value="" disabled>发送到…</option>
    <option v-for="target in targets" :key="target.value" :value="target.value">{{ target.label }}</option>
  </select>
  <dialog ref="dialog" class="workspace-dialog" @cancel="pending = null">
    <h2>保留已有草稿？</h2><p>目标工具已有内容。替换后可以在目标工具点击“恢复”找回旧稿。</p>
    <div><button class="btn btn-secondary" @click="close">保留旧稿，取消</button><button class="btn btn-primary" @click="transfer">替换并打开</button></div>
  </dialog>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, replaceInput, isFresh } from '../../composables/useToolSession.js'
import { copyText, downloadText, notify } from '../../utils/clipboard.js'
import { checkSize } from '../../utils/json.js'
const props = defineProps({ session: Object, kind: String })
const router = useRouter(), dialog = ref(null), pending = ref(null)
const fresh = computed(() => isFresh(props.session))
const targets = computed(() => [
  { key: 'json', value: 'json', path: '/json', label: 'JSON' },
  { key: 'yaml', value: 'yaml', path: '/yaml', label: 'YAML' },
  { key: 'base64:encode', value: 'base64:encode', path: '/base64', label: 'Base64 编码' },
  { key: 'text', value: 'text', path: '/text', label: '文本处理' },
  { key: 'diff', value: 'diff', path: '/diff', label: '差异对比 · 左侧', field: 'input' },
  { key: 'diff', value: 'diff:right', path: '/diff', label: '差异对比 · 右侧', field: 'right' },
].filter(t => t.key !== props.kind))
function close() { dialog.value.close(); pending.value = null }
function choose(event) {
  const target = targets.value.find(t => t.value === event.target.value)
  event.target.value = ''
  if (!target || !fresh.value) return
  try { checkSize(props.session.output, (target.key === 'diff' ? 1 : 5) * 1024 * 1024) }
  catch (error) { notify(error.message, 'error'); return }
  pending.value = { ...target, text: props.session.output }
  const session = getSession(target.key)
  if (target.field === 'right' ? session.options.right : session.input) dialog.value.showModal()
  else transfer()
}
function transfer() {
  if (!pending.value) return
  const target = pending.value
  replaceInput(getSession(target.key), target.text, target.field)
  if (target.key === 'base64:encode') getSession('base64').options.mode = 'encode'
  close()
  router.push({ path: target.path, query: target.key === 'diff' ? { side: target.field === 'right' ? 'right' : 'left' } : {} })
  notify('结果已填入目标工具，可以继续处理。')
}
</script>
