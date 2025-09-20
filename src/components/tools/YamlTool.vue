<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">YAML 格式化/校验</h2>
        <p class="text-gray-600">
          YAML格式校验、美化、转换工具，支持语法检查、JSON互转和配置文件生成。
        </p>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- 输入区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-700">YAML 输入</h3>
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
              v-model="yamlInput"
              placeholder="请输入YAML数据..."
              class="textarea-field h-96 font-mono text-sm"
              @input="validateYaml"
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
                {{ isValid ? 'YAML格式正确' : hasError ? 'YAML格式错误' : '等待输入' }}
              </span>
            </div>
            <div v-if="yamlStats.lines" class="text-sm text-gray-500">
              {{ yamlStats.lines }} 行 | {{ yamlStats.characters }} 字符
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
              @click="formatYaml"
              class="btn btn-primary"
              :disabled="!isValid"
            >
              格式化
            </button>
            <button
              @click="convertToJson"
              class="btn btn-primary"
              :disabled="!isValid"
            >
              转JSON
            </button>
            <button
              @click="convertFromJson"
              class="btn btn-secondary"
            >
              JSON转YAML
            </button>
            <button
              @click="validateOnly"
              class="btn btn-secondary"
              :disabled="!yamlInput"
            >
              仅校验
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
                :disabled="!yamlOutput"
              >
                复制结果
              </button>
              <button
                @click="downloadYaml"
                class="btn btn-secondary text-sm"
                :disabled="!yamlOutput"
              >
                下载YAML
              </button>
            </div>
          </div>
          
          <div>
            <div
              v-if="yamlOutput"
              class="border rounded-lg p-3 h-96 overflow-auto bg-gray-50 font-mono text-sm whitespace-pre-wrap"
              v-html="highlightedYamlOutput"
            ></div>
            <div
              v-else
              class="border rounded-lg p-3 h-96 overflow-auto bg-gray-50 font-mono text-sm flex items-center justify-center text-gray-500"
            >
              处理结果将显示在这里...
            </div>
          </div>

          <!-- YAML路径查询 -->
          <div v-if="isValid" class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-800 mb-2">YAML 路径查询</h4>
            <div class="space-y-2">
              <input
                v-model="yamlPath"
                type="text"
                placeholder="例如: server.port 或 users[0].name"
                class="input-field text-sm"
                @input="queryYamlPath"
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

      <!-- YAML结构分析 -->
      <div v-if="isValid && yamlStructure" class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-3">YAML 结构分析</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">根类型</div>
            <div class="text-lg font-semibold">{{ yamlStructure.type }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">层级深度</div>
            <div class="text-lg font-semibold">{{ yamlStructure.depth }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">键数量</div>
            <div class="text-lg font-semibold">{{ yamlStructure.keyCount }}</div>
          </div>
          <div class="p-3 bg-white rounded">
            <div class="font-medium text-gray-600">数组元素</div>
            <div class="text-lg font-semibold">{{ yamlStructure.arrayLength }}</div>
          </div>
        </div>
      </div>

      <!-- 配置文件模板 -->
      <div class="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-3">配置文件模板</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            v-for="template in yamlTemplates"
            :key="template.name"
            @click="loadTemplate(template)"
            class="btn btn-secondary text-sm"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <!-- YAML语法提示 -->
      <div class="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h4 class="font-semibold text-yellow-800 mb-3">YAML 语法提示</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
          <div class="space-y-2">
            <div><strong>基本语法：</strong></div>
            <div>• 使用缩进表示层级（建议2个空格）</div>
            <div>• 键值对：<code class="bg-yellow-100 px-1">key: value</code></div>
            <div>• 数组：<code class="bg-yellow-100 px-1">- item</code></div>
            <div>• 字符串：可用引号包围</div>
          </div>
          <div class="space-y-2">
            <div><strong>注意事项：</strong></div>
            <div>• 不能使用Tab，只能使用空格</div>
            <div>• 冒号后必须有空格</div>
            <div>• 字符串中的特殊字符需要转义</div>
            <div>• 布尔值：true/false, yes/no</div>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 实时YAML语法校验和错误定位</li>
          <li>• 支持YAML和JSON相互转换</li>
          <li>• 路径查询支持点表示法和数组索引</li>
          <li>• 提供常用配置文件模板</li>
          <li>• 显示YAML结构统计信息</li>
          <li>• 支持多文档YAML（---分隔）</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import YAML from 'js-yaml'

export default {
  name: 'YamlTool',
  data() {
    return {
      yamlInput: '',
      yamlOutput: '',
      isValid: false,
      hasError: false,
      error: '',
      errorPosition: null,
      parsedYaml: null,
      yamlStats: {},
      yamlStructure: null,
      
      yamlPath: '',
      pathResult: null,
      pathError: '',
      
      yamlTemplates: [
        {
          name: 'Spring Boot',
          data: `server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: my-app
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    root: INFO
    com.example: DEBUG`
        },
        {
          name: 'Docker Compose',
          data: `version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - api

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: myapp
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:`
        },
        {
          name: 'GitHub Actions',
          data: `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build`
        },
        {
          name: 'Kubernetes',
          data: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "mysql-service"
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"

---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer`
        }
      ]
    }
  },
  computed: {
    highlightedYamlOutput() {
      if (!this.yamlOutput) return ''
      return this.highlightYaml(this.yamlOutput)
    }
  },
  methods: {
    validateYaml() {
      if (!this.yamlInput.trim()) {
        this.isValid = false
        this.hasError = false
        this.error = ''
        this.errorPosition = null
        this.parsedYaml = null
        this.yamlStats = {}
        this.yamlStructure = null
        return
      }
      
      try {
        this.parsedYaml = YAML.load(this.yamlInput)
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
        this.parsedYaml = null
        this.yamlStructure = null
        
        // 尝试定位错误位置
        this.locateError(e)
      }
    },
    
    locateError(error) {
      if (error.mark) {
        this.errorPosition = {
          line: error.mark.line + 1,
          column: error.mark.column + 1
        }
      } else {
        this.errorPosition = null
      }
    },
    
    calculateStats() {
      this.yamlStats = {
        lines: this.yamlInput.split('\n').length,
        characters: this.yamlInput.length
      }
    },
    
    analyzeStructure() {
      if (!this.parsedYaml) return
      
      this.yamlStructure = {
        type: Array.isArray(this.parsedYaml) ? 'Array' : typeof this.parsedYaml,
        depth: this.getMaxDepth(this.parsedYaml),
        keyCount: this.countKeys(this.parsedYaml),
        arrayLength: Array.isArray(this.parsedYaml) ? this.parsedYaml.length : 0
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
    
    formatYaml() {
      if (!this.isValid) return
      try {
        this.yamlOutput = YAML.dump(this.parsedYaml, {
          indent: 2,
          lineWidth: 120,
          noRefs: true
        })
      } catch (e) {
        this.yamlOutput = '格式化失败：' + e.message
      }
    },
    
    convertToJson() {
      if (!this.isValid) return
      try {
        this.yamlOutput = JSON.stringify(this.parsedYaml, null, 2)
      } catch (e) {
        this.yamlOutput = 'JSON转换失败：' + e.message
      }
    },
    
    convertFromJson() {
      try {
        const jsonData = JSON.parse(this.yamlInput)
        this.yamlOutput = YAML.dump(jsonData, {
          indent: 2,
          lineWidth: 120,
          noRefs: true
        })
      } catch (e) {
        this.yamlOutput = 'JSON解析失败：' + e.message
      }
    },
    
    validateOnly() {
      if (this.isValid) {
        this.yamlOutput = '✅ YAML格式正确\n\n结构信息：\n' +
          `- 类型：${this.yamlStructure.type}\n` +
          `- 层级深度：${this.yamlStructure.depth}\n` +
          `- 键数量：${this.yamlStructure.keyCount}\n` +
          `- 数组元素：${this.yamlStructure.arrayLength}`
      } else {
        this.yamlOutput = '❌ YAML格式错误\n\n' + this.error
      }
    },
    
    queryYamlPath() {
      if (!this.isValid || !this.yamlPath) {
        this.pathResult = null
        this.pathError = ''
        return
      }
      
      try {
        this.pathError = ''
        const result = this.evaluateYamlPath(this.parsedYaml, this.yamlPath)
        this.pathResult = typeof result === 'object' ? 
          YAML.dump(result, { indent: 2 }) : String(result)
      } catch (e) {
        this.pathError = '路径查询错误：' + e.message
        this.pathResult = null
      }
    },
    
    evaluateYamlPath(obj, path) {
      let current = obj
      
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
    
    loadExample() {
      this.yamlInput = `# 示例配置文件
app:
  name: "开发者工具集合"
  version: "1.0.0"
  debug: true

server:
  host: "localhost"
  port: 3000
  ssl:
    enabled: false
    cert: ""
    key: ""

database:
  type: "mysql"
  host: "localhost"
  port: 3306
  name: "myapp"
  credentials:
    username: "root"
    password: "password"

features:
  - name: "BASE64编码"
    enabled: true
  - name: "AES加密"
    enabled: true
  - name: "JSON校验"
    enabled: true

logging:
  level: "info"
  output: "console"
  formats:
    - "json"
    - "text"`
      
      this.validateYaml()
    },
    
    loadTemplate(template) {
      this.yamlInput = template.data
      this.validateYaml()
    },
    
    clearInput() {
      this.yamlInput = ''
      this.yamlOutput = ''
      this.validateYaml()
    },
    
    async copyOutput() {
      try {
        await navigator.clipboard.writeText(this.yamlOutput)
        this.showNotification('输出内容已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    downloadYaml() {
      if (!this.yamlOutput) return
      
      const blob = new Blob([this.yamlOutput], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'formatted.yaml'
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
    
    highlightYaml(yaml) {
      if (!yaml) return ''
      
      // 对YAML进行语法高亮
      return yaml
        .replace(/(^(\s*)#.*$)/gm, '<span class="text-gray-400 italic">$1</span>') // 注释（先处理，避免干扰其他规则）
        .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/gm, '$1<span class="text-blue-600">$2</span>:') // 键名
        .replace(/:\s*(".*?")/gm, ': <span class="text-green-600">$1</span>') // 带引号的字符串值
        .replace(/:\s*('.*?')/gm, ': <span class="text-green-600">$1</span>') // 单引号字符串值
        .replace(/:\s*(true|false|yes|no|on|off)(\s|$)/gm, ': <span class="text-orange-600">$1</span>$2') // 布尔值
        .replace(/:\s*(null|~)(\s|$)/gm, ': <span class="text-gray-500">$1</span>$2') // null值
        .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(\s|$)/gm, ': <span class="text-purple-600">$1</span>$2') // 数字
        .replace(/^(\s*)(- )/gm, '$1<span class="text-gray-700 font-bold">$2</span>') // 列表项标识符
        .replace(/:\s*([^\s][^\r\n]*?)(\s*$)/gm, ': <span class="text-green-700">$1</span>$2') // 无引号字符串值（最后处理）
    }
  },
  mounted() {
    this.loadExample()
  }
}
</script>
