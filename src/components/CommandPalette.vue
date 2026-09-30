<template>
  <dialog ref="dialog" class="command-dialog" aria-label="搜索工具与操作" @close="commandPaletteOpen = false" @click="closeOnBackdrop">
    <div class="command-input"><Search :size="20" /><input ref="input" v-model="query" placeholder="搜索工具或当前操作…" aria-label="搜索工具或当前操作" role="combobox" aria-autocomplete="list" aria-controls="command-results" :aria-expanded="true" :aria-activedescendant="results.length ? `command-${selected}` : undefined" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="execute(results[selected])" /><button @click="dialog.close()" aria-label="关闭搜索">Esc</button></div>
    <ul id="command-results" role="listbox" class="command-results"><li v-for="(result, index) in results" :id="`command-${index}`" :key="result.id" role="option" :aria-selected="selected === index" @mousemove="selected = index" @click="execute(result)"><span>{{ result.name }}</span><small>{{ result.type }}</small></li></ul>
    <p v-if="!results.length" class="command-empty">没有匹配项，试试 JSON、解码或比较。</p>
    <footer>↑ ↓ 选择 · Enter 打开 · Esc 关闭</footer>
  </dialog>
</template>
<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Search } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { tools } from '../toolCatalog.js'
import { activeCommands, commandPaletteOpen } from '../composables/useCommands.js'
const router = useRouter(), dialog = ref(null), input = ref(null), query = ref(''), selected = ref(0)
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return [
    ...activeCommands.value.map((c, i) => ({ ...c, id: `action-${i}`, type: '当前操作', keywords: c.name })),
    ...tools.map(t => ({ id: t.path, name: t.name, type: t.category, keywords: `${t.name} ${t.description} ${t.aliases || ''}`, run: () => router.push(t.path) })),
  ].filter(c => !q || c.keywords.toLowerCase().includes(q)).slice(0, 25)
})
watch(query, () => { selected.value = 0 })
watch(commandPaletteOpen, async open => { if (open) { query.value = ''; selected.value = 0; dialog.value.showModal(); await nextTick(); input.value.focus() } else if (dialog.value.open) dialog.value.close() })
function move(delta) { if (!results.value.length) return; selected.value = (selected.value + delta + results.value.length) % results.value.length; document.getElementById(`command-${selected.value}`)?.scrollIntoView({ block: 'nearest' }) }
function execute(result) { if (!result) return; dialog.value.close(); nextTick(() => result.run()) }
function closeOnBackdrop(event) { if (event.target === dialog.value) { const r = dialog.value.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.value.close() } }
function shortcut(event) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); commandPaletteOpen.value = !commandPaletteOpen.value } }
onMounted(() => window.addEventListener('keydown', shortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', shortcut))
</script>
