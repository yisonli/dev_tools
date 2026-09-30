<template>
  <label class="icon-button import-button">导入<input type="file" :accept="accept" :aria-label="fileLabel" @change="readFile" /></label>
  <button v-if="example" class="icon-button" @click="replaceInput(session, example, field)">示例</button>
  <button class="icon-button" :disabled="!(field === 'right' ? session.options.right : session.input)" @click="replaceInput(session, '', field)">清空</button>
  <button class="icon-button" :disabled="!session.undo" @click="restoreInput(session)">恢复</button>
</template>
<script setup>
import { replaceInput, restoreInput } from '../../composables/useToolSession.js'
import { notify } from '../../utils/clipboard.js'
const props = defineProps({ session: Object, example: String, field: { type: String, default: 'input' }, maxBytes: { type: Number, default: 5 * 1024 * 1024 }, fileLabel: { type: String, default: '导入文本文件' }, accept: { type: String, default: 'text/*,.json,.yaml,.yml,.csv,.xml,.log' } })
async function readFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > props.maxBytes) { notify(`文件超过 ${props.maxBytes / 1024 / 1024} MB，请拆分后导入。`, 'error'); return }
  const session = props.session, field = props.field, revision = session.revision
  try {
    const text = await file.text()
    if (session.revision !== revision) { notify('读取期间内容已修改，请重新导入文件。', 'error'); return }
    replaceInput(session, text, field)
  } catch { notify('文件读取失败，请重试。', 'error') }
}
</script>
