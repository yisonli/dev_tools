<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <header class="mobile-header">
      <router-link class="brand" to="/"><Wrench :size="20" /><span>工具箱</span></router-link>
      <div class="mobile-actions"><button class="icon-button" aria-label="搜索工具" @click="commandPaletteOpen = true"><Search :size="20" /></button><button ref="menuButton" class="icon-button" aria-label="打开导航" @click="openMobile"><Menu :size="20" /></button></div>
    </header>
    <aside ref="sidebar" class="sidebar" :class="{ 'is-open': mobileOpen }" :inert="isMobile && !mobileOpen || undefined" aria-label="工具导航" @keydown="navigationKeys">
      <div class="sidebar-top">
        <router-link class="brand" to="/" aria-label="工具箱首页" @click="closeMobile"><Wrench :size="22" /><span>工具箱</span></router-link>
        <button class="mobile-close icon-button" aria-label="关闭导航" @click="closeMobile"><X :size="20" /></button>
        <button class="tool-search" aria-label="搜索工具与操作" title="搜索工具与操作 (Ctrl/Cmd+K)" @click="commandPaletteOpen = true"><Search :size="18" /><span>搜索工具与操作</span><kbd>⌘ K</kbd></button>
      </div>
      <nav class="tool-nav">
        <router-link to="/" class="nav-link" title="全部工具" @click="closeMobile"><LayoutGrid :size="18" /><span>全部工具</span></router-link>
        <template v-if="collapsed">
          <router-link v-for="tool in tools" :key="tool.path" :to="tool.path" class="nav-link collapsed-tool" :title="tool.name" :aria-label="tool.name" @click="closeMobile"><component :is="tool.icon" :size="18" /><span>{{ tool.name }}</span></router-link>
        </template>
        <template v-else>
          <section v-for="category in categories.slice(1)" :key="category" class="nav-category">
            <button class="nav-link category-link" :class="{ active: expanded.includes(category) }" :aria-expanded="expanded.includes(category)" @click="toggleCategory(category)"><component :is="categoryIcon(category)" :size="18" /><span>{{ category }}</span><ChevronDown class="category-chevron" :size="16" /></button>
            <div v-show="expanded.includes(category)" class="subnav"><router-link v-for="tool in tools.filter(t => t.category === category)" :key="tool.path" :to="tool.path" class="nav-link subnav-link" @click="closeMobile"><component :is="tool.icon" :size="16" />{{ tool.name }}</router-link></div>
          </section>
        </template>
      </nav>
      <div class="sidebar-bottom">
        <router-link class="nav-link" :to="{ path: '/', hash: '#recent-tools' }" title="最近使用" @click="closeMobile"><Clock3 :size="18" /><span>最近使用</span></router-link>
        <a class="nav-link" href="https://blog.7ys.top/" target="_blank" rel="noopener" title="返回博客"><ArrowUpRight :size="18" /><span>返回博客</span></a>
        <button class="nav-link sidebar-toggle" :aria-label="collapsed ? '展开导航' : '收起导航'" :title="collapsed ? '展开导航' : '收起导航'" @click="collapsed = !collapsed"><PanelLeftClose v-if="!collapsed" :size="18" /><PanelLeftOpen v-else :size="18" /><span>收起导航</span></button>
      </div>
    </aside>
    <button v-if="mobileOpen" class="sidebar-backdrop" aria-label="关闭导航" @click="closeMobile" />
    <main class="main-content" :class="{ 'workspace-content': workspaceRoute }" :inert="mobileOpen || undefined"><router-view /></main>
    <CommandPalette /><AppToast />
  </div>
</template>
<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpRight, ChevronDown, Clock3, Code2, FileJson, Grid2X2, LayoutGrid, LockKeyhole, Menu, PanelLeftClose, PanelLeftOpen, QrCode, Search, Wrench, X } from '@lucide/vue'
import { tools, categories } from './toolCatalog.js'
import { commandPaletteOpen } from './composables/useCommands.js'
import CommandPalette from './components/CommandPalette.vue'
import AppToast from './components/AppToast.vue'
const route = useRoute(), mobileOpen = ref(false), sidebar = ref(null), menuButton = ref(null), expanded = ref([categories[1]])
const media = window.matchMedia('(max-width: 768px)'), isMobile = ref(media.matches)
function onViewportChange(event) { isMobile.value = event.matches; if (!event.matches) mobileOpen.value = false }
onMounted(() => media.addEventListener('change', onViewportChange))
onBeforeUnmount(() => media.removeEventListener('change', onViewportChange))
let initial = false
try { initial = localStorage.getItem('dev-tools-sidebar-collapsed') === 'true' } catch { /* Optional. */ }
const collapsed = ref(initial)
const workspaceRoute = computed(() => ['/json', '/yaml', '/base64', '/diff', '/text'].includes(route.path))
watch(collapsed, value => { try { localStorage.setItem('dev-tools-sidebar-collapsed', String(value)) } catch { /* Optional. */ } })
watch(() => route.path, path => {
  mobileOpen.value = false
  const tool = tools.find(t => t.path === path)
  if (tool && !expanded.value.includes(tool.category)) expanded.value.push(tool.category)
  document.title = tool ? `${tool.name} | 工具箱` : '工具箱 - 本地开发者工具'
  if (tool) try { const parsed = JSON.parse(localStorage.getItem('dev-tools-recent') || '[]'); const current = Array.isArray(parsed) ? parsed : []; localStorage.setItem('dev-tools-recent', JSON.stringify([path, ...current.filter(p => p !== path)].slice(0, 6))) } catch { /* Optional. */ }
}, { immediate: true })
function categoryIcon(category) { return ({ 编码: Code2, 加密: LockKeyhole, '格式与接口': FileJson, 图码: QrCode, 常用: Grid2X2 })[category] || Wrench }
function toggleCategory(category) { expanded.value = expanded.value.includes(category) ? expanded.value.filter(c => c !== category) : [...expanded.value, category] }
async function openMobile() { mobileOpen.value = true; await nextTick(); sidebar.value.querySelector('.mobile-close').focus() }
function closeMobile() { const wasOpen = mobileOpen.value; mobileOpen.value = false; if (wasOpen) menuButton.value?.focus() }
function navigationKeys(event) {
  if (!mobileOpen.value) return
  if (event.key === 'Escape') { closeMobile(); return }
  if (event.key !== 'Tab') return
  const nodes = [...sidebar.value.querySelectorAll('a,button,input')].filter(n => n.getClientRects().length && !n.disabled)
  if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus() }
  else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus() }
}
</script>
