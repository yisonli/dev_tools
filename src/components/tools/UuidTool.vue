<template>
  <div class="tool-panel space-y-6">
    <header><p class="eyebrow">常用</p><h2>UUID 生成器</h2><p>使用浏览器安全随机源生成 UUID v4。</p></header>
    <div class="flex flex-wrap gap-3 items-end"><label class="w-36"><span class="field-label">生成数量</span><input v-model.number="count" min="1" max="100" type="number" class="input-field" /></label><button class="btn btn-primary" type="button" @click="generate">生成</button><button class="btn btn-secondary" type="button" :disabled="!values.length" @click="copyAll">复制全部</button></div>
    <ol v-if="values.length" class="uuid-list"><li v-for="value in values" :key="value"><code>{{ value }}</code><button class="icon-button" type="button" title="复制 UUID" aria-label="复制 UUID" @click="copy(value)">复制</button></li></ol>
  </div>
</template>

<script>
export default {
  name: 'UuidTool', data() { return { count: 5, values: [] } }, mounted() { this.generate() },
  methods: {
    generate() { const total = Math.max(1, Math.min(100, Number(this.count) || 1)); this.count = total; this.values = Array.from({ length: total }, () => crypto.randomUUID()) },
    async copy(value) { await navigator.clipboard.writeText(value) },
    async copyAll() { await this.copy(this.values.join('\n')) },
  },
}
</script>
