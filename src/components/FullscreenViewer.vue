<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="fullscreen-overlay"
        @click.self="$emit('close')"
      >
        <div class="fullscreen-dialog">
          <!-- 顶栏 -->
          <div class="fullscreen-header">
            <span class="fullscreen-title">{{ title }}</span>
            <div class="fullscreen-actions">
              <button
                v-if="content"
                @click="copyContent"
                class="fullscreen-btn"
              >
                {{ copied ? '✓ 已复制' : '复制' }}
              </button>
              <button @click="$emit('close')" class="fullscreen-close">
                ✕
              </button>
            </div>
          </div>
          <!-- 内容区 -->
          <div
            class="fullscreen-body font-mono text-sm"
            :class="{ 'whitespace-pre-wrap': !isRaw }"
            v-html="renderedContent"
          ></div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
export default {
  name: 'FullscreenViewer',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '全屏查看' },
    content: { type: String, default: '' },
    highlighted: { type: String, default: '' },
    isRaw: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      copied: false,
    }
  },
  computed: {
    renderedContent() {
      return this.highlighted || this.escapeHtml(this.content)
    },
  },
  watch: {
    visible(val) {
      if (val) {
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', this.onKeydown)
      } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', this.onKeydown)
        this.copied = false
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    onKeydown(e) {
      if (e.key === 'Escape') this.$emit('close')
    },
    async copyContent() {
      try {
        await navigator.clipboard.writeText(this.content)
        this.copied = true
        setTimeout(() => (this.copied = false), 2000)
      } catch {
        /* fallback */
        const ta = document.createElement('textarea')
        ta.value = this.content
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        this.copied = true
        setTimeout(() => (this.copied = false), 2000)
      }
    },
    escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    },
  },
}
</script>

<style scoped>
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.fullscreen-dialog {
  width: 95vw;
  height: 95vh;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.fullscreen-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.fullscreen-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fullscreen-btn {
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.fullscreen-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.fullscreen-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.fullscreen-close:hover {
  background: #fee2e2;
  color: #dc2626;
}

.fullscreen-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  line-height: 1.6;
  color: #1f2937;
  background: #fff;
  word-break: break-all;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
