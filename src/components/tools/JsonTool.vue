<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">JSON 格式化/校验</h2>
        <p class="text-gray-600">
          JSON格式校验、美化、压缩、转换工具，支持语法检查、路径查询和数据转换。
        </p>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- 输入区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-700">JSON 输入</h3>
            <div class="flex space-x-2">
              <button
                @click="loadExample"
                class="btn btn-secondary text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearInput"
                class="btn btn-secondary text-sm"
              >
                清空
              </button>
            </div>
          </div>
          
          <div>
            <textarea
              v-model="jsonInput"
              placeholder="请输入JSON数据..."
              class="textarea-field h-96 font-mono text-sm"
              @input="validateJson"
            ></textarea>
          </div>

          <!-- 状态指示 -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div 
                class="w-3 h-3 rounded-full mr-2"
                :class="isValid ? 'bg-green-500' : hasError ? 'bg-red-500' : 'bg-gray-300'"
              ></div>
              <span class="text-sm">
                {{ isValid ? 'JSON格式正确' : hasError ? 'JSON格式错误' : '等待输入' }}
              </span>
            </div>
            <div v-if="jsonStats.lines" class="text-sm text-gray-500">
              {{ jsonStats.lines }} 行 | {{ jsonStats.characters }} 字符 | {{ jsonStats.size }} 字节
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="text-red-800 font-medium">语法错误：</div>
            <div class="text-red-700 text-sm mt-1">{{ error }}</div>
            <div v-if="errorPosition" class="text-red-600 text-xs mt-1">
              位置：第 {{ errorPosition.line }} 行，第 {{ errorPosition.column }} 列
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              @click="formatJson"
              class="btn btn-primary"
              :disabled="!isValid"
            >
              格式化
            </button>
            <button
              @click="compressJson"
              class="btn btn-primary"
              :disabled="!isValid"
            >
              压缩
            </button>
            <button
              @click="escapeJson"
              class="btn btn-secondary"
              :disabled="!jsonInput"
            >
              转义
            </button>
            <button
              @click="unescapeJson"
              class="btn btn-secondary"
              :disabled="!jsonInput"
            >
              反转义
            </button>
          </div>
        </div>

        <!-- 输出区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-700">处理结果</h3>
            <div class="flex space-x-2">
              <button
                @click="copyOutput"
                class="btn btn-secondary text-sm"
                :disabled="!jsonOutput"
              >
                复制结果
              </button>
              <button
                @click="downloadJson"
                class="btn btn-secondary text-sm"
                :disabled="!jsonOutput"
              >
                下载JSON
              </button>
            </div>
          </div>
          
          <div>
            <div
              v-if="jsonOutput"
              class="border rounded-lg p-3 h-96 overflow-auto bg-gray-50 font-mono text-sm whitespace-pre-wrap"
              v-html="highlightedJsonOutput"
            ></div>
            <div
              v-else
              class="border rounded-lg p-3 h-96 overflow-auto bg-gray-50 font-mono text-sm flex items-center justify-center text-gray-500"
            >
              处理结果将显示在这里...
            </div>
          </div>

          <!-- JSON路径查询 -->
          <div v-if="isValid" class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-800 mb-2">JSON 路径查询</h4>
            <div class="space-y-2">
              <input
                v-model="jsonPath"
                type="text"
                placeholder="例如: $.user.name 或 users[0].email"
                class="input-field text-sm"
                @input="queryJsonPath"
              />
              <div v-if="pathResult !== null" class="p-2 bg-white rounded border">
                <div class="text-xs text-gray-600 mb-1">查询结果：</div>
                <div class="font-mono text-sm">{{ pathResult }}</div>
              </div>
              <div v-if="pathError" class="text-red-600 text-sm">
                {{ pathError }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- JSON结构分析 -->
      <div v-if="isValid && jsonStructure" class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-3">JSON 结构分析</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">类型</div>
            <div class="text-lg font-semibold">{{ jsonStructure.type }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">层级深度</div>
            <div class="text-lg font-semibold">{{ jsonStructure.depth }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">键数量</div>
            <div class="text-lg font-semibold">{{ jsonStructure.keyCount }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">数组元素</div>
            <div class="text-lg font-semibold">{{ jsonStructure.arrayLength }}</div>
          </div>
        </div>
      </div>

      <!-- 转换工具 -->
      <div class="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-3">格式转换</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="convertToCSV"
            class="btn btn-secondary"
            :disabled="!isValid"
          >
            转换为 CSV
          </button>
          <button
            @click="convertToXML"
            class="btn btn-secondary"
            :disabled="!isValid"
          >
            转换为 XML
          </button>
          <button
            @click="convertToYAML"
            class="btn btn-secondary"
            :disabled="!isValid"
          >
            转换为 YAML
          </button>
        </div>
        <div v-if="convertResult" class="mt-4">
          <label class="block text-sm font-medium text-green-700 mb-2">
            转换结果
          </label>
          <textarea
            v-model="convertResult"
            readonly
            class="textarea-field h-32 bg-white font-mono text-sm"
          ></textarea>
        </div>
      </div>

      <!-- 常用JSON模板 -->
      <div class="mt-8 p-4 bg-purple-50 rounded-lg">
        <h4 class="font-semibold text-purple-800 mb-3">JSON 模板</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            v-for="template in jsonTemplates"
            :key="template.name"
            @click="loadTemplate(template)"
            class="btn btn-secondary text-sm"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 实时语法校验，错误位置定位</li>
          <li>• 支持JSON格式化、压缩、转义</li>
          <li>• JSON路径查询语法：$.key 或 array[index]</li>
          <li>• 支持转换为CSV、XML、YAML格式</li>
          <li>• 提供常用JSON模板快速生成</li>
          <li>• 显示JSON结构统计信息</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JsonTool',
  data() {
    return {
      jsonInput: '',
      jsonOutput: '',
      isValid: false,
      hasError: false,
      error: '',
      errorPosition: null,
      parsedJson: null,
      jsonStats: {},
      jsonStructure: null,
      
      jsonPath: '',
      pathResult: null,
      pathError: '',
      
      convertResult: '',
      
      jsonTemplates: [
        {
          name: '用户对象',
          data: {
            id: 1,
            name: "张三",
            email: "zhangsan@example.com",
            age: 30,
            city: "北京"
          }
        },
        {
          name: '用户列表',
          data: [
            { id: 1, name: "张三", email: "zhangsan@example.com" },
            { id: 2, name: "李四", email: "lisi@example.com" }
          ]
        },
        {
          name: 'API响应',
          data: {
            status: "success",
            code: 200,
            message: "操作成功",
            data: {
              users: [],
              total: 0,
              page: 1,
              pageSize: 10
            }
          }
        },
        {
          name: '配置文件',
          data: {
            app: {
              name: "MyApp",
              version: "1.0.0",
              debug: true
            },
            database: {
              host: "localhost",
              port: 3306,
              username: "root",
              password: "password"
            }
          }
        }
      ]
    }
  },
  computed: {
    highlightedJsonOutput() {
      if (!this.jsonOutput) return ''
      return this.highlightJson(this.jsonOutput)
    }
  },
  methods: {
    validateJson() {
      if (!this.jsonInput.trim()) {
        this.isValid = false
        this.hasError = false
        this.error = ''
        this.errorPosition = null
        this.parsedJson = null
        this.jsonStats = {}
        this.jsonStructure = null
        return
      }
      
      try {
        this.parsedJson = JSON.parse(this.jsonInput)
        this.isValid = true
        this.hasError = false
        this.error = ''
        this.errorPosition = null
        
        this.calculateStats()
        this.analyzeStructure()
        
      } catch (e) {
        this.isValid = false
        this.hasError = true
        this.error = e.message
        this.parsedJson = null
        this.jsonStructure = null
        
        // 尝试定位错误位置
        this.locateError(e)
      }
    },
    
    locateError(error) {
      const message = error.message
      const positionMatch = message.match(/position (\d+)/)
      
      if (positionMatch) {
        const position = parseInt(positionMatch[1])
        const lines = this.jsonInput.substring(0, position).split('\n')
        this.errorPosition = {
          line: lines.length,
          column: lines[lines.length - 1].length + 1
        }
      } else {
        this.errorPosition = null
      }
    },
    
    calculateStats() {
      this.jsonStats = {
        lines: this.jsonInput.split('\n').length,
        characters: this.jsonInput.length,
        size: new Blob([this.jsonInput]).size
      }
    },
    
    analyzeStructure() {
      if (!this.parsedJson) return
      
      this.jsonStructure = {
        type: Array.isArray(this.parsedJson) ? 'Array' : typeof this.parsedJson,
        depth: this.getMaxDepth(this.parsedJson),
        keyCount: this.countKeys(this.parsedJson),
        arrayLength: Array.isArray(this.parsedJson) ? this.parsedJson.length : 0
      }
    },
    
    getMaxDepth(obj, depth = 1) {
      if (typeof obj !== 'object' || obj === null) return depth
      
      let maxDepth = depth
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          maxDepth = Math.max(maxDepth, this.getMaxDepth(obj[key], depth + 1))
        }
      }
      return maxDepth
    },
    
    countKeys(obj) {
      if (typeof obj !== 'object' || obj === null) return 0
      
      let count = 0
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          count += this.countKeys(item)
        })
      } else {
        count = Object.keys(obj).length
        Object.values(obj).forEach(value => {
          count += this.countKeys(value)
        })
      }
      return count
    },
    
    formatJson() {
      if (!this.isValid) return
      this.jsonOutput = JSON.stringify(this.parsedJson, null, 2)
    },
    
    compressJson() {
      if (!this.isValid) return
      this.jsonOutput = JSON.stringify(this.parsedJson)
    },
    
    escapeJson() {
      this.jsonOutput = JSON.stringify(this.jsonInput)
    },
    
    unescapeJson() {
      try {
        this.jsonOutput = JSON.parse(this.jsonInput)
      } catch (e) {
        this.jsonOutput = '反转义失败：' + e.message
      }
    },
    
    queryJsonPath() {
      if (!this.isValid || !this.jsonPath) {
        this.pathResult = null
        this.pathError = ''
        return
      }
      
      try {
        this.pathError = ''
        // 简单的JSONPath实现
        const result = this.evaluateJsonPath(this.parsedJson, this.jsonPath)
        this.pathResult = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
      } catch (e) {
        this.pathError = '路径查询错误：' + e.message
        this.pathResult = null
      }
    },
    
    evaluateJsonPath(obj, path) {
      // 简化的JSONPath实现，支持基本语法
      let current = obj
      
      // 移除开头的 $. 或 $
      path = path.replace(/^\$\.?/, '')
      
      if (!path) return current
      
      const parts = path.split(/[\.\[\]]/).filter(part => part !== '')
      
      for (const part of parts) {
        if (part === '') continue
        
        if (/^\d+$/.test(part)) {
          // 数组索引
          current = current[parseInt(part)]
        } else {
          // 对象属性
          current = current[part]
        }
        
        if (current === undefined) {
          throw new Error(`路径不存在: ${part}`)
        }
      }
      
      return current
    },
    
    convertToCSV() {
      if (!this.isValid) return
      
      try {
        let csv = ''
        
        if (Array.isArray(this.parsedJson) && this.parsedJson.length > 0) {
          const firstItem = this.parsedJson[0]
          if (typeof firstItem === 'object') {
            // 获取表头
            const headers = Object.keys(firstItem)
            csv = headers.join(',') + '\n'
            
            // 添加数据行
            this.parsedJson.forEach(item => {
              const row = headers.map(header => {
                const value = item[header]
                return typeof value === 'string' ? `"${value}"` : value
              })
              csv += row.join(',') + '\n'
            })
          }
        } else {
          csv = '无法转换为CSV：数据不是对象数组'
        }
        
        this.convertResult = csv
      } catch (e) {
        this.convertResult = 'CSV转换失败：' + e.message
      }
    },
    
    convertToXML() {
      if (!this.isValid) return
      
      try {
        this.convertResult = this.jsonToXml(this.parsedJson, 'root')
      } catch (e) {
        this.convertResult = 'XML转换失败：' + e.message
      }
    },
    
    jsonToXml(obj, rootName = 'root', indent = '') {
      if (typeof obj !== 'object' || obj === null) {
        return `${indent}<${rootName}>${obj}</${rootName}>\n`
      }
      
      let xml = `${indent}<${rootName}>\n`
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          xml += this.jsonToXml(item, 'item', indent + '  ')
        })
      } else {
        Object.keys(obj).forEach(key => {
          xml += this.jsonToXml(obj[key], key, indent + '  ')
        })
      }
      
      xml += `${indent}</${rootName}>\n`
      return xml
    },
    
    convertToYAML() {
      if (!this.isValid) return
      
      try {
        this.convertResult = this.jsonToYaml(this.parsedJson)
      } catch (e) {
        this.convertResult = 'YAML转换失败：' + e.message
      }
    },
    
    jsonToYaml(obj, indent = 0) {
      const spaces = '  '.repeat(indent)
      
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (typeof item === 'object' && item !== null) {
            return `${spaces}- ${this.jsonToYaml(item, indent + 1)}`
          } else {
            return `${spaces}- ${item}`
          }
        }).join('\n')
      } else {
        return Object.keys(obj).map(key => {
          const value = obj[key]
          if (typeof value === 'object' && value !== null) {
            return `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`
          } else {
            return `${spaces}${key}: ${value}`
          }
        }).join('\n')
      }
    },
    
    loadExample() {
      this.jsonInput = JSON.stringify({
        "name": "开发者工具集合",
        "version": "1.0.0",
        "tools": [
          { "name": "BASE64", "category": "编码" },
          { "name": "AES", "category": "加密" },
          { "name": "JSON", "category": "格式化" }
        ],
        "config": {
          "theme": "light",
          "language": "zh-CN"
        }
      }, null, 2)
      this.validateJson()
    },
    
    loadTemplate(template) {
      this.jsonInput = JSON.stringify(template.data, null, 2)
      this.validateJson()
    },
    
    clearInput() {
      this.jsonInput = ''
      this.jsonOutput = ''
      this.convertResult = ''
      this.validateJson()
    },
    
    async copyOutput() {
      try {
        await navigator.clipboard.writeText(this.jsonOutput)
        this.showNotification('输出内容已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    downloadJson() {
      if (!this.jsonOutput) return
      
      const blob = new Blob([this.jsonOutput], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'formatted.json'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    },
    
    showNotification(message) {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    },
    
    highlightJson(json) {
      if (!json) return ''
      
      // 对JSON进行语法高亮
      return json
        .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="text-blue-600">$1</span>:')  // 属性名
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-green-600">$1</span>') // 字符串值
        .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ': <span class="text-purple-600">$1</span>') // 数字
        .replace(/:\s*(true|false)/g, ': <span class="text-orange-600">$1</span>') // 布尔值
        .replace(/:\s*(null)/g, ': <span class="text-gray-500">$1</span>') // null
        .replace(/([{}[\],])/g, '<span class="text-gray-700 font-bold">$1</span>') // 分隔符
    }
  },
  mounted() {
    this.loadExample()
  }
}
</script>
