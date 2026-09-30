<template>
  <span :class="{ 'status-error': session.status === 'error', 'status-success': fresh }">{{ labels[session.status] }}</span>
  <span>{{ session.input.length.toLocaleString() }} 字符</span>
  <span v-if="fresh">{{ session.elapsed }} ms</span>
  <span v-if="session.status === 'modified' && session.resultRevision >= 0">输入或选项已修改，请重新处理后复制结果。</span>
  <span v-if="session.warning">{{ session.warning }}</span>
</template>
<script setup>
import { computed } from 'vue'
import { isFresh } from '../../composables/useToolSession.js'
const props = defineProps({ session: Object })
const fresh = computed(() => isFresh(props.session))
const labels = { idle: '等待输入', modified: '待处理', running: '处理中…', success: '处理完成', error: '处理失败', cancelled: '已取消' }
</script>
