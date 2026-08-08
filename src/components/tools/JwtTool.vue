<template>
  <div class="tool-panel space-y-6">
    <header><p class="eyebrow">格式与接口</p><h2>JWT 解析</h2><p>只读取 Token 的公开头部和载荷，不会验证签名或上传 Token。</p></header>
    <textarea v-model="token" class="textarea-field h-32 font-mono text-sm" placeholder="粘贴 header.payload.signature" @input="decode" />
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <div v-if="metadata.length" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div v-for="item in metadata" :key="item.label" class="stat"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section><div class="result-heading"><h3>Header</h3><button class="icon-button" title="复制 Header" aria-label="复制 Header" @click="copy(headerText)">复制</button></div><pre>{{ headerText || '等待输入' }}</pre></section>
      <section><div class="result-heading"><h3>Payload</h3><button class="icon-button" title="复制 Payload" aria-label="复制 Payload" @click="copy(payloadText)">复制</button></div><pre>{{ payloadText || '等待输入' }}</pre></section>
    </div>
  </div>
</template>

<script>
function decodeSegment(segment) {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

export default {
  name: 'JwtTool',
  data() { return { token: '', header: null, payload: null, error: '' } },
  computed: {
    headerText() { return this.header ? JSON.stringify(this.header, null, 2) : '' },
    payloadText() { return this.payload ? JSON.stringify(this.payload, null, 2) : '' },
    metadata() {
      if (!this.payload) return []
      const expiration = this.payload.exp ? new Date(this.payload.exp * 1000) : null
      return [
        { label: '算法', value: this.header?.alg || '未声明' },
        { label: '主题', value: this.payload.sub || '未声明' },
        { label: '状态', value: !expiration ? '未声明过期时间' : expiration > new Date() ? '有效期内' : '已过期' },
      ]
    },
  },
  methods: {
    decode() {
      this.error = ''; this.header = null; this.payload = null
      if (!this.token.trim()) return
      const parts = this.token.trim().split('.')
      if (parts.length !== 3) { this.error = 'JWT 必须由三个以英文句点分隔的部分组成。'; return }
      try { this.header = decodeSegment(parts[0]); this.payload = decodeSegment(parts[1]) } catch { this.error = '无法解析 Token，请检查它是否为有效的 Base64URL 编码 JWT。' }
    },
    async copy(value) { if (value) await navigator.clipboard.writeText(value) },
  },
}
</script>
