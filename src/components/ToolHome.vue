<template>
  <section class="space-y-8">
    <header class="tool-home-header">
      <p class="eyebrow">本地优先</p>
      <h1>开发者工具箱</h1>
      <p>常用处理、校验和生成工具，数据只在当前浏览器中处理。</p>
    </header>

    <section v-if="recentTools.length" aria-labelledby="recent-tools">
      <div class="section-heading"><h2 id="recent-tools">最近使用</h2><span>{{ recentTools.length }} 项</span></div>
      <div class="tool-grid compact">
        <router-link v-for="tool in recentTools" :key="tool.path" :to="tool.path" class="tool-card">
          <component :is="tool.icon" :size="19" aria-hidden="true" />
          <span>{{ tool.name }}</span>
        </router-link>
      </div>
    </section>

    <section v-if="favoriteTools.length" aria-labelledby="favorite-tools">
      <div class="section-heading"><h2 id="favorite-tools">收藏</h2><span>{{ favoriteTools.length }} 项</span></div>
      <div class="tool-grid compact">
        <router-link v-for="tool in favoriteTools" :key="tool.path" :to="tool.path" class="tool-card">
          <component :is="tool.icon" :size="19" aria-hidden="true" />
          <span>{{ tool.name }}</span>
        </router-link>
      </div>
    </section>

    <section aria-labelledby="all-tools">
      <div class="section-heading"><h2 id="all-tools">全部工具</h2><span>{{ tools.length }} 项</span></div>
      <div class="tool-grid">
        <article v-for="tool in tools" :key="tool.path" class="tool-card detailed">
          <router-link :to="tool.path" class="tool-card-link">
            <component :is="tool.icon" :size="21" aria-hidden="true" />
            <div><strong>{{ tool.name }}</strong><p>{{ tool.description }}</p></div>
          </router-link>
          <button class="favorite-button" type="button" :class="{ active: isFavorite(tool.path) }" :aria-label="isFavorite(tool.path) ? `取消收藏 ${tool.name}` : `收藏 ${tool.name}`" :title="isFavorite(tool.path) ? '取消收藏' : '收藏'" @click="toggleFavorite(tool.path)"><Star :size="17" :fill="isFavorite(tool.path) ? 'currentColor' : 'none'" /></button>
        </article>
      </div>
    </section>
  </section>
</template>

<script>
import { Star } from '@lucide/vue'
import { tools } from '../toolCatalog'

export default {
  name: 'ToolHome',
  components: { Star },
  data() {
    return { tools, favoritePaths: this.readPaths('dev-tools-favorites') }
  },
  computed: {
    favoriteTools() {
      return this.tools.filter((tool) => this.favoritePaths.includes(tool.path))
    },
    recentTools() {
      return this.readPaths('dev-tools-recent')
        .map((path) => this.tools.find((tool) => tool.path === path))
        .filter(Boolean)
    },
  },
  methods: {
    readPaths(key) {
      try {
        const paths = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(paths) ? paths : []
      } catch {
        return []
      }
    },
    isFavorite(path) {
      return this.favoritePaths.includes(path)
    },
    toggleFavorite(path) {
      this.favoritePaths = this.isFavorite(path) ? this.favoritePaths.filter((item) => item !== path) : [...this.favoritePaths, path]
      try { localStorage.setItem('dev-tools-favorites', JSON.stringify(this.favoritePaths)) } catch { /* Storage may be disabled. */ }
    },
  },
}
</script>
