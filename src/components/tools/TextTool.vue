<template>
  <ToolWorkspace ref="workspace" id="text" title="文本处理" category="格式与接口" :fresh="fresh">
    <template #toolbar>
      <select v-model="session.options.action" class="workspace-select" aria-label="文本操作">
        <option v-for="operation in operations" :key="operation.key" :value="operation.key">{{ operation.name }}</option>
      </select>
      <button class="btn btn-primary" :disabled="!session.input || running" @click="run()">处理</button>
      <button class="btn btn-secondary" :disabled="!fresh" @click="continueWithResult">结果用作输入</button>
      <button v-if="running" class="icon-button" @click="stopJob(session)">取消处理</button>
    </template>
    <template #input-actions><InputActions :session="session" :example="example" /></template>
    <template #input><CodeEditor ref="inputEditor" v-model="session.input" editor-key="text:input" label="输入文本" placeholder="每行一条内容，支持粘贴或导入文件…" @run="run()" /></template>
    <template #output-actions><ResultActions :session="session" kind="text" /></template>
    <template #output><CodeEditor :model-value="session.output" editor-key="text:output" readonly label="处理结果" placeholder="处理结果会显示在这里" /></template>
    <template #status><SessionStatus :session="session" /><span v-if="fresh">输出 {{ session.output ? session.output.split('\n').length : 0 }} 行 · {{ session.output.length }} 字符</span></template>
    <p v-if="session.error" class="notice error" role="alert">{{ session.error }}</p>
    <details class="workspace-disclosure">
      <summary>使用说明</summary>
      <p>先选择操作，再点击“处理”或按 Ctrl/Cmd+Enter。点击“结果用作输入”可继续进行去重、排序等操作，点击“恢复”可找回上一步输入。</p>
      <p>按行去重保留第一次出现的行，空格不同的行视为不同内容；需要时先去除行首尾空格。文件和内容上限 5 MB，草稿刷新后清空。</p>
    </details>
  </ToolWorkspace>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import ToolWorkspace from '../workspace/ToolWorkspace.vue'
import CodeEditor from '../workspace/CodeEditor.vue'
import InputActions from '../workspace/InputActions.vue'
import ResultActions from '../workspace/ResultActions.vue'
import SessionStatus from '../workspace/SessionStatus.vue'
import { useToolSession, isFresh, runOperation, stopJob, replaceInput } from '../../composables/useToolSession.js'
import { useCommands } from '../../composables/useCommands.js'

const operations = [
  { key: 'trim', name: '去除行首尾空格' }, { key: 'empty', name: '删除空行' },
  { key: 'unique', name: '按行去重' }, { key: 'sort', name: '按行排序' },
  { key: 'upper', name: '转大写' }, { key: 'lower', name: '转小写' },
]
const session = useToolSession('text'), workspace = ref(null), inputEditor = ref(null)
if (!operations.some(item => item.key === session.options.action)) session.options.action = 'trim'
const fresh = computed(() => isFresh(session)), running = computed(() => session.status === 'running')
const example = '  banana  \napple\n\nbanana\n  cherry\napple'

async function run(action = session.options.action) {
  if (!session.input) return
  session.options.action = action
  if (await runOperation(session, 'text', action)) workspace.value?.showResult()
}
async function continueWithResult() {
  if (!fresh.value) return
  replaceInput(session, session.output)
  workspace.value?.showInput()
  await nextTick()
  inputEditor.value?.focus()
}
useCommands(operations.map(operation => ({ name: operation.name, run: () => run(operation.key) })))
</script>
