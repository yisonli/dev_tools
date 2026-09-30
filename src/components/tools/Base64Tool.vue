<template>
  <ToolWorkspace ref="workspace" id="base64" title="Base64 工作区" category="编码" :fresh="fresh" :input-title="mode === 'encode' ? '原始文本' : 'Base64 文本'" :output-title="mode === 'encode' ? '编码结果' : '解码结果'">
    <template #toolbar>
      <div class="mode-switch" role="group" aria-label="Base64 模式"><button :aria-pressed="mode === 'encode'" @click="mode = 'encode'">编码</button><button :aria-pressed="mode === 'decode'" @click="mode = 'decode'">解码</button></div>
      <button class="btn btn-primary" :disabled="!session.input || session.status === 'running'" @click="run()">{{ mode === 'encode' ? '编码' : '解码' }}</button>
      <button class="btn btn-secondary" :disabled="!fresh" @click="reverse">结果用作反向输入</button>
      <label class="auto-option"><input v-model="session.options.auto" type="checkbox" />自动处理</label>
      <button v-if="session.status === 'running'" class="icon-button" @click="stopJob(session)">取消处理</button>
    </template>
    <template #input-actions><InputActions :session="session" :example="mode === 'encode' ? example : encodedExample" /></template>
    <template #input><CodeEditor :key="mode" ref="inputEditor" v-model="session.input" :editor-key="`base64:${mode}:input`" label="Base64 输入" @run="run()" /></template>
    <template #output-actions><ResultActions :session="session" :kind="`base64:${mode}`" /></template>
    <template #output><CodeEditor :key="mode" :model-value="session.output" :editor-key="`base64:${mode}:output`" label="处理结果" readonly placeholder="处理结果会显示在这里" /></template>
    <template #status><SessionStatus :session="session" /></template>
    <p v-if="session.error" class="notice error" role="alert">{{ session.error }}</p>
    <details class="workspace-disclosure"><summary>使用说明</summary><p>文本以 UTF-8 编解码，支持中文和 Emoji。两种模式分别保留草稿。自动处理上限 100 KB；更大内容请手动执行（输入上限 5 MB）。草稿刷新后清空。</p></details>
  </ToolWorkspace>
</template>
<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import ToolWorkspace from '../workspace/ToolWorkspace.vue'
import CodeEditor from '../workspace/CodeEditor.vue'
import InputActions from '../workspace/InputActions.vue'
import ResultActions from '../workspace/ResultActions.vue'
import SessionStatus from '../workspace/SessionStatus.vue'
import { useToolSession, getSession, isFresh, runOperation, stopJob, replaceInput } from '../../composables/useToolSession.js'
import { useCommands } from '../../composables/useCommands.js'
const settings = getSession('base64')
if (!['encode', 'decode'].includes(settings.options.mode)) settings.options.mode = 'encode'
const mode = computed({ get: () => settings.options.mode, set: value => { stopJob(session.value); settings.options.mode = value } })
const encode = useToolSession('base64:encode'), decode = useToolSession('base64:decode')
const session = computed(() => mode.value === 'encode' ? encode : decode)
const fresh = computed(() => isFresh(session.value)), workspace = ref(null), inputEditor = ref(null)
const example = '{"message":"你好，世界 🌍","id":9223372036854775807}'
const encodedExample = btoa(unescape(encodeURIComponent(example)))
let timer
async function run(automatic = false) {
  clearTimeout(timer)
  if (!session.value.input) return
  const current = session.value
  if (await runOperation(current, 'base64', mode.value)) if (!automatic && current === session.value) workspace.value?.showResult()
}
function reverse() {
  const text = session.value.output
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  replaceInput(session.value, text)
}
watch(() => [mode.value, session.value.input, session.value.options.auto], () => {
  clearTimeout(timer)
  if (session.value.options.auto && session.value.input && new TextEncoder().encode(session.value.input).length <= 100 * 1024) timer = setTimeout(() => run(true), 350)
})
onBeforeUnmount(() => clearTimeout(timer))
useCommands([{ name: '执行 Base64 转换', run: () => run() }, { name: '切换编码／解码', run: () => { mode.value = mode.value === 'encode' ? 'decode' : 'encode' } }, { name: '定位输入', run: () => inputEditor.value?.focus() }])
</script>
