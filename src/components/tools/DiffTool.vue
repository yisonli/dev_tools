<template>
  <ToolWorkspace id="diff" :initial-pane="route.query.side === 'right' ? 'output' : 'input'" title="差异对比" category="格式与接口" input-title="原始内容" output-title="修改后内容" :fresh="fresh">
    <template #toolbar>
      <select v-model="session.options.mode" class="workspace-select" aria-label="比较模式"><option value="text">文本比较</option><option value="json">JSON 语义比较</option></select>
      <label v-if="session.options.mode === 'text'" class="auto-option"><input v-model="session.options.ignoreWhitespace" type="checkbox" />忽略行首尾空白</label>
      <label v-else class="auto-option"><input v-model="session.options.sortKeys" type="checkbox" />忽略对象键顺序</label>
      <button class="btn btn-primary" :disabled="session.status === 'running'" @click="run">比较</button>
      <button class="btn btn-secondary" :disabled="!session.input && !session.options.right" @click="swapInputs(session)">交换左右</button>
      <button v-if="session.status === 'running'" class="icon-button" @click="stopJob(session)">取消处理</button>
    </template>
    <template #input-actions><InputActions :session="session" :example="example" :max-bytes="1024 * 1024" /></template>
    <template #input><CodeEditor v-model="session.input" editor-key="diff:left" :language="session.options.mode" label="原始内容" @run="run" /></template>
    <template #output-actions><InputActions :session="session" field="right" :max-bytes="1024 * 1024" file-label="导入修改后文件" /></template>
    <template #output><CodeEditor v-model="session.options.right" editor-key="diff:right" :language="session.options.mode" label="修改后内容" @run="run" /></template>
    <template #status><SessionStatus :session="session" /><span v-if="fresh">{{ blocks.length }} 处增删 · {{ added }} 行新增 · {{ removed }} 行删除</span></template>
    <p v-if="session.error" class="notice error" role="alert">{{ session.error }}<button v-if="session.options.mode === 'json'" class="icon-button" @click="session.options.mode = 'text'">改用文本比较</button></p>
    <section v-if="fresh" ref="results" class="diff-results" aria-label="比较结果">
      <div class="diff-heading"><h2>{{ blocks.length ? '差异详情' : '两份内容一致' }}</h2><div><button class="icon-button" :disabled="!blocks.length" @click="jump(-1)">上一处</button><span v-if="blocks.length"> {{ active + 1 }} / {{ blocks.length }} </span><button class="icon-button" :disabled="!blocks.length" @click="jump(1)">下一处</button></div></div>
      <p v-if="session.options.mode === 'json'" class="muted">结果按 JSON 值规范化后比较；数值等价的写法视为相同，数组顺序和字符串内容仍参与比较。</p>
      <div v-for="(change, index) in session.changes" :key="index" class="diff-block" :class="{ added: change.added, removed: change.removed, active: blockIndices[active] === index }" :data-change="change.added || change.removed ? index : undefined" tabindex="-1">
        <div class="diff-block-label">{{ change.added ? '＋ 新增' : change.removed ? '− 删除' : '相同内容' }} · {{ change.count }} 行</div>
        <pre v-if="change.added || change.removed">{{ preview(change.value) }}</pre><details v-else><summary>展开相同内容</summary><pre>{{ preview(change.value) }}</pre></details>
      </div>
    </section>
    <details class="workspace-disclosure"><summary>使用说明</summary><p>每侧最多 1 MB，复杂比较有时间限制。JSON 语义比较保留数组顺序，拒绝重复键；格式不同的数字按精确值比较。每块预览最多显示 20000 字符，完整原文保留在上方编辑区。草稿刷新后清空。</p></details>
  </ToolWorkspace>
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import ToolWorkspace from '../workspace/ToolWorkspace.vue'
import CodeEditor from '../workspace/CodeEditor.vue'
import InputActions from '../workspace/InputActions.vue'
import SessionStatus from '../workspace/SessionStatus.vue'
import { useToolSession, isFresh, runOperation, stopJob, swapInputs } from '../../composables/useToolSession.js'
import { useCommands } from '../../composables/useCommands.js'
const route = useRoute()
const session = useToolSession('diff'), results = ref(null), active = ref(0)
const fresh = computed(() => isFresh(session))
const blocks = computed(() => session.changes.filter(c => c.added || c.removed))
const blockIndices = computed(() => session.changes.flatMap((c, i) => c.added || c.removed ? [i] : []))
const added = computed(() => blocks.value.filter(c => c.added).reduce((sum, c) => sum + c.count, 0)), removed = computed(() => blocks.value.filter(c => c.removed).reduce((sum, c) => sum + c.count, 0))
const example = '{\n  "name": "工具箱",\n  "version": 1\n}'
const preview = text => text.length > 20000 ? text.slice(0, 20000) + '\n…本块预览已截断，请在编辑区查看完整内容。' : text
async function run() { if (await runOperation(session, 'diff')) { active.value = 0; await nextTick(); results.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }) } }
function jump(direction) { active.value = (active.value + direction + blocks.value.length) % blocks.value.length; const el = results.value?.querySelector(`[data-change="${blockIndices.value[active.value]}"]`); el?.focus(); el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
useCommands([{ name: '比较两份内容', run }, { name: '下一处差异', run: () => { if (fresh.value && blocks.value.length) jump(1) } }])
</script>
