<template>
  <div class="tool-panel space-y-6">
    <header><p class="eyebrow">加密</p><h2>哈希摘要</h2><p>输入内容仅在浏览器本地计算，不可逆。</p></header>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section class="space-y-3">
        <label for="hash-input" class="field-label">输入内容</label>
        <textarea id="hash-input" v-model="input" class="textarea-field h-72 font-mono text-sm" placeholder="输入需要计算摘要的文本" @input="calculate" />
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-secondary" type="button" @click="input = ''; calculate()">清空</button>
          <label class="btn btn-secondary cursor-pointer">读取文本文件<input class="sr-only" type="file" accept="text/*,.json,.yaml,.yml,.xml,.csv" @change="readFile" /></label>
        </div>
      </section>
      <section class="space-y-3">
        <div class="flex items-center justify-between"><label class="field-label">计算结果</label><span class="text-sm text-gray-500">{{ byteLength }} 字节</span></div>
        <div v-for="result in results" :key="result.name" class="hash-result">
          <strong>{{ result.name }}</strong><code>{{ result.value || '等待输入' }}</code>
          <button type="button" class="icon-button" :aria-label="`复制 ${result.name}`" title="复制" :disabled="!result.value" @click="copy(result.value)">复制</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js'

export default {
  name: 'HashTool',
  data() { return { input: '', results: [
    { name: 'MD5', value: '' }, { name: 'SHA-1', value: '' }, { name: 'SHA-256', value: '' }, { name: 'SHA-512', value: '' },
  ] } },
  computed: { byteLength() { return new TextEncoder().encode(this.input).length } },
  methods: {
    calculate() {
      this.results = [
        { name: 'MD5', value: this.input ? CryptoJS.MD5(this.input).toString() : '' },
        { name: 'SHA-1', value: this.input ? CryptoJS.SHA1(this.input).toString() : '' },
        { name: 'SHA-256', value: this.input ? CryptoJS.SHA256(this.input).toString() : '' },
        { name: 'SHA-512', value: this.input ? CryptoJS.SHA512(this.input).toString() : '' },
      ]
    },
    readFile(event) {
      const file = event.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => { this.input = String(reader.result || ''); this.calculate() }
      reader.readAsText(file)
      event.target.value = ''
    },
    async copy(value) { await navigator.clipboard.writeText(value) },
  },
}
</script>
