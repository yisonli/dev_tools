<template>
  <ToolWorkspace ref="workspace" :id="kind" :title="`${kind.toUpperCase()} 工作区`" category="格式与接口" :fresh="fresh">
    <template #toolbar>
      <button class="btn btn-primary" :disabled="!session.input || running" @click="run('format')">格式化</button>
      <template v-if="kind === 'json'">
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('compact')">压缩</button>
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('escape')">转义</button>
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('unescape')">反转义</button>
        <select class="workspace-select" aria-label="格式转换" :value="''" :disabled="!session.input || running" @change="convert">
          <option value="" disabled>转换为…</option><option value="yaml">YAML</option><option value="csv">CSV</option><option value="xml">XML</option>
        </select>
      </template>
      <template v-else>
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('to-json')">转 JSON</button>
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('from-json')">JSON 转 YAML</button>
        <button class="btn btn-secondary" :disabled="!session.input || running" @click="run('validate')">仅校验</button>
      </template>
      <label class="auto-option"><input v-model="session.options.auto" type="checkbox" />自动格式化</label>
      <button v-if="running" class="icon-button" @click="stopJob(session)">取消处理</button>
    </template>
    <template #input-actions><InputActions :session="session" :example="example" /></template>
    <template #input><CodeEditor ref="inputEditor" v-model="session.input" :editor-key="`${kind}:input`" :language="kind" :label="`${kind.toUpperCase()} 输入`" :error-offset="session.offset" :error-message="session.error" @run="run('format')" /></template>
    <template #output-actions><ResultActions :session="session" :kind="kind" /></template>
    <template #output>
      <div class="output-view-tabs"><button :aria-pressed="view === 'code'" @click="view = 'code'">代码</button><button :disabled="!canTree" :aria-pressed="view === 'tree'" @click="view = 'tree'">树视图</button><span v-if="fresh && session.language === 'json' && !canTree">大内容请使用代码查找</span><span v-if="view === 'code' || !canTree" class="output-editor-actions"><button @click="outputEditor.find()">查找</button><button @click="outputEditor.toggleWrap()">切换换行</button></span></div>
      <CodeEditor v-show="view === 'code' || !canTree" ref="outputEditor" :model-value="session.output" :language="session.language" :editor-key="`${kind}:output`" readonly hide-toolbar label="处理结果" placeholder="处理结果会显示在这里" />
      <div v-if="view === 'tree' && tree" class="tree-panel"><JsonTree :key="session.resultRevision" :doc="tree" :node="tree.root" /></div>
    </template>
    <template #status><SessionStatus :session="session" /></template>
    <p v-if="session.error" class="notice error workspace-error" role="alert">{{ session.error }} <button v-if="session.offset != null" class="icon-button" @click="inputEditor.focusOffset(session.offset)">定位错误</button></p>
    <div class="query-bar"><label :for="`${kind}-path`">路径查询</label><input :id="`${kind}-path`" v-model="session.options.path" class="input-field" placeholder='$.user.name 或 $["含点的键"]' @keydown.enter="run('query')" /><button class="btn btn-secondary" :disabled="!session.input || running" @click="run('query')">查询</button></div>
    <details class="workspace-disclosure"><summary>模板与使用说明</summary><div class="template-buttons"><button v-for="template in templates" :key="template.name" class="icon-button" @click="replaceInput(session, template.text)">{{ template.name }}</button></div><p>Ctrl/Cmd+Enter 格式化；清空或加载示例后可恢复旧稿。草稿仅在当前页面会话中保留，刷新后清空。自动格式化仅处理 100 KB 以内的内容，更大内容请手动执行（上限 5 MB）。</p><p v-if="kind === 'json'">数字与字符串按原文保留。重复键可格式化，查询、转换与语义比较需要先消除歧义。</p><p v-else>支持多文档格式化。转换与路径查询每次处理一个文档；不能表示为 JSON 的值会明确报错。</p></details>
    <details v-if="session.stats && fresh" class="workspace-disclosure"><summary>结构统计</summary><p>类型 {{ session.stats.type }} · 深度 {{ session.stats.depth }} · 键 {{ session.stats.keys }} · 顶层数组项 {{ session.stats.items }}</p></details>
  </ToolWorkspace>
</template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import ToolWorkspace from './ToolWorkspace.vue'
import CodeEditor from './CodeEditor.vue'
import InputActions from './InputActions.vue'
import ResultActions from './ResultActions.vue'
import SessionStatus from './SessionStatus.vue'
import JsonTree from './JsonTree.vue'
import { useToolSession, isFresh, runOperation, stopJob, replaceInput } from '../../composables/useToolSession.js'
import { useCommands } from '../../composables/useCommands.js'
import { parseJsonDocument } from '../../utils/json.js'
import { notify } from '../../utils/clipboard.js'
const props = defineProps({ kind: String, example: String, templates: Array })
const session = useToolSession(props.kind), workspace = ref(null), inputEditor = ref(null), outputEditor = ref(null), view = ref('code')
const running = computed(() => session.status === 'running'), fresh = computed(() => isFresh(session))
const canTree = computed(() => fresh.value && session.language === 'json' && session.output.length <= 256 * 1024)
const tree = computed(() => { if (view.value !== 'tree' || !canTree.value) return null; try { return parseJsonDocument(session.output) } catch { return null } })
let timer
async function run(action, automatic = false) {
  clearTimeout(timer)
  if (!session.input) return
  if (await runOperation(session, props.kind, action)) {
    view.value = 'code'
    if (!automatic) workspace.value?.showResult()
  }
}
function convert(event) { const action = event.target.value; event.target.value = ''; run(action) }
watch(() => [session.input, session.options.auto], () => {
  clearTimeout(timer)
  if (session.options.auto && session.input && new TextEncoder().encode(session.input).length <= 100 * 1024) timer = setTimeout(() => run('format', true), 350)
})
onBeforeUnmount(() => clearTimeout(timer))
useCommands([
  { name: '格式化当前内容', run: () => run('format') },
  { name: '清空输入（可恢复）', run: () => replaceInput(session, '') },
  { name: '定位输入', run: () => inputEditor.value?.focus() },
  { name: '查看结果', run: () => fresh.value ? workspace.value?.showResult() : notify('请先处理当前输入。', 'error') },
])
</script>
