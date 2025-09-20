<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">正则表达式测试验证</h2>
        <p class="text-gray-600">
          在线测试和验证正则表达式，支持匹配、替换、分组捕获等功能。
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：正则表达式设置 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">正则表达式设置</h3>
          
          <!-- 正则表达式输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              正则表达式
            </label>
            <div class="relative">
              <input
                v-model="regexPattern"
                type="text"
                placeholder="请输入正则表达式..."
                class="input-field font-mono"
                @input="testRegex"
              />
              <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span class="text-gray-400 font-mono">/</span>
                <span class="text-blue-600 font-mono">{{ regexFlags }}</span>
              </div>
            </div>
            <div v-if="regexError" class="text-red-600 text-sm mt-1">
              {{ regexError }}
            </div>
          </div>

          <!-- 正则表达式标志 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              标志选项
            </label>
            <div class="flex flex-wrap gap-3">
              <label v-for="flag in regexFlagOptions" :key="flag.value" class="flex items-center">
                <input
                  v-model="selectedFlags"
                  :value="flag.value"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="testRegex"
                />
                <span class="ml-2 text-sm">
                  <code class="font-mono bg-gray-100 px-1 rounded">{{ flag.value }}</code>
                  {{ flag.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- 测试文本 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              测试文本
            </label>
            <textarea
              v-model="testText"
              placeholder="请输入要测试的文本..."
              class="textarea-field h-32"
              @input="testRegex"
            ></textarea>
          </div>

          <!-- 常用正则模板 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              常用正则模板
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="template in regexTemplates"
                :key="template.name"
                @click="loadTemplate(template)"
                class="btn btn-secondary text-xs text-left"
                :title="template.description"
              >
                {{ template.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：测试结果 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">测试结果</h3>

          <!-- 匹配状态 -->
          <div class="p-3 rounded-lg border" :class="matchStatusClass">
            <div class="flex items-center">
              <div 
                class="w-3 h-3 rounded-full mr-2"
                :class="isMatched ? 'bg-green-500' : hasRegex ? 'bg-red-500' : 'bg-gray-300'"
              ></div>
              <span class="font-medium">
                {{ matchStatusText }}
              </span>
              <span v-if="matches.length > 0" class="ml-2 text-sm text-gray-600">
                ({{ matches.length }} 个匹配)
              </span>
            </div>
          </div>

          <!-- 匹配详情 -->
          <div v-if="matches.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              匹配详情
            </label>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="(match, index) in matches"
                :key="index"
                class="p-3 bg-green-50 border border-green-200 rounded"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-green-800">
                    匹配 {{ index + 1 }}
                  </span>
                  <span class="text-xs text-green-600">
                    位置: {{ match.index }} - {{ match.index + match[0].length - 1 }}
                  </span>
                </div>
                <div class="font-mono text-sm bg-white p-2 rounded border">
                  "{{ match[0] }}"
                </div>
                <div v-if="match.length > 1" class="mt-2">
                  <div class="text-xs text-green-700 mb-1">捕获组:</div>
                  <div class="space-y-1">
                    <div
                      v-for="(group, groupIndex) in match.slice(1)"
                      :key="groupIndex"
                      class="text-xs"
                    >
                      <span class="text-green-600">组{{ groupIndex + 1 }}:</span>
                      <span class="font-mono bg-white px-1 rounded">"{{ group || '(未捕获)' }}"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 高亮显示 -->
          <div v-if="testText">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              高亮显示
            </label>
            <div
              class="p-3 bg-gray-50 border rounded font-mono text-sm whitespace-pre-wrap"
              v-html="highlightedText"
            ></div>
          </div>
        </div>
      </div>

      <!-- 替换功能 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-3">替换功能</h4>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-blue-700 mb-2">
              替换为
            </label>
            <input
              v-model="replaceText"
              type="text"
              placeholder="输入替换文本（支持 $1, $2 等引用捕获组）"
              class="input-field"
              @input="performReplace"
            />
          </div>
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-blue-700 mb-2">
              替换结果
            </label>
            <textarea
              :value="replacedText"
              readonly
              class="textarea-field h-24 bg-white font-mono text-sm"
              placeholder="替换结果将显示在这里..."
            ></textarea>
          </div>
        </div>
        <div class="mt-3 flex space-x-2">
          <button
            @click="copyText(replacedText)"
            class="btn btn-primary text-sm"
            :disabled="!replacedText"
          >
            复制替换结果
          </button>
          <button
            @click="replaceInOriginal"
            class="btn btn-secondary text-sm"
            :disabled="!replacedText"
          >
            应用到测试文本
          </button>
        </div>
      </div>

      <!-- 分割功能 -->
      <div class="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-3">分割功能</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-green-700 mb-2">
              分割设置
            </label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <input
                  v-model.number="splitLimit"
                  type="number"
                  placeholder="分割限制（0为无限制）"
                  class="input-field flex-1"
                  min="0"
                  @input="performSplit"
                />
                <button
                  @click="performSplit"
                  class="btn btn-secondary text-sm"
                >
                  分割
                </button>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-green-700 mb-2">
              分割结果 ({{ splitResults.length }} 项)
            </label>
            <div class="max-h-24 overflow-y-auto bg-white border rounded p-2">
              <div
                v-for="(item, index) in splitResults"
                :key="index"
                class="text-sm font-mono border-b border-gray-100 py-1"
              >
                {{ index + 1 }}. "{{ item }}"
              </div>
              <div v-if="splitResults.length === 0" class="text-gray-500 text-sm">
                无分割结果
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 正则表达式分析 -->
      <div v-if="regexAnalysis" class="mt-8 p-4 bg-purple-50 rounded-lg">
        <h4 class="font-semibold text-purple-800 mb-3">正则表达式分析</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-3 bg-white rounded">
            <div class="text-xs text-purple-600">长度</div>
            <div class="text-lg font-semibold">{{ regexAnalysis.length }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="text-xs text-purple-600">捕获组</div>
            <div class="text-lg font-semibold">{{ regexAnalysis.groups }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="text-xs text-purple-600">量词</div>
            <div class="text-lg font-semibold">{{ regexAnalysis.quantifiers }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="text-xs text-purple-600">字符类</div>
            <div class="text-lg font-semibold">{{ regexAnalysis.charClasses }}</div>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 支持JavaScript标准正则表达式语法</li>
          <li>• i: 忽略大小写，g: 全局匹配，m: 多行模式，s: 单行模式</li>
          <li>• 替换支持 $1, $2 等捕获组引用</li>
          <li>• 高亮显示所有匹配项和捕获组</li>
          <li>• 提供常用正则模板快速开始</li>
          <li>• 实时分析正则表达式复杂度</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegexTool',
  data() {
    return {
      regexPattern: '',
      testText: '',
      selectedFlags: ['g', 'm'],
      regexError: '',
      matches: [],
      replaceText: '',
      replacedText: '',
      splitLimit: 0,
      splitResults: [],
      
      regexFlagOptions: [
        { value: 'g', label: '全局匹配' },
        { value: 'i', label: '忽略大小写' },
        { value: 'm', label: '多行模式' },
        { value: 's', label: '单行模式' },
        { value: 'u', label: 'Unicode模式' },
        { value: 'y', label: '粘性匹配' }
      ],
      
      regexTemplates: [
        {
          name: '邮箱地址',
          pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
          flags: ['i'],
          description: '验证邮箱地址格式',
          testText: 'user@example.com\ninvalid-email\ntest.email+tag@domain.co.uk'
        },
        {
          name: '手机号码',
          pattern: '^1[3-9]\\d{9}$',
          flags: [],
          description: '验证中国大陆手机号码',
          testText: '13812345678\n12345678901\n15987654321'
        },
        {
          name: '身份证号',
          pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
          flags: ['i'],
          description: '验证18位身份证号码',
          testText: '110101199001011234\n12345678901234567X\n123456789012345678'
        },
        {
          name: 'URL地址',
          pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
          flags: ['i'],
          description: '匹配HTTP/HTTPS URL',
          testText: 'https://www.example.com\nhttp://test.org/path?query=1\nftp://invalid.url'
        },
        {
          name: 'IPv4地址',
          pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
          flags: [],
          description: '验证IPv4地址',
          testText: '192.168.1.1\n255.255.255.255\n256.1.1.1\n127.0.0.1'
        },
        {
          name: '日期格式',
          pattern: '\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
          flags: ['g'],
          description: '匹配YYYY-MM-DD格式日期',
          testText: '2024-01-15\n2023-12-31\n2024-13-01\n今天是2024-06-15，明天是2024-06-16'
        },
        {
          name: '中文字符',
          pattern: '[\\u4e00-\\u9fff]+',
          flags: ['g'],
          description: '匹配中文字符',
          testText: 'Hello世界！This is测试文本with中文mixed内容。'
        },
        {
          name: 'HTML标签',
          pattern: '<\\/?[^>]+>',
          flags: ['g'],
          description: '匹配HTML标签',
          testText: '<div class="container"><p>Hello <b>World</b>!</p></div><br/>'
        },
        {
          name: '提取数字',
          pattern: '-?\\d+(\\.\\d+)?',
          flags: ['g'],
          description: '提取所有数字（包括小数和负数）',
          testText: '价格：￥123.45，折扣：-15%，数量：100个，温度：-5.5°C'
        },
        {
          name: '单词边界',
          pattern: '\\btest\\b',
          flags: ['gi'],
          description: '匹配完整单词test',
          testText: 'This is a test. Testing the test word in contest and testing.'
        },
        {
          name: '多行匹配',
          pattern: '^\\d+',
          flags: ['gm'],
          description: '匹配每行开头的数字（多行模式）',
          testText: '123 第一行\n456 第二行\n789 第三行\nabc 第四行\n999 第五行'
        }
      ]
    }
  },
  computed: {
    regexFlags() {
      return this.selectedFlags.join('')
    },
    
    hasRegex() {
      return this.regexPattern.trim() !== ''
    },
    
    isMatched() {
      return this.matches.length > 0
    },
    
    matchStatusText() {
      if (!this.hasRegex) return '等待输入正则表达式'
      if (this.regexError) return '正则表达式语法错误'
      if (!this.testText) return '等待输入测试文本'
      return this.isMatched ? '匹配成功' : '无匹配项'
    },
    
    matchStatusClass() {
      if (!this.hasRegex || !this.testText) return 'bg-gray-50 border-gray-200'
      if (this.regexError) return 'bg-red-50 border-red-200'
      return this.isMatched ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    },
    
    highlightedText() {
      if (!this.testText) {
        return ''
      }
      
      if (!this.hasRegex || this.regexError || this.matches.length === 0) {
        return this.escapeHtml(this.testText)
      }
      
      // 创建一个字符数组来处理
      const chars = [...this.testText]
      const highlights = new Array(chars.length).fill(false)
      
      // 标记所有需要高亮的字符位置
      this.matches.forEach(match => {
        for (let i = match.index; i < match.index + match[0].length; i++) {
          highlights[i] = true
        }
      })
      
      // 构建最终的HTML字符串
      let result = ''
      let inHighlight = false
      
      for (let i = 0; i < chars.length; i++) {
        const shouldHighlight = highlights[i]
        
        if (shouldHighlight && !inHighlight) {
          // 开始高亮
          result += '<mark class="bg-yellow-200 rounded px-1">'
          inHighlight = true
        } else if (!shouldHighlight && inHighlight) {
          // 结束高亮
          result += '</mark>'
          inHighlight = false
        }
        
        // 添加转义后的字符
        result += this.escapeHtml(chars[i])
      }
      
      // 如果最后还在高亮状态，需要关闭标签
      if (inHighlight) {
        result += '</mark>'
      }
      
      return result
    },
    
    regexAnalysis() {
      if (!this.hasRegex || this.regexError) return null
      
      const pattern = this.regexPattern
      return {
        length: pattern.length,
        groups: (pattern.match(/\(/g) || []).length,
        quantifiers: (pattern.match(/[*+?{}]/g) || []).length,
        charClasses: (pattern.match(/\[.*?\]/g) || []).length
      }
    }
  },
  methods: {
    testRegex() {
      this.matches = []
      this.regexError = ''
      
      if (!this.hasRegex || !this.testText) {
        this.performReplace()
        this.performSplit()
        return
      }
      
      try {
        const regex = new RegExp(this.regexPattern, this.regexFlags)
        const matches = []
        
        if (this.selectedFlags.includes('g')) {
          // 使用 String.matchAll 方法更可靠
          try {
            const matchIterator = this.testText.matchAll(regex)
            for (const match of matchIterator) {
              matches.push({
                ...match,
                index: match.index
              })
            }
          } catch (e) {
            // 如果 matchAll 失败，回退到传统方法
            let match
            regex.lastIndex = 0 // 重置正则表达式状态
            while ((match = regex.exec(this.testText)) !== null) {
              matches.push({
                ...match,
                index: match.index
              })
              
              // 防止无限循环
              if (match[0] === '') {
                regex.lastIndex = match.index + 1
              }
              
              // 安全退出
              if (regex.lastIndex > this.testText.length) {
                break
              }
            }
          }
        } else {
          const match = regex.exec(this.testText)
          if (match) {
            matches.push({
              ...match,
              index: match.index
            })
          }
        }
        
        this.matches = matches
        this.performReplace()
        this.performSplit()
        
      } catch (error) {
        this.regexError = error.message
      }
    },
    
    performReplace() {
      this.replacedText = ''
      
      if (!this.hasRegex || !this.testText || this.regexError) return
      
      try {
        const regex = new RegExp(this.regexPattern, this.regexFlags)
        this.replacedText = this.testText.replace(regex, this.replaceText)
      } catch (error) {
        this.replacedText = '替换错误: ' + error.message
      }
    },
    
    performSplit() {
      this.splitResults = []
      
      if (!this.hasRegex || !this.testText || this.regexError) return
      
      try {
        const regex = new RegExp(this.regexPattern, this.regexFlags.replace('g', ''))
        const limit = this.splitLimit > 0 ? this.splitLimit : undefined
        this.splitResults = this.testText.split(regex, limit)
      } catch (error) {
        console.error('分割错误:', error)
      }
    },
    
    loadTemplate(template) {
      this.regexPattern = template.pattern
      // 保持用户设置的默认flags，不被模板覆盖
      // this.selectedFlags = template.flags || []
      this.testText = template.testText || ''
      this.replaceText = ''
      this.testRegex()
    },
    
    replaceInOriginal() {
      if (this.replacedText && !this.replacedText.startsWith('替换错误')) {
        this.testText = this.replacedText
        this.testRegex()
      }
    },
    
    escapeHtml(text) {
      if (!text) return ''
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    
    async copyText(text) {
      if (!text) return
      
      try {
        await navigator.clipboard.writeText(text)
        this.showNotification('已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        this.showNotification('复制失败', 'error')
      }
    },
    
    showNotification(message, type = 'success') {
      const notification = document.createElement('div')
      notification.textContent = message
      const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
      notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 2000)
    }
  },
  mounted() {
    // 加载默认示例
    this.loadTemplate(this.regexTemplates[0])
    // 确保初始化后立即测试
    this.$nextTick(() => {
      this.testRegex()
    })
  }
}
</script>
