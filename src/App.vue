<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-2xl font-bold text-primary-600">开发者工具集</h1>
            </div>
          </div>
          
          <!-- 导航菜单 -->
          <div class="flex items-center space-x-1">
            <!-- 移动端菜单按钮 -->
            <div class="md:hidden">
              <button
                @click="showMobileMenu = !showMobileMenu"
                class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <!-- 桌面端菜单 -->
            <div class="hidden md:flex items-center space-x-1">
              <div class="relative" v-for="category in categories" :key="category">
                <button
                  @click="toggleCategory(category)"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center"
                >
                  {{ category }}
                  <svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <!-- 下拉菜单 -->
                <div
                  v-show="activeCategory === category"
                  class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                >
                  <router-link
                    v-for="tool in getToolsByCategory(category)"
                    :key="tool.path"
                    :to="tool.path"
                    @click="activeCategory = null"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    :class="$route.path === tool.path ? 'bg-primary-50 text-primary-700' : ''"
                  >
                    {{ tool.name }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 移动端菜单 -->
      <div v-show="showMobileMenu" class="md:hidden border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <div v-for="category in categories" :key="category" class="space-y-1">
            <div class="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50">
              {{ category }}
            </div>
            <router-link
              v-for="tool in getToolsByCategory(category)"
              :key="tool.path"
              :to="tool.path"
              @click="showMobileMenu = false"
              class="block px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              :class="$route.path === tool.path 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
            >
              {{ tool.name }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="animate-fade-in">
          <router-view />
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="bg-white border-t mt-auto">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500">
          <p>开发者工具集合 - 免费、安全、无广告的在线工具</p>
          <p class="mt-1">所有加密解密操作均在本地完成，数据不会上传到服务器</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      showMobileMenu: false,
      activeCategory: null,
      tools: [
        { name: 'BASE64编码', path: '/base64', category: '编码' },
        { name: 'URL编码', path: '/url', category: '编码' },
        { name: 'Unicode转换', path: '/unicode', category: '编码' },
        { name: 'AES加密', path: '/aes', category: '加密' },
        { name: 'DES加密', path: '/des', category: '加密' },
        { name: 'RSA加密', path: '/rsa', category: '加密' },
        { name: 'SM2加密', path: '/sm2', category: '加密' },
        { name: '二维码', path: '/qrcode', category: '图码' },
        { name: '条形码', path: '/barcode', category: '图码' },
        { name: 'JSON校验', path: '/json', category: '格式' },
        { name: 'YAML校验', path: '/yaml', category: '格式' },
        { name: '正则表达式', path: '/regex', category: '格式' },
        { name: '时间戳转换', path: '/timestamp', category: '工具' },
        { name: '密码生成器', path: '/password', category: '工具' }
      ]
    }
  },
  computed: {
    categories() {
      return [...new Set(this.tools.map(tool => tool.category))]
    }
  },
  methods: {
    getToolsByCategory(category) {
      return this.tools.filter(tool => tool.category === category)
    },
    toggleCategory(category) {
      this.activeCategory = this.activeCategory === category ? null : category
    }
  },
  mounted() {
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.relative')) {
        this.activeCategory = null
      }
    })
  }
}
</script>
