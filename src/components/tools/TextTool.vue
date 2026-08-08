<template>
  <div class="tool-panel space-y-6">
    <header><p class="eyebrow">格式与接口</p><h2>文本处理</h2><p>面向日志、列表和配置片段的快速清理操作。</p></header>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section class="space-y-3"><label for="text-input" class="field-label">输入文本</label><textarea id="text-input" v-model="input" class="textarea-field h-80 font-mono text-sm" placeholder="每行一条内容" /><div class="flex flex-wrap gap-2"><button v-for="operation in operations" :key="operation.key" class="btn btn-secondary text-sm" type="button" @click="transform(operation.key)">{{ operation.name }}</button></div></section>
      <section class="space-y-3"><div class="result-heading"><label class="field-label">输出</label><button class="icon-button" title="复制结果" aria-label="复制结果" :disabled="!output" @click="copy">复制</button></div><textarea v-model="output" readonly class="textarea-field h-80 font-mono text-sm" placeholder="处理结果会显示在这里" /><p class="text-sm text-gray-500">{{ output ? `${output.split('\n').length} 行，${output.length} 个字符` : '等待处理' }}</p></section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextTool',
  data() { return { input: '', output: '', operations: [
    { key: 'trim', name: '去除行首尾空格' }, { key: 'empty', name: '删除空行' }, { key: 'unique', name: '按行去重' }, { key: 'sort', name: '按行排序' }, { key: 'upper', name: '转大写' }, { key: 'lower', name: '转小写' },
  ] } },
  methods: {
    transform(type) {
      const lines = this.input.split(/\r?\n/)
      const transforms = { trim: () => lines.map((line) => line.trim()), empty: () => lines.filter((line) => line.trim()), unique: () => [...new Set(lines)], sort: () => [...lines].sort((a, b) => a.localeCompare(b)), upper: () => [this.input.toUpperCase()], lower: () => [this.input.toLowerCase()] }
      this.output = transforms[type]().join('\n')
    },
    async copy() { if (this.output) await navigator.clipboard.writeText(this.output) },
  },
}
</script>
