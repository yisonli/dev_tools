<template>
  <div class="app-shell">
    <header class="mobile-header">
      <router-link class="brand" to="/"><Wrench :size="20" aria-hidden="true" /><span>工具箱</span></router-link>
      <button class="icon-button" type="button" title="打开导航" aria-label="打开导航" @click="mobileOpen = true"><Menu :size="21" /></button>
    </header>

    <aside class="sidebar" :class="{ 'is-open': mobileOpen }" aria-label="工具导航">
      <div class="sidebar-top">
        <router-link class="brand" to="/" @click="mobileOpen = false"><Wrench :size="22" aria-hidden="true" /><span>工具箱</span></router-link>
        <button class="mobile-close icon-button" type="button" title="关闭导航" aria-label="关闭导航" @click="mobileOpen = false"><X :size="20" /></button>
        <label class="tool-search"><Search :size="17" aria-hidden="true" /><input v-model.trim="query" type="search" placeholder="搜索工具" aria-label="搜索工具" /></label>
      </div>

      <nav class="tool-nav">
        <p class="nav-label">工具库</p>
        <router-link to="/" class="nav-link" @click="mobileOpen = false"><LayoutGrid :size="18" />全部工具</router-link>
        <section v-for="category in categories.slice(1)" :key="category" class="nav-category">
          <button class="nav-link category-link" :class="{ active: isExpanded(category) }" type="button" :aria-expanded="isExpanded(category)" @click="toggleCategory(category)">
            <component :is="categoryIcon(category)" :size="18" />
            <span>{{ category }}</span>
            <ChevronDown class="category-chevron" :size="16" aria-hidden="true" />
          </button>
          <div v-show="isExpanded(category)" class="subnav">
            <router-link v-for="tool in getToolsByCategory(category)" :key="tool.path" :to="tool.path" class="nav-link subnav-link" @click="mobileOpen = false"><component :is="tool.icon" :size="16" />{{ tool.name }}</router-link>
          </div>
        </section>
        <div v-if="query" class="search-results">
          <p class="nav-label">匹配工具</p>
          <router-link v-for="tool in visibleTools" :key="tool.path" :to="tool.path" class="nav-link result-link" @click="closeSearch"><component :is="tool.icon" :size="17" />{{ tool.name }}</router-link>
          <p v-if="!visibleTools.length" class="empty-result">没有匹配的工具</p>
        </div>
      </nav>

      <div class="sidebar-bottom">
        <router-link class="nav-link" to="/" @click="mobileOpen = false"><Clock3 :size="18" />最近使用</router-link>
        <a class="nav-link" href="https://blog.7ys.top/" target="_blank" rel="noopener"><ArrowUpRight :size="18" />返回博客</a>
      </div>
    </aside>
    <button v-if="mobileOpen" class="sidebar-backdrop" type="button" aria-label="关闭导航" @click="mobileOpen = false" />

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { ArrowUpRight, ChevronDown, Clock3, Code2, FileJson, Grid2X2, LayoutGrid, LockKeyhole, Menu, QrCode, Search, Wrench, X } from '@lucide/vue'
import { categories, tools } from './toolCatalog'

export default {
  name: 'App',
  components: { ArrowUpRight, ChevronDown, Clock3, Code2, FileJson, Grid2X2, LayoutGrid, LockKeyhole, Menu, QrCode, Search, Wrench, X },
  data() { return { categories, tools, query: '', expandedCategories: [categories[1]], mobileOpen: false } },
  computed: {
    visibleTools() {
      const keyword = this.query.toLocaleLowerCase('zh-CN')
      return this.tools.filter((tool) => !keyword || `${tool.name} ${tool.description} ${tool.category}`.toLocaleLowerCase('zh-CN').includes(keyword))
    },
  },
  watch: {
    $route: { immediate: true, handler(route) { this.mobileOpen = false; this.recordRecent(route.path); document.title = route.meta?.title ? `${route.meta.title} | 工具箱` : '工具箱 - 本地开发者工具' } },
  },
  methods: {
    categoryIcon(category) { return ({ 编码: Code2, 加密: LockKeyhole, '格式与接口': FileJson, 图码: QrCode, 常用: Grid2X2 })[category] || Wrench },
    getToolsByCategory(category) { return this.tools.filter((tool) => tool.category === category) },
    isExpanded(category) { return this.expandedCategories.includes(category) },
    toggleCategory(category) { this.expandedCategories = this.isExpanded(category) ? this.expandedCategories.filter((item) => item !== category) : [...this.expandedCategories, category] },
    closeSearch() { this.query = ''; this.mobileOpen = false },
    recordRecent(path) {
      if (!this.tools.some((tool) => tool.path === path)) return
      try { const current = JSON.parse(localStorage.getItem('dev-tools-recent') || '[]'); localStorage.setItem('dev-tools-recent', JSON.stringify([path, ...current.filter((item) => item !== path)].slice(0, 6))) } catch { /* Storage may be disabled. */ }
    },
  },
}
</script>
